import type { ApiMealPlan, MealPlanItem } from '@/features/mealPlanner/types/mealPlanner';
import { formatDayKey, spoonacularImageUrl } from './mealPlannerDates';

export const selectMealsForDay = (
  mealPlan: ApiMealPlan | null,
  selectedDay: string,
): MealPlanItem[] => {
  if (!mealPlan) return [];
  const day = mealPlan.days.find((d) => formatDayKey(d.date) === selectedDay);
  if (!day) return [];

  const slots: { meal: ApiMealPlan['days'][number]['breakfast']; type: string }[] = [
    { meal: day.breakfast, type: 'Breakfast' },
    { meal: day.lunch, type: 'Lunch' },
    { meal: day.dinner, type: 'Dinner' },
  ];

  return slots
    .map(({ meal, type }) => ({
      id: Number(meal.recipeId),
      name: meal.name,
      type,
      calories: meal.calories,
      image: spoonacularImageUrl(meal.recipeId),
    }))
    .filter((m) => m.id && m.name);
};

export const dateForSelectedDay = (mealPlan: ApiMealPlan | null, selectedDay: string) =>
  mealPlan?.days.find((d) => formatDayKey(d.date) === selectedDay)?.date ?? '';
