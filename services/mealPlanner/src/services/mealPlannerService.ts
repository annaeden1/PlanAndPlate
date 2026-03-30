import axios from "axios";
import { MealPlan, IMealPlan } from "../models/mealPlanModel";
import { Recipe, IRecipe } from "../models/recipeModel";
import {
  generateMealPlan,
  getRecipeDetails as getSpoonacularRecipe,
} from "./spoonacularService.service";
import { normalizeUnit } from "../utils/types/units";

class MealPlannerService {
  async createWeeklyPlan(userId: string, date?: string): Promise<IMealPlan & any> {
    // Calculate week start (Sunday) from the provided date or current date
    const refDate = date ? new Date(date) : new Date();
    const weekStart = new Date(refDate);
    weekStart.setDate(refDate.getDate() - refDate.getDay());

    const userPreferences = await axios.get(
      `${process.env.USER_MANAGMENT_URL}/userManagement/${userId}/preferences`
    );

    const allergyExcludeString = Array.isArray(userPreferences.data.allergies)
      ? userPreferences.data.allergies.join(",")
      : userPreferences.data.allergies || "";

    const weeklyPlanFromAPI = await generateMealPlan(
      userPreferences.data.diet,
      allergyExcludeString,
    );

    // Map meals to Sunday-Saturday dates
    const days = (weeklyPlanFromAPI.meals || []).slice(0, 7).map((meal: any, index: number) => {
      const dateObj = new Date(weekStart);
      dateObj.setDate(weekStart.getDate() + index);
      const dateStr = dateObj.toISOString().split("T")[0];

      return {
        date: dateStr,
        breakfast: { recipeId: meal.meals[0]?.id || 0, name: meal.meals[0]?.title || "", calories: meal.nutrients?.calories || 0 },
        lunch: { recipeId: meal.meals[1]?.id || 0, name: meal.meals[1]?.title || "", calories: meal.nutrients?.calories || 0 },
        dinner: { recipeId: meal.meals[2]?.id || 0, name: meal.meals[2]?.title || "", calories: meal.nutrients?.calories || 0 },
      };
    });

    const mealPlan = new MealPlan({
      userId,
      days,
      nutritionSummary: {
        calories: weeklyPlanFromAPI.nutrients.calories,
        protein: weeklyPlanFromAPI.nutrients.protein,
        fat: weeklyPlanFromAPI.nutrients.fat,
        carbs: weeklyPlanFromAPI.nutrients.carbohydrates,
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

    const weeklyPlan = await MealPlan.findOne({ userId, "days.date": weekStartStr });
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
        recipeDetails.nutrition.nutrients.find(
          (n: any) => n.name === "Protein",
        )?.amount || 0 * recipeDetails.servings,
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
