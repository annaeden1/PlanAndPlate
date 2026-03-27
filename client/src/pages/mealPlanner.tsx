import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box } from "@mui/material";
import { WeeklyTimeline } from "../components/menu/weeklyTimeLine";
import { PlannedMealCard } from "../components/menu/mealPlannerCard";
import { MealPlannerEmptyState } from "../components/menu/mealPlannerEmptyState";
import { DAYS, WEEKLY_MEALS } from "../utils/mockData/mealPlannerMockData";
import { Typography } from "@mui/material";

interface MealPlannerProps {
}

export function MealPlanner({ }: MealPlannerProps) {
  const [selectedDay, setSelectedDay] = useState("Mon");
  const [currentWeek, setCurrentWeek] = useState(0);
  const navigate = useNavigate();

  const selectedMeals = WEEKLY_MEALS[selectedDay] || [];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: "3rem" }}>
      <Box sx={{ maxWidth: 3000, mx: 'auto', p: '1.5rem' }}>
      {/* Header Section */}
      <Box sx={{ mb: '2rem' }}>
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
      />

      <Box sx={{ px: "1.5rem", py: "1.5rem" }}>
        <Box sx={{ maxWidth: "80rem", mx: "auto" }}>
          {selectedMeals.length === 0 ? (
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
                  key={meal.id}
                  meal={meal}
                  onViewRecipe={(meal) => navigate('/recipe', { state: { recipe: meal } })}
                />
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
    </Box>
  );
}
