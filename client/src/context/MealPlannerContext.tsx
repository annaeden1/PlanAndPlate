import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import { mealPlannerApi } from '../api/mealPlanner';
import type { Meal } from '../utils/types/home';
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

interface MealPlannerState {
  meals: Meal[];
  loading: boolean;
}

interface MealPlannerActions {
  toggleMeal: (id: string) => void;
}

const MealPlannerContext = createContext<(MealPlannerState & MealPlannerActions) | null>(null);

export const MealPlannerProvider = ({ children }: { children: ReactNode }) => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = getUserId();
    const token = localStorage.getItem('access-token');
    if (!userId) { setLoading(false); return; }

    const today = new Date().toISOString().split('T')[0];

    mealPlannerApi
      .getDailyPlan(userId, today, token)
      .then((day) => {
        const mapped: Meal[] = (['breakfast', 'lunch', 'dinner'] as const).map((type) => ({
          id: day[type].recipeId,
          name: day[type].name,
          image: '',
          mealType: MEAL_TYPES[type],
          time: MEAL_TIMES[type],
          calories: day[type].calories,
          completed: false,
        }));
        setMeals(mapped);

        axios.all(
          mapped.map((meal) =>
            mealPlannerApi
              .getRecipeDetails(meal.id.toString(), token)
              .then((recipe) => ({ ...meal, image: recipe.image || '' }))
              .catch(() => meal),
          ),
        ).then((mealsWithImages) => setMeals(mealsWithImages));
      })
      .catch(() => setMeals([]))
      .finally(() => setLoading(false));
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
    <MealPlannerContext.Provider value={{ meals, loading, toggleMeal }}>
      {children}
    </MealPlannerContext.Provider>
  );
};

export const useMealPlanner = () => {
  const ctx = useContext(MealPlannerContext);
  if (!ctx) throw new Error('useMealPlanner must be used inside MealPlannerProvider');
  return ctx;
};
