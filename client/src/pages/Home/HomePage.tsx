import { useState, useMemo } from "react";
import { Stack } from "@mui/material";
import { GreetingHeader } from "./components/GreetingHeader";
import { TodaysProgressCard } from "./components/TodaysProgressCard";
import { GroceryListCard } from "./components/GroceryListCard";
import { TodaysMeals } from "./components/TodaysMeals";
import { mockCalorieProgress, mockGroceryListStatus, mockMeals } from "./mockData";
import type { Meal } from "./mockData";

export const HomePage = () => {
  const [meals, setMeals] = useState<Meal[]>(mockMeals);

  const handleToggleMeal = (id: string) => {
    setMeals((prev) =>
      prev.map((meal) =>
        meal.id === id ? { ...meal, completed: !meal.completed } : meal
      )
    );
  };

  const calorieProgress = useMemo(() => {
    const consumed = meals
      .filter((m) => m.completed)
      .reduce((sum, m) => sum + m.calories, 0);
    return { consumed, target: mockCalorieProgress.target };
  }, [meals]);

  return (
    <Stack spacing="1.5rem" sx={{ py: "1rem" }}>
      <GreetingHeader />
      <TodaysProgressCard calorieProgress={calorieProgress} />
      <GroceryListCard groceryStatus={mockGroceryListStatus} />
      <TodaysMeals meals={meals} onToggleMeal={handleToggleMeal} />
    </Stack>
  );
};
