import { useMemo } from "react";
import { Stack } from "@mui/material";
import {
  GreetingHeader,
  TodaysProgressCard,
  GroceryListCard,
  TodaysMeals,
} from "../../components/home";
import type { GroceryListStatus, CalorieProgress } from "../../utils/types/home";
import { useGroceryList } from "../../context/GroceryListContext";
import { useMealPlanner } from "../../context/MealPlannerContext";

export const HomePage = () => {
  const { groups } = useGroceryList();
  const { meals, toggleMeal } = useMealPlanner();

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
    const total = meals.reduce((sum, m) => sum + m.calories, 0);
    return total > 0 ? total : 2000;
  }, [meals]);

  const calorieProgress: CalorieProgress = useMemo(() => {
    const consumed = meals
      .filter((m) => m.completed)
      .reduce((sum, m) => sum + m.calories, 0);
    return { consumed, target: calorieTarget };
  }, [meals, calorieTarget]);

  return (
    <Stack spacing="1.5rem" sx={{ py: "1rem" }}>
      <GreetingHeader />
      <TodaysProgressCard calorieProgress={calorieProgress} />
      <GroceryListCard groceryStatus={groceryStatus} />
      <TodaysMeals meals={meals} onToggleMeal={toggleMeal} />
    </Stack>
  );
};
