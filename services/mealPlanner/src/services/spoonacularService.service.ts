import axios from "axios";

const spoonacularAPI = "https://api.spoonacular.com/";
const apiKey = process.env.SPOONACULAR_API_KEY;

export const generateMealPlan = async (
  diet?: string,
  exclude?: string,
): Promise<any> => {
  if (!apiKey) throw new Error("SPOONACULAR_API_KEY is not set");

  const url = `${spoonacularAPI}mealPlanner/generate?apiKey=${apiKey}&timeFrame=week&diet=${diet || ""}&exclude=${exclude || ""}`;
  const response = await axios.get(url);

  return response.data;
};

export const getRecipeDetails = async (recipeId: string): Promise<any> => {
  if (!apiKey) throw new Error("SPOONACULAR_API_KEY is not set");

  const url = `${spoonacularAPI}recipes/${recipeId}/information?includeNutrition=true&apiKey=${apiKey}`;
  const response = await axios.get(url);
  return response.data;
};