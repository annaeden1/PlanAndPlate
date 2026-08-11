import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { mealPlannerApi } from '@/features/mealPlanner/api/mealPlanner';
import type { ApiMealPlanDay } from '@/features/mealPlanner/types/mealPlanner';
import type { Meal } from '@/features/home/types/home';
import { getUserId } from '@/shared/utils/userId';

const MEAL_TIMES: Record<'breakfast' | 'lunch' | 'dinner', string> = {
  breakfast: '8:00 AM',
  lunch: '12:30 PM',
  dinner: '6:30 PM',
};

const MEAL_TYPES: Record<'breakfast' | 'lunch' | 'dinner', Meal['mealType']> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};

const todayKey = () => new Date().toISOString().split('T')[0];

/** Keeps the ticks of meals whose recipe did not change */
const mapDayToMeals = (
  day: ApiMealPlanDay,
  completedById: Map<string, boolean>,
): Meal[] =>
  (['breakfast', 'lunch', 'dinner'] as const).map((type) => ({
    id: day[type].recipeId,
    name: day[type].name,
    image:
      day[type].image ||
      `https://spoonacular.com/recipeImages/${day[type].recipeId}-312x231.jpg`,
    mealType: MEAL_TYPES[type],
    time: MEAL_TIMES[type],
    calories: day[type].calories,
    completed: completedById.get(day[type].recipeId) ?? false,
  }));

const completedMap = (meals: Meal[]) =>
  new Map(meals.map((meal) => [meal.id, meal.completed]));

interface TodayMealsState {
  /** Date the meals belong to - a new day starts with fresh ticks */
  date: string;
  /** User the meals belong to - a different user starts with fresh ticks */
  userId: string | null;
  meals: Meal[];
  loading: boolean;
  loadToday: () => Promise<void>;
  applyDay: (day: ApiMealPlanDay) => void;
  toggleMeal: (id: string) => void;
}

export const useTodayMealsStore = create<TodayMealsState>()(
  persist(
    (set, get) => ({
      date: todayKey(),
      userId: null,
      meals: [],
      loading: true,

      loadToday: async () => {
        const date = todayKey();
        const userId = getUserId();

        if (get().date !== date || get().userId !== userId) {
          set({ date, userId, meals: [] });
        }

        if (!userId) {
          set({ loading: false });
          return;
        }

        set({ loading: true });
        try {
          const day = await mealPlannerApi.getDailyPlan(userId, date);

          // The day or the user may have changed while the request was in flight
          if (get().date !== date || get().userId !== userId) return;

          set({ meals: mapDayToMeals(day, completedMap(get().meals)) });
        } catch {
          // Keep whatever was persisted so a failed refresh doesn't wipe the day
        } finally {
          set({ loading: false });
        }
      },

      applyDay: (day) => {
        const date = todayKey();
        if (!day?.date || String(day.date).split('T')[0] !== date) return;

        // Re-stamp date/userId so a tab left open across midnight stays consistent
        set({
          date,
          userId: getUserId(),
          meals: mapDayToMeals(day, completedMap(get().meals)),
        });
      },

      toggleMeal: (id) =>
        set((state) => ({
          meals: state.meals.map((meal) =>
            meal.id === id ? { ...meal, completed: !meal.completed } : meal,
          ),
        })),
      // TODO: persist to backend once a toggle endpoint is added to mealPlanner service
    }),
    {
      name: 'today-meals',
      partialize: (state) => ({
        date: state.date,
        userId: state.userId,
        meals: state.meals,
      }),
      // Drop stale meals during rehydration so another day's - or another
      // user's - meals never reach the first render
      merge: (persisted, current) => {
        const saved = persisted as Partial<TodayMealsState> | undefined;
        const date = todayKey();
        const userId = getUserId();

        if (!saved || saved.date !== date || saved.userId !== userId) {
          return { ...current, date, userId, meals: [] };
        }

        return { ...current, ...saved };
      },
    },
  ),
);
