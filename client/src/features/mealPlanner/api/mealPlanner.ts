import axios from 'axios';
import type {
  ApiMealPlan,
  ApiMealPlanDay,
  ApiRecipe,
  RecipeSuggestion,
} from "@/features/mealPlanner/types/mealPlanner";

const api = axios.create({
  baseURL: '/mealPlanner',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const mealPlannerApi = {
  getWeeklyPlan: (userId: string, date: string) =>
    api
      .get<ApiMealPlan>(`/users/${userId}/meal-plans`, {
        params: { date },
      })
      .then((r) => r.data),

  getDailyPlan: (userId: string, date: string) =>
    api
      .get<ApiMealPlanDay>(`/users/${userId}/meal-plans/day`, {
        params: { date },
      })
      .then((r) => r.data),

  createWeeklyPlan: (userId: string, date?: string) =>
    api
      .post<ApiMealPlan>(
        `/users/${userId}/meal-plans/weekly`,
        {},
        { params: { date } },
      )
      .then((r) => r.data),

  getRecipeDetails: (recipeId: string) =>
    api.get<ApiRecipe>(`/recipes/${recipeId}`).then((r) => r.data),

  createManualRecipe: (payload: any) =>
    api.post<ApiRecipe>(`/recipes`, payload).then((r) => r.data),

  getManualRecipes: () =>
    api.get<ApiRecipe[]>(`/recipes/manual`).then((r) => r.data),

  toggleRecipeLike: (recipeId: string) =>
    api
      .patch<{ isLiked: boolean }>(`/recipes/${recipeId}/like`, {})
      .then((r) => r.data),

  getSuggestions: (
    userId: string,
    recipeId: string,
    mealType: string,
    limit = 6,
  ) =>
    api
      .get<RecipeSuggestion[]>(`/users/${userId}/recipes/${recipeId}/suggestions`, {
        params: { mealType, limit },
      })
      .then((r) => r.data),

  replaceMeal: (
    userId: string,
    body: { date: string; mealType: string; newRecipeId: string },
  ) =>
    api
      .patch<ApiMealPlanDay>(`/users/${userId}/meal-plans/day/meal`, body)
      .then((r) => r.data),

  getLikedRecipes: (userId: string) =>
    api.get<ApiRecipe[]>(`/users/${userId}/favorites`).then((r) => r.data),
};
