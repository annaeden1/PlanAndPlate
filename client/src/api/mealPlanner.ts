import axios from 'axios';
import type { ApiMealPlan, ApiMealPlanDay, ApiRecipe } from '../utils/types/mealPlanner';

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
};