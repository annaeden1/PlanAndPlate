import axios from "axios";
import { MealPlan, IMealPlan } from "../models/mealPlanModel";
import { Recipe, IRecipe } from "../models/recipeModel";
import {
  generateMealPlan,
  getRecipeDetails as getSpoonacularRecipe,
  getRecipeDetailsBulk,
} from "./spoonacularService.service";
import { normalizeUnit } from "../utils/types/units";

class MealPlannerService {
  async createWeeklyPlan(
    userId: string,
    date?: string,
    token?: string,
  ): Promise<IMealPlan & any> {
    // Calculate week start (Sunday) from the provided date or current date
    const refDate = date ? new Date(date) : new Date();
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

    const weeklyPlanFromAPI = await generateMealPlan(
      diet,
      allergyExcludeString,
    );

    // Collect all recipe IDs to fetch nutrition
    const allRecipeIds: number[] = [];
    Object.values(weeklyPlanFromAPI.week).forEach((day: any) => {
      if (day.meals) {
        day.meals.forEach((meal: any) => {
          allRecipeIds.push(meal.id);
        });
      }
    });

    // Check DB first; collect IDs not yet saved
    const caloriesMap: { [key: number]: number } = {};
    const missingIds: number[] = [];

    await Promise.all(
      allRecipeIds.map(async (id) => {
        const saved = await Recipe.findOne({ originRecipeId: id.toString() });
        if (saved) {
          caloriesMap[id] = saved.calories ?? 0;
        } else {
          missingIds.push(id);
        }
      }),
    );

    // Single bulk request for all recipes not in DB
    if (missingIds.length > 0) {
      const bulkResults = await getRecipeDetailsBulk(missingIds.join(","));
      bulkResults.forEach((recipe: any) => {
        const caloriesNutrient = recipe.nutrition?.nutrients?.find(
          (n: any) => n.name === "Calories",
        );
        caloriesMap[recipe.id] = caloriesNutrient ? caloriesNutrient.amount : 0;
      });
    }

    // Map meals to Sunday-Saturday dates
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
      const spoonacularDayIndex = (index + 6) % 7; // Shift to align Sunday first
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

    const sourceNutrients = weeklyPlanFromAPI.nutrients || {};
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
    weekStart.setDate(refDate.getDate() - refDate.getDay());
    const weekStartStr = weekStart.toISOString().split("T")[0];

    const weeklyPlan = await MealPlan.findOne({
      userId,
      "days.date": weekStartStr,
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

  async getRecipeDetails(recipeId: string): Promise<IRecipe & any> {
    const existingRecipe = await Recipe.findOne({ originRecipeId: recipeId });
    if (existingRecipe) {
      return existingRecipe;
    }

    const recipeDetails = await getSpoonacularRecipe(recipeId);

    const recipeData = new Recipe({
      originRecipeId: recipeDetails.id || recipeId,
      name: recipeDetails.title,
      image: recipeDetails.image,
      calories:
        recipeDetails.nutrition.nutrients.find(
          (n: any) => n.name === "Calories",
        )?.amount || 0 * recipeDetails.servings,
      protein:
        recipeDetails.nutrition.nutrients.find((n: any) => n.name === "Protein")
          ?.amount || 0 * recipeDetails.servings,
      fat:
        recipeDetails.nutrition.nutrients.find((n: any) => n.name === "Fat")
          ?.amount || 0 * recipeDetails.servings,
      carbs:
        recipeDetails.nutrition.nutrients.find(
          (n: any) => n.name === "Carbohydrates",
        )?.amount || 0 * recipeDetails.servings,
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
    return recipeData;
  }
}

export default new MealPlannerService();
