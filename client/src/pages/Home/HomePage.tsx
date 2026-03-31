import { useState, useEffect, useMemo } from "react";
import { Stack } from "@mui/material";
import {
  GreetingHeader,
  TodaysProgressCard,
  GroceryListCard,
  TodaysMeals,
} from "../../components/home";
import type { GroceryListStatus, CalorieProgress } from "../../utils/types/home";
import { userManagementApi } from "../../api/auth";
import { getUserId } from "../../shared/utils/userId";
import { useGroceryList } from "../../context/GroceryListContext";
import { useMealPlanner } from "../../context/MealPlannerContext";

const CALORIE_TARGET_BY_GOAL: Record<string, number> = {
  lose_weight: 1500,
  gain_muscle: 2500,
  eat_healthier: 2000,
  maintain_weight: 2000,
};

export const HomePage = () => {
  const [calorieTarget, setCalorieTarget] = useState<number>(2000);
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

  useEffect(() => {
    const userId = getUserId();
    const token = localStorage.getItem("access-token");
    if (!userId) return;

    userManagementApi.getPreferences(userId, token).then((data) => {
      const goal = data?.userPreferences?.healthGoal;
      if (goal && CALORIE_TARGET_BY_GOAL[goal]) {
        setCalorieTarget(CALORIE_TARGET_BY_GOAL[goal]);
      }
    }).catch(() => {});
  }, []);

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
