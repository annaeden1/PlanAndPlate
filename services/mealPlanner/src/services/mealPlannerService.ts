import axios from "axios";
import { MealPlan, IMealPlan } from "../models/mealPlanModel";
import { Recipe, IRecipe } from "../models/recipeModel";
import { UserFavorites } from "../models/userFavoritesModel";
import {
  generateMealPlan,
  getRecipeDetails as getSpoonacularRecipe,
  getRecipeDetailsBulk,
} from "./spoonacularService.service";
import { normalizeUnit } from "../utils/types/units";
import { nutrients } from "../utils/types/spoonacularTypes";
import { calcTargets } from "../utils/calorieCalculator";

class MealPlannerService {
  async createWeeklyPlan(
    userId: string,
    date?: string,
    token?: string,
  ): Promise<IMealPlan & any> {
    const refDate = date ? new Date(date) : new Date();
    if (isNaN(refDate.getTime())) {
      throw new Error(`Invalid date: ${date}`);
    }
    const weekStart = new Date(refDate);
    weekStart.setDate(refDate.getDate() - refDate.getDay());

    const userPreferences = await axios.get(
      `${process.env.USER_MANAGMENT_URL}/userManagement/${userId}/preferences`,
      { headers: { Authorization: token } },
    );

    const allergyExcludeString = Array.isArray(
      userPreferences.data.userPreferences.allergies,
    )
      ? userPreferences.data.userPreferences.allergies.join(",")
      : userPreferences.data.userPreferences.allergies || "";

    const diet = Array.isArray(userPreferences.data.userPreferences.diet)
      ? userPreferences.data.userPreferences.diet[0] || ""
      : userPreferences.data.userPreferences.diet || "";

    const targets = calcTargets(
      userPreferences.data.userPreferences.bodyStats,
      userPreferences.data.userPreferences.healthGoal,
    );

    const weeklyPlanFromAPI = await generateMealPlan(
      diet,
      allergyExcludeString,
      targets?.targetCalories,
    );

    const allRecipeIds: number[] = [];
    Object.values(weeklyPlanFromAPI.week).forEach((day: any) => {
      if (day.meals) {
        day.meals.forEach((meal: any) => {
          allRecipeIds.push(meal.id);
        });
      }
    });

    const caloriesMap: { [key: number]: number } = {};
    const missingIds: number[] = [];

    const savedRecipes = await Recipe.find({
      originRecipeId: { $in: allRecipeIds.map((id) => id.toString()) },
    });
    const savedCalories = new Map<string, number>(
      savedRecipes.map((r): [string, number] => [r.originRecipeId, r.calories ?? 0]),
    );

    for (const id of allRecipeIds) {
      const cals = savedCalories.get(id.toString());
      if (cals !== undefined) {
        caloriesMap[id] = cals;
      } else {
        missingIds.push(id);
      }
    }

    if (missingIds.length > 0) {
      const bulkResults = await getRecipeDetailsBulk(missingIds.join(","));
      bulkResults.forEach((recipe: any) => {
        const caloriesNutrient = recipe.nutrition?.nutrients?.find(
          (n: any) => n.name === "Calories",
        );
        caloriesMap[recipe.id] = caloriesNutrient ? caloriesNutrient.amount : 0;
      });
    }

    const daysOfWeek = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const spoonacularDays = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];

    const days = daysOfWeek.map((dayName, index) => {
      const spoonacularDayIndex = (index + 6) % 7;
      const spoonacularDay = spoonacularDays[spoonacularDayIndex];
      const dayData = weeklyPlanFromAPI.week[spoonacularDay];

      const dateObj = new Date(weekStart);
      dateObj.setDate(weekStart.getDate() + index);
      const dateStr = dateObj.toISOString().split("T")[0];

      const meals = dayData?.meals || [];
      return {
        date: dateStr,
        breakfast: meals[0]
          ? {
              recipeId: meals[0].id,
              name: meals[0].title,
              calories: caloriesMap[meals[0].id] || 0,
            }
          : { recipeId: 0, name: "", calories: 0 },
        lunch: meals[1]
          ? {
              recipeId: meals[1].id,
              name: meals[1].title,
              calories: caloriesMap[meals[1].id] || 0,
            }
          : { recipeId: 0, name: "", calories: 0 },
        dinner: meals[2]
          ? {
              recipeId: meals[2].id,
              name: meals[2].title,
              calories: caloriesMap[meals[2].id] || 0,
            }
          : { recipeId: 0, name: "", calories: 0 },
      };
    });

    let sourceNutrients: nutrients = {
        calories: 0,
        protein: 0,
        fat: 0,
        carbohydrates: 0,
      };
    daysOfWeek.forEach((dayName, index) => {
      const spoonacularDayIndex = (index + 6) % 7;
      const spoonacularDay = spoonacularDays[spoonacularDayIndex];
      sourceNutrients = {
        calories: sourceNutrients.calories + (weeklyPlanFromAPI.week[spoonacularDay]?.nutrients.calories || 0),
        protein: sourceNutrients.protein + (weeklyPlanFromAPI.week[spoonacularDay]?.nutrients.protein || 0),
        fat: sourceNutrients.fat + (weeklyPlanFromAPI.week[spoonacularDay]?.nutrients.fat || 0),
        carbohydrates: sourceNutrients.carbohydrates + (weeklyPlanFromAPI.week[spoonacularDay]?.nutrients.carbohydrates || 0),
      };
    });

    const mealPlan = new MealPlan({
      userId,
      days,
      nutritionSummary: {
        calories:
          sourceNutrients.calories ||
          days.reduce(
            (sum, day) =>
              sum +
              (day.breakfast?.calories || 0) +
              (day.lunch?.calories || 0) +
              (day.dinner?.calories || 0),
            0,
          ),
        protein: sourceNutrients.protein || 0,
        fat: sourceNutrients.fat || 0,
        carbs: sourceNutrients.carbohydrates || 0,
      },
    });

    await mealPlan.save();
    return mealPlan;
  }

  async getWeeklyPlan(userId: string, date: string): Promise<IMealPlan | null> {
    const refDate = new Date(date);
    const weekStart = new Date(refDate);
    weekStart.setUTCDate(refDate.getUTCDate() - refDate.getUTCDay());
    weekStart.setUTCHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 1);

    const weeklyPlan = await MealPlan.findOne({
      userId,
      "days.date": { $gte: weekStart, $lt: weekEnd },
    });
    return weeklyPlan;
  }

  async getDailyPlan(userId: string, date: any): Promise<any> {
    const dailyPlan = await MealPlan.findOne(
      { userId, "days.date": date },
      { "days.$": 1 },
    );

    if (!dailyPlan || !dailyPlan.days || dailyPlan.days.length === 0) {
      return null;
    }
    return dailyPlan.days[0];
  }

  async getRecipeDetails(recipeId: string, userId?: string): Promise<IRecipe & any> {
    const existingRecipe = await Recipe.findOne({ originRecipeId: recipeId });
    let recipeData;

    if (existingRecipe) {
      recipeData = existingRecipe;
    } else {
      const recipeDetails = await getSpoonacularRecipe(recipeId);

      recipeData = new Recipe({
        originRecipeId: recipeDetails.id || recipeId,
        name: recipeDetails.title,
        image: recipeDetails.image,
        calories:
          recipeDetails.nutrition.nutrients.find(
            (n: any) => n.name === "Calories",
          )?.amount || 0,
        protein:
          recipeDetails.nutrition.nutrients.find(
            (n: any) => n.name === "Protein",
          )?.amount || 0,
        fat:
          recipeDetails.nutrition.nutrients.find((n: any) => n.name === "Fat")
            ?.amount || 0,
        carbs:
          recipeDetails.nutrition.nutrients.find(
            (n: any) => n.name === "Carbohydrates",
          )?.amount || 0,
        servings: recipeDetails.servings,
        readyInMinutes: recipeDetails.readyInMinutes,
        diets: recipeDetails.diets,
        instructions: {
          steps:
            recipeDetails.analyzedInstructions[0]?.steps.map(
              (s: any) => s.step,
            ) || [],
          ingredients: recipeDetails.extendedIngredients.map((ing: any) => ({
            id: ing.id,
            name: ing.name,
            image: ing.image,
            amount: ing.amount,
            unit: normalizeUnit(ing.unit),
            aisle: ing.aisle,
          })),
        },
      });
      await recipeData.save();
    }

    let isLiked = false;
    if (userId) {
      const userFavs = await UserFavorites.findOne({ userId });
      if (userFavs && userFavs.likedRecipeIds.includes(recipeId)) {
        isLiked = true;
      }
    }

    return { ...recipeData.toObject(), isLiked };
  }

  async toggleRecipeLike(userId: string, recipeId: string): Promise<{ isLiked: boolean }> {
    const userFavs = await UserFavorites.findOne({ userId });

    if (!userFavs) {
      await UserFavorites.create({ userId, likedRecipeIds: [recipeId] });
      return { isLiked: true };
    }

    const isCurrentlyLiked = userFavs.likedRecipeIds.includes(recipeId);

    if (isCurrentlyLiked) {
      await UserFavorites.updateOne({ userId }, { $pull: { likedRecipeIds: recipeId } });
    } else {
      await UserFavorites.updateOne({ userId }, { $addToSet: { likedRecipeIds: recipeId } });
    }

    return { isLiked: !isCurrentlyLiked };
  }
}

export default new MealPlannerService();
