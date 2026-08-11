import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import type { ReactNode } from 'react';

import { mealPlannerApi } from '@/features/mealPlanner/api/mealPlanner';
import type { ApiMealPlanDay } from '@/features/mealPlanner/types/mealPlanner';
import type { Meal } from '@/features/home/types/home';
import { getUserId } from '../shared/utils/userId';

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

const mapDayToMeals = (day: ApiMealPlanDay): Meal[] =>
  (['breakfast', 'lunch', 'dinner'] as const).map((type) => ({
    id: day[type].recipeId,
    name: day[type].name,
    image:
      day[type].image ||
      `https://spoonacular.com/recipeImages/${day[type].recipeId}-312x231.jpg`,
    mealType: MEAL_TYPES[type],
    time: MEAL_TIMES[type],
    calories: day[type].calories,
    completed: false,
  }));

interface MealPlannerState {
  meals: Meal[];
  loading: boolean;
}

interface MealPlannerActions {
  toggleMeal: (id: string) => void;
  applyDay: (day: ApiMealPlanDay) => void;
}

const MealPlannerContext = createContext<
  (MealPlannerState & MealPlannerActions) | null
>(null);

export const MealPlannerProvider = ({ children }: { children: ReactNode }) => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = getUserId();
    if (!userId) {
      setLoading(false);
      return;
    }

    mealPlannerApi
      .getDailyPlan(userId, todayKey())
      .then((day) => setMeals(mapDayToMeals(day)))
      .catch(() => setMeals([]))
      .finally(() => setLoading(false));
  }, []);

  const applyDay = useCallback((day: ApiMealPlanDay) => {
    if (!day?.date || String(day.date).split('T')[0] !== todayKey()) return;

    setMeals((prev) =>
      mapDayToMeals(day).map((meal) => ({
        ...meal,
        // keep the completed ticks for meals that did not change
        completed: prev.find((p) => p.id === meal.id)?.completed ?? false,
      })),
    );
  }, []);

  const toggleMeal = useCallback((id: string) => {
    setMeals((prev) =>
      prev.map((meal) =>
        meal.id === id ? { ...meal, completed: !meal.completed } : meal,
      ),
    );
    // TODO: persist to backend once a toggle endpoint is added to mealPlanner service
  }, []);

  return (
    <MealPlannerContext.Provider
      value={{ meals, loading, toggleMeal, applyDay }}
    >
      {children}
    </MealPlannerContext.Provider>
  );
};

export const useMealPlanner = () => {
  const ctx = useContext(MealPlannerContext);
  if (!ctx)
    throw new Error('useMealPlanner must be used inside MealPlannerProvider');
  return ctx;
};
