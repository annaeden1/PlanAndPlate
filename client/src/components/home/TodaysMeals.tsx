import { Box, Typography, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { MealCard } from "./MealCard";
import type { Meal } from "../../utils/types/home";

interface TodaysMealsProps {
  meals: Meal[];
  onToggleMeal: (id: string) => void;
}

export const TodaysMeals = ({ meals, onToggleMeal }: TodaysMealsProps) => {
  const navigate = useNavigate();

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: "1rem",
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          Today's Meals
        </Typography>
        <Typography
          variant="body2"
          fontWeight={600}
          onClick={() => {
            window.scrollTo(0, 0);
            navigate("/planner");
          }}
          sx={{
            color: "primary.main",
            cursor: "pointer",
            "&:hover": { textDecoration: "underline" },
          }}
        >
          View All &gt;
        </Typography>
      </Box>

      <Stack spacing="0.75rem">
        {meals.map((meal) => (
          <MealCard key={meal.id} meal={meal} onToggle={() => onToggleMeal(meal.id)} />
        ))}
      </Stack>
    </Box>
  );
};
