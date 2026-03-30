import axios from 'axios';
import type { ApiMealPlan, ApiMealPlanDay, ApiRecipe } from '../utils/types/mealPlanner';

const api = axios.create({
  baseURL: '/mealPlanner',
  headers: { 'Content-Type': 'application/json' },
});

export const mealPlannerApi = {
  createWeeklyPlan: (userId: string) =>
    api.post<ApiMealPlan>(`/users/${userId}/meal-plans/weekly`).then((r) => r.data),

  getWeeklyPlan: (userId: string, week: string) =>
    api.get<ApiMealPlan>(`/users/${userId}/meal-plans`, { params: { week } }).then((r) => r.data),

  getDailyPlan: (userId: string, date: string) =>
    api.get<ApiMealPlanDay>(`/users/${userId}/meal-plans/day`, { params: { date } }).then((r) => r.data),

  getRecipeDetails: (recipeId: string) =>
    api.get<ApiRecipe>(`/recipes/${recipeId}`).then((r) => r.data),
};