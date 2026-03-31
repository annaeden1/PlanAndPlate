import axios from "axios";

export const generateMealPlan = async (
  diet?: string,
  exclude?: string,
): Promise<any> => {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) throw new Error("SPOONACULAR_API_KEY is not set");

  const url = `https://api.spoonacular.com/mealplanner/generate?apiKey=${apiKey}&timeFrame=week&diet=${diet || ""}&exclude=${exclude || ""}`;
  const response = await axios.get(url);

  return response.data;
};

export const getRecipeDetails = async (recipeId: string): Promise<any> => {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) throw new Error("SPOONACULAR_API_KEY is not set");

  const url = `https://api.spoonacular.com/recipes/${recipeId}/information?includeNutrition=true&apiKey=${apiKey}`;
  const response = await axios.get(url);
  return response.data;
};