import { useGroceryList } from "@/context/GroceryListContext";
import { useMealPlanner } from "@/context/MealPlannerContext";
import {
  GroceryListCard,
  TodaysMeals,
  TodaysProgressCard,
  LikedRecipes,
} from "@/features/home/components";
import type {
  CalorieProgress,
  GroceryListStatus,
  Meal,
} from "@/features/home/types/home";
import { Stack, Box, Avatar } from "@mui/material";
import { useMemo } from "react";
import { PageHeader } from "@/components/common/PageHeader";

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning!";
  if (hour < 17) return "Good Afternoon!";
  return "Good Evening!";
};

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
    const total = meals.reduce((sum: number, m: Meal) => sum + m.calories, 0);
    return Math.round(total > 0 ? total : 2000);
  }, [meals]);

  const calorieProgress: CalorieProgress = useMemo(() => {
    const consumed = meals
      .filter((m: Meal) => m.completed)
      .reduce((sum: number, m: Meal) => sum + m.calories, 0);
    return { consumed: Math.round(consumed), target: calorieTarget };
  }, [meals, calorieTarget]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: "3rem" }}>
      <PageHeader
        title={getGreeting()}
        subtitle="Ready for a healthy day? 🌱"
        action={
          <Avatar
            sx={{
              width: "3rem",
              height: "3rem",
              bgcolor: "primary.main",
              fontSize: "1.5rem",
            }}
          >
            👋
          </Avatar>
        }
      />
      <Box
        sx={{
          px: { xs: "1rem", sm: "1.5rem" },
          mt: "-2rem",
          maxWidth: "80rem",
          mx: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: "1.5rem",
            alignItems: "start",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
            }}
          >
            <TodaysProgressCard calorieProgress={calorieProgress} />
            <GroceryListCard groceryStatus={groceryStatus} />
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
              minWidth: 0,
            }}
          >
            <TodaysMeals meals={meals} onToggleMeal={toggleMeal} />
          </Box>
        </Box>
        <LikedRecipes />
      </Box>
    </Box>
  );
};
