import { Request, Response } from "express";
import axios from "axios";
import { MealPlan } from "../models/mealPlanModel";
import {
  generateMealPlan,
  getRecipeDetails,
} from "../services/spoonacularService.service";
import { Recipe } from "../models/recipeModel";
import { normalizeUnit } from "../utils/types/units";

class MealPlannerController {
  async createWeeklyPlan(req: Request, res: Response) {
    const { userId } = req.params;

    const userPreferences = await axios.get(
        `${process.env.USER_MANAGMENT_URL}/userManagement/${userId}/preferences`
    );

    const weeklyPlanFromAPI = await generateMealPlan(
      userPreferences.data.diet,
      userPreferences.data.allergies,
    );

    const mealPlan = new MealPlan({
      userId,
      days: weeklyPlanFromAPI.meals.map((meal: any) => ({
        date: meal.date,
        breakfast: {
          recipeId: meal.meals[0].id,
          name: meal.meals[0].title,
          calories: meal.nutrients.calories,
        },
        lunch: {
          recipeId: meal.meals[1].id,
          name: meal.meals[1].title,
          calories: meal.nutrients.calories,
        },
        dinner: {
          recipeId: meal.meals[2].id,
          name: meal.meals[2].title,
          calories: meal.nutrients.calories,
        },
      })),
      nutritionSummary: {
        calories: weeklyPlanFromAPI.nutrients.calories,
        protein: weeklyPlanFromAPI.nutrients.protein,
        fat: weeklyPlanFromAPI.nutrients.fat,
        carbs: weeklyPlanFromAPI.nutrients.carbohydrates,
      },
    });

    await mealPlan.save();
    res.status(201).json(mealPlan);
  }

  async getWeeklyPlan(req: Request, res: Response) {
    const { userId } = req.params;
    const { week } = req.query;

    const weeklyPlan = await MealPlan.findOne({ userId, "days.date": week });

    if (!weeklyPlan) {
      return res.status(404).json({ error: "Weekly meal plan not found" });
    }
    res.json(weeklyPlan);
  }

  async getDailyPlan(req: Request, res: Response) {
    const { userId } = req.params;
    const { date } = req.query;

    const dailyPlan = await MealPlan.findOne(
      { userId, "days.date": date },
      { "days.$": 1 },
    );

    if (!dailyPlan || !dailyPlan.days || dailyPlan.days.length === 0) {
      return res.status(404).json({ error: "Daily meal plan not found" });
    }
    res.json(dailyPlan.days[0]);
  }

  async getRecipeDetails(req: Request, res: Response) {
    const { recipeId } = req.params;

    try {
      const recipeDetails = await getRecipeDetails(recipeId);

      const recipeData = new Recipe({
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
      res.json(recipeData);
    } catch (error) {
      console.error("Error fetching recipe details:", error);
      res.status(500).json({ error: "Failed to fetch recipe details" });
    }
  }
}
export default new MealPlannerController();
