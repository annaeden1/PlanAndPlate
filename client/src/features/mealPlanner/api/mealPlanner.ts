import axios from 'axios';
import type { ApiMealPlan, ApiMealPlanDay, ApiRecipe, RecipeSuggestion } from '@/features/mealPlanner/types/mealPlanner';

const api = axios.create({
  baseURL: '/mealPlanner',
  headers: { 'Content-Type': 'application/json' },
});

export const mealPlannerApi = {
  getWeeklyPlan: (userId: string, date: string, token: string | null) =>
    api.get<ApiMealPlan>(`/users/${userId}/meal-plans`, { params: { date } , headers: { Authorization: `Bearer ${token}` } }).then((r) => r.data),

  getDailyPlan: (userId: string, date: string, token: string | null) =>
    api.get<ApiMealPlanDay>(`/users/${userId}/meal-plans/day`, { params: { date } , headers: { Authorization: `Bearer ${token}` } }).then((r) => r.data),

  createWeeklyPlan: (userId: string, date?: string, token: string | null = null) =>
    api.post<ApiMealPlan>(`/users/${userId}/meal-plans/weekly`, {}, { params: { date } , headers: { Authorization: `Bearer ${token}` } }).then((r) => r.data),

  getRecipeDetails: (recipeId: string, token: string | null) =>
    api.get<ApiRecipe>(`/recipes/${recipeId}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.data),

  toggleRecipeLike: (recipeId: string, token: string | null) =>
    api.patch<{ isLiked: boolean }>(`/recipes/${recipeId}/like`, {}, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.data),

  getSuggestions: (
    userId: string,
    recipeId: string,
    mealType: string,
    token: string | null,
    limit = 6,
  ) =>
    api
      .get<RecipeSuggestion[]>(`/users/${userId}/recipes/${recipeId}/suggestions`, {
        params: { mealType, limit },
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => r.data),

  replaceMeal: (
    userId: string,
    body: { date: string; mealType: string; newRecipeId: string },
    token: string | null,
  ) =>
    api
      .patch<ApiMealPlanDay>(`/users/${userId}/meal-plans/day/meal`, body, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => r.data),
};