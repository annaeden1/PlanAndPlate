import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { WeeklyTimeline } from "../components/menu/weeklyTimeLine";
import { PlannedMealCard } from "../components/menu/mealPlannerCard";
import { MealPlannerEmptyState } from "../components/menu/mealPlannerEmptyState";
import { DAYS, type MealPlanItem } from "../utils/types/mealPlanner";
import type { ApiMealPlan } from '../utils/types/mealPlanner';
import { mealPlannerApi } from "../api/mealPlanner";

interface MealPlannerProps {}

export function MealPlanner({ }: MealPlannerProps) {
  const today = new Date();
  const todayName = DAYS[today.getDay()];

  const [selectedDay, setSelectedDay] = useState(todayName);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [mealPlan, setMealPlan] = useState<ApiMealPlan | null>(null);
  const [cachedWeekKey, setCachedWeekKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const formatDayKey = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", { weekday: "short" });

  const weekRange = (() => {
    const ref = new Date();
    ref.setDate(ref.getDate() + currentWeek * 7);

    const day = ref.getDay();
    const sunday = new Date(ref);
    sunday.setDate(ref.getDate() - day);

    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);

    const format = (d: Date) =>
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    return `${format(sunday)} - ${format(saturday)}`;
  })();

  const selectedMeals: MealPlanItem[] = [];
  if (mealPlan) {
    const dayRecord = mealPlan.days.find(
      (day) => formatDayKey(day.date) === selectedDay,
    );
    if (dayRecord) {
      selectedMeals.push(
        {
          id: Number(dayRecord.breakfast.recipeId),
          name: dayRecord.breakfast.name,
          type: "Breakfast",
          calories: dayRecord.breakfast.calories,
          image: "https://via.placeholder.com/400x300?text=Breakfast",
        },
        {
          id: Number(dayRecord.lunch.recipeId),
          name: dayRecord.lunch.name,
          type: "Lunch",
          calories: dayRecord.lunch.calories,
          image: "https://via.placeholder.com/400x300?text=Lunch",
        },
        {
          id: Number(dayRecord.dinner.recipeId),
          name: dayRecord.dinner.name,
          type: "Dinner",
          calories: dayRecord.dinner.calories,
          image: "https://via.placeholder.com/400x300?text=Dinner",
        },
      );
    }
  }


  const fetchWeeklyPlan = async () => {
    setLoading(true);
    setError(null);

    try {
      const today = new Date();
      const dayIndex = DAYS.indexOf(selectedDay);
      const selectedDate = new Date(today);
      selectedDate.setDate(today.getDate() + currentWeek * 7 + (dayIndex - today.getDay()));
      const weekDate = selectedDate.toISOString().split("T")[0];

      // Cache key is based on currentWeek only - ensures same week doesn't re-fetch
      const weekKey = currentWeek.toString();

      // Check if week is already cached
      if (cachedWeekKey === weekKey && mealPlan) {
        setLoading(false);
        return;
      }

      const userId = "default-user"; // Replace with real user ID from auth

      try {
        const data = await mealPlannerApi.getWeeklyPlan(userId, weekDate);
        setMealPlan(data);
        setCachedWeekKey(weekKey);
      } catch (error: any) {
        if (error.response?.status === 404) {
          console.log("No meal plan found, creating new weekly plan...");
          const data = await mealPlannerApi.createWeeklyPlan(userId);
          setMealPlan(data);
          setCachedWeekKey(weekKey);
        } else {
          throw error;
        }
      }
    } catch (fetchError: any) {
      console.error("Error loading meal plan:", fetchError);
      setError("Accessing meal plan failed. Please try again later.");
      setMealPlan(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyPlan();
  }, [currentWeek]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: "3rem" }}>
      <Box sx={{ maxWidth: 3000, mx: "auto", p: "1.5rem" }}>
        <Box sx={{ mb: "2rem" }}>
          <Typography variant="h4" fontWeight="bold">
            Weekly Planner
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Your personalized weekly menu
          </Typography>
        </Box>

        <WeeklyTimeline
          currentWeek={currentWeek}
          onWeekChange={setCurrentWeek}
          selectedDay={selectedDay}
          onDaySelect={setSelectedDay}
          days={DAYS}
          weekRange={weekRange}
        />

        <Box sx={{ px: "1.5rem", py: "1.5rem" }}>
          {loading ? (
            <Typography>Loading weekly plan...</Typography>
          ) : error ? (
            <Typography color="error">{error}</Typography>
          ) : selectedMeals.length === 0 ? (
            <MealPlannerEmptyState selectedDay={selectedDay} />
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(2, 1fr)",
                  lg: "repeat(3, 1fr)",
                },
                gap: "1.5rem",
              }}
            >
              {selectedMeals.map((meal) => (
                <PlannedMealCard
                  key={`${selectedDay}-${meal.type}`}
                  meal={meal}
                  onViewRecipe={(meal) =>
                    navigate("/recipe", { state: { recipe: meal } })
                  }
                />
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
