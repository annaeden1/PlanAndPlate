import { useMemo } from 'react';
import { Box } from '@mui/material';
import { useGroceryList } from '@/context/GroceryListContext';
import { useMealPlanner } from '@/context/MealPlannerContext';
import {
  CalorieHero,
  GroceryListCard,
  TodaysMeals,
  LikedRecipes,
} from '@/features/home/components';
import type { MacroStat } from '@/features/home/components/CalorieHero';
import { WeeklyChart } from '@/components/common/WeeklyChart';
import { useWeeklyBalance } from '@/features/mealPlanner/utils/weeklyBalance';
import { gradients } from '@/core/theme/tokens';
import type {
  CalorieProgress,
  GroceryListStatus,
  Meal,
} from '@/features/home/types/home';

export const HomePage = () => {
  const { groups } = useGroceryList();
  const { meals, toggleMeal } = useMealPlanner();
  const weekly = useWeeklyBalance();

  const groceryStatus: GroceryListStatus = useMemo(() => {
    let total = 0;
    let checked = 0;
    groups.forEach((group) => {
      group.items.forEach((item) => {
        total++;
        if (item.checked) checked++;
      });
    });
    return { totalItems: total, checkedItems: checked };
  }, [groups]);

  const calorieTarget = useMemo(() => {
    const total = meals.reduce((sum: number, m: Meal) => sum + m.calories, 0);
    return Math.round(total > 0 ? total : 2000);
  }, [meals]);

  const calorieProgress: CalorieProgress = useMemo(() => {
    const consumed = meals
      .filter((m: Meal) => m.completed)
      .reduce((sum: number, m: Meal) => sum + m.calories, 0);
    return { consumed: Math.round(consumed), target: calorieTarget };
  }, [meals, calorieTarget]);

  const macros: MacroStat[] = useMemo(() => {
    const sum = (k: 'protein' | 'carbs' | 'fat') =>
      Math.round(meals.reduce((s, m) => s + (m[k] ?? 0), 0));
    const protein = sum('protein');
    const carbs = sum('carbs');
    const fat = sum('fat');

    const totalKcal = protein * 4 + carbs * 4 + fat * 9;
    const pct = (kcal: number) => totalKcal > 0 ? Math.round((kcal / totalKcal) * 100) : 0;
    return [
      { label: 'Protein', val: protein, pct: pct(protein * 4), color: gradients.protein },
      { label: 'Carbs', val: carbs, pct: pct(carbs * 4), color: gradients.carbs },
      { label: 'Fat', val: fat, pct: pct(fat * 9), color: gradients.fat },
    ];
  }, [meals]);

  return (
    <Box sx={{ animation: 'pp-slideUp .4s both' }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1.7fr 1fr' },
          gap: '1.375rem',
          alignItems: 'start',
        }}
      >

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.375rem', minWidth: 0 }}>
          <CalorieHero calorieProgress={calorieProgress} macros={macros} />
          <TodaysMeals meals={meals} onToggleMeal={toggleMeal} />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.375rem', minWidth: 0 }}>
          <GroceryListCard groceryStatus={groceryStatus} />
          <WeeklyChart
            title="This week"
            bars={weekly.bars}
            activeIndex={weekly.activeIndex}
            avgLabel={weekly.avg ? weekly.avg.toLocaleString() : undefined}
          />
        </Box>
      </Box>

      <LikedRecipes />
    </Box>
  );
};
