import { useEffect, useState } from 'react';
import type { ApiMealPlan, MealPlanItem } from '@/features/mealPlanner/types/mealPlanner';
import { mealPlannerApi } from '@/features/mealPlanner/api/mealPlanner';
import { computeWeekDate } from '@/features/mealPlanner/utils/mealPlannerDates';
import { useGroceryList } from '@/context/GroceryListContext';
import { useSnackbar } from '@/shared/hooks/useSnackbar';
import { getUserId } from '@/shared/utils/userId';

export function useWeeklyMealPlan(currentWeek: number, selectedDay: string) {
  const [mealPlan, setMealPlan] = useState<ApiMealPlan | null>(null);
  const [cachedWeekKey, setCachedWeekKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { importRecipe } = useGroceryList();
  const { snackbar, showSuccess, showError, close } = useSnackbar();

  const fetchWeeklyPlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const weekKey = currentWeek.toString();
      if (cachedWeekKey === weekKey && mealPlan) return;

      const userId = getUserId() ?? '';
      const weekDate = computeWeekDate(selectedDay, currentWeek);
      try {
        const data = await mealPlannerApi.getWeeklyPlan(userId, weekDate);
        setMealPlan(data);
        setCachedWeekKey(weekKey);
      } catch (err: any) {
        if (err.response?.status === 404) {
          const data = await mealPlannerApi.createWeeklyPlan(userId, weekDate);
          showSuccess('New weekly meal plan created!');
          setMealPlan(data);
          setCachedWeekKey(weekKey);
        } else {
          throw err;
        }
      }
    } catch (fetchError) {
      console.error('Error loading meal plan:', fetchError);
      setError('Accessing meal plan failed. Please try again later.');
      setMealPlan(null);
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = async () => {
    setGenerating(true);
    setError(null);
    try {
      const userId = getUserId() ?? '';
      const data = await mealPlannerApi.createWeeklyPlan(
        userId,
        computeWeekDate(selectedDay, currentWeek),
      );
      setMealPlan(data);
      setCachedWeekKey(currentWeek.toString());
      showSuccess('Fresh weekly plan generated!');
    } catch (err) {
      console.error('Error generating meal plan:', err);
      showError('Failed to generate a plan. Try again later.');
    } finally {
      setGenerating(false);
    }
  };

  const addMealToList = async (meal: MealPlanItem) => {
    try {
      const mealPlanId = mealPlan?._id ?? '';
      const recipeDetails = await mealPlannerApi.getRecipeDetails(meal.id.toString());
      const recipeIdForImport =
        recipeDetails._id || recipeDetails.originRecipeId || meal.id.toString();

      await importRecipe(recipeIdForImport, mealPlanId);
      showSuccess('Ingredients added to grocery list successfully!');
    } catch (err) {
      console.error('Error adding to grocery list:', err);
      showError('Failed to add ingredients to grocery list.');
    }
  };

  useEffect(() => {
    fetchWeeklyPlan();

  }, [currentWeek]);

  return {
    mealPlan,
    loading,
    generating,
    error,
    generatePlan,
    addMealToList,
    snackbar,
    closeSnackbar: close,
  };
}
