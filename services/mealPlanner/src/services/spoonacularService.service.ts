import axios from "axios";
import { MealPlanResponse, RecipeResponse } from "../utils/types/spoonacularTypes";

export const generateMealPlan = async (
  diet?: string,
  exclude?: string,
): Promise<MealPlanResponse> => {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) throw new Error("SPOONACULAR_API_KEY is not set");

  const url = `https://api.spoonacular.com/mealplanner/generate?apiKey=${apiKey}&timeFrame=week&diet=${diet || ""}&exclude=${exclude || ""}`;
  const response = await axios.get(url);
  return response.data;
};

export const getRecipeDetails = async (recipeId: string): Promise<RecipeResponse> => {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) throw new Error("SPOONACULAR_API_KEY is not set");

  const url = `https://api.spoonacular.com/recipes/${recipeId}/information?includeNutrition=true&apiKey=${apiKey}`;
  const response = await axios.get(url);
  console.log("Spoonacular recipe details response: instructions ", response.data.analyzedInstructions[0].steps[0].ingredients);
  console.log("Spoonacular recipe details response: analyzedInstructions ", response.data.analyzedInstructions[0].steps[0].equipment);
  return response.data;
};

export const getRecipeDetailsBulk = async (ids: string): Promise<RecipeResponse[]> => {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) throw new Error("SPOONACULAR_API_KEY is not set");

  const url = `https://api.spoonacular.com/recipes/informationBulk?ids=${ids}&includeNutrition=true&apiKey=${apiKey}`;
  const response = await axios.get(url);
  return response.data;
};
