import axios from "axios";
import { MealPlanResponse, RecipeResponse } from "../utils/types/spoonacularTypes";

export const generateMealPlan = async (
  diet?: string,
  exclude?: string,
  targetCalories?: number,
): Promise<MealPlanResponse> => {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) throw new Error("SPOONACULAR_API_KEY is not set");

  let url = `https://api.spoonacular.com/mealplanner/generate?apiKey=${apiKey}&timeFrame=week&diet=${diet || ""}&exclude=${exclude || ""}`;
  if (targetCalories) url += `&targetCalories=${Math.round(targetCalories)}`;
  console.log("Spoonacular generateMealPlan URL:", url.replace(apiKey, "***"));
  const response = await axios.get(url);
  return response.data;
};

export const getRecipeDetails = async (recipeId: string): Promise<RecipeResponse> => {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) throw new Error("SPOONACULAR_API_KEY is not set");

  const url = `https://api.spoonacular.com/recipes/${recipeId}/information?includeNutrition=true&apiKey=${apiKey}`;
  const response = await axios.get(url);
  return response.data;
};

export const getRecipeDetailsBulk = async (ids: string): Promise<RecipeResponse[]> => {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) throw new Error("SPOONACULAR_API_KEY is not set");

  const url = `https://api.spoonacular.com/recipes/informationBulk?ids=${ids}&includeNutrition=true&apiKey=${apiKey}`;
  const response = await axios.get(url);
  return response.data;
};
