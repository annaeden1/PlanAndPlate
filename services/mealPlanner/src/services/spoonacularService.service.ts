import axios from "axios";
import {
  ComplexSearchParams,
  ComplexSearchRecipe,
  ComplexSearchResponse,
  RecipeResponse,
  SpoonacularSearchParams,
  SpoonacularSearchResult,
} from "../utils/types/spoonacularTypes";

// recipes/complexSearch with addRecipeNutrition=true: returns recipes plus inline
// nutrition, supporting minProtein/min-maxCalories/diet/excludeIngredients/type.
// Replaces the calorie-only mealplanner/generate path for protein-aware planning.
export const searchRecipesByNutrition = async (
  params: ComplexSearchParams,
): Promise<ComplexSearchRecipe[]> => {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) throw new Error("SPOONACULAR_API_KEY is not set");

  const query = new URLSearchParams({
    apiKey,
    addRecipeNutrition: "true",
  });
  if (params.type) query.set("type", params.type);
  if (params.diet) query.set("diet", params.diet);
  if (params.excludeIngredients)
    query.set("excludeIngredients", params.excludeIngredients);
  if (params.minProtein !== undefined)
    query.set("minProtein", String(Math.round(params.minProtein)));
  if (params.minCalories !== undefined)
    query.set("minCalories", String(Math.round(params.minCalories)));
  if (params.maxCalories !== undefined)
    query.set("maxCalories", String(Math.round(params.maxCalories)));
  if (params.number !== undefined) query.set("number", String(params.number));

  const url = `https://api.spoonacular.com/recipes/complexSearch?${query.toString()}`;
  console.log("Spoonacular complexSearch URL:", url.replace(apiKey, "***"));
  const response = await axios.get<ComplexSearchResponse>(url);
  return response.data.results ?? [];
};

export const getRecipeDetails = async (
  recipeId: string,
): Promise<RecipeResponse> => {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) throw new Error("SPOONACULAR_API_KEY is not set");

  const url = `https://api.spoonacular.com/recipes/${recipeId}/information?includeNutrition=true&apiKey=${apiKey}`;
  const response = await axios.get(url);
  return response.data;
};

const DEFAULT_RECIPES_COUNT = 12;

export const searchRecipes = async (
  params: SpoonacularSearchParams,
): Promise<SpoonacularSearchResult[]> => {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) throw new Error("SPOONACULAR_API_KEY is not set");

  const query = new URLSearchParams({
    apiKey,
    number: String(params.recipesCount ?? DEFAULT_RECIPES_COUNT),
    addRecipeInformation: "true",
    addRecipeNutrition: "true",
    sort: "popularity",
  });
  if (params.cuisines?.length) query.set("cuisine", params.cuisines.join(","));
  if (params.diet) query.set("diet", params.diet);
  if (params.intolerances) query.set("intolerances", params.intolerances);
  if (params.mealType) query.set("type", params.mealType);
  if (params.minCalories !== null && params.minCalories !== undefined)
    query.set("minCalories", String(params.minCalories));
  if (params.maxCalories !== null && params.maxCalories !== undefined)
    query.set("maxCalories", String(params.maxCalories));
  if (params.minProtein !== null && params.minProtein !== undefined)
    query.set("minProtein", String(params.minProtein));

  const url = `https://api.spoonacular.com/recipes/complexSearch?${query.toString()}`;
  const response = await axios.get(url);
  return response.data.results ?? [];
};
