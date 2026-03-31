import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Typography,
} from "@mui/material";
import type { MealPlanItem } from "../../utils/types/mealPlanner";

interface PlannedMealCardProps {
  meal: MealPlanItem;
  onViewRecipe: (meal: MealPlanItem) => void;
  onAddToList: (meal: MealPlanItem) => void;
}

export function PlannedMealCard({ meal, onViewRecipe, onAddToList }: PlannedMealCardProps) {
  return (
    <Card
      sx={{
        overflow: "hidden",
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: 4 },
      }}
    >
      <Box sx={{ position: "relative", height: "12rem" }}>
        <Box
          component="img"
          src={meal.image}
          alt={meal.name}
          sx={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <Chip
          label={meal.type}
          size="small"
          sx={{
            position: "absolute",
            top: "0.75rem",
            right: "0.75rem",
            bgcolor: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(4px)",
          }}
        />
      </Box>
      <CardContent>
        <Typography variant="h4" sx={{ mb: "0.25rem" }}>
          {meal.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: "1rem" }}>
          {Math.round(meal.calories)} calories
        </Typography>
        <Box sx={{ display: "flex", gap: "0.5rem" }}>
          <Button
            variant="outlined"
            fullWidth
            sx={{ borderRadius: "0.625rem" }}
            onClick={() => onViewRecipe(meal)}
          >
            View Recipe
          </Button>
          <Button
            variant="contained"
            fullWidth
            sx={{ borderRadius: "0.625rem" }}
            onClick={() => onAddToList(meal)}
          >
            Add to List
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
