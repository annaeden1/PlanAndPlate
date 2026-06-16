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

export interface SpoonacularSearchParams {
  cuisines?: string[];
  diet?: string;
  intolerances?: string;
  type?: string; // breakfast | main course | ...
  number?: number; // number of recipes to return
  minCalories?: number;
  maxCalories?: number;
  minProtein?: number;
}

export interface SpoonacularSearchResult {
  id: number;
  title: string;
  image?: string;
  readyInMinutes?: number;
  cuisines?: string[];
  dishTypes?: string[];
  diets?: string[];
  nutrition?: { nutrients: { name: string; amount: number }[] };
}

export const searchRecipes = async (
  params: SpoonacularSearchParams,
): Promise<SpoonacularSearchResult[]> => {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) throw new Error("SPOONACULAR_API_KEY is not set");

  const query = new URLSearchParams({
    apiKey,
    number: String(params.number ?? 12), // default: return 12 recipes
    addRecipeInformation: "true",
    addRecipeNutrition: "true",
    sort: "popularity",
  });
  if (params.cuisines?.length) query.set("cuisine", params.cuisines.join(","));
  if (params.diet) query.set("diet", params.diet);
  if (params.intolerances) query.set("intolerances", params.intolerances);
  if (params.type) query.set("type", params.type);
  if (params.minCalories !== null && params.minCalories !== undefined) query.set("minCalories", String(params.minCalories));
  if (params.maxCalories !== null && params.maxCalories !== undefined) query.set("maxCalories", String(params.maxCalories));
  if (params.minProtein !== null && params.minProtein !== undefined) query.set("minProtein", String(params.minProtein));

  const url = `https://api.spoonacular.com/recipes/complexSearch?${query.toString()}`;
  const response = await axios.get(url);
  return response.data.results ?? [];
};
