import { Box, Card, Typography } from "@mui/material";
import type { ApiRecipe } from "@/features/mealPlanner/types/mealPlanner";

interface RecipeNutritionStatsProps {
  recipe: ApiRecipe;
}

export const RecipeNutritionStats = ({ recipe }: RecipeNutritionStatsProps) => (
  <Box>
    <Typography variant="h3" sx={{ mb: "1rem" }}>Nutrition Facts</Typography>
    <Card sx={{ p: "1.5rem" }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: "0.75rem", borderBottom: 1, borderColor: "divider" }}>
          <Typography color="text.secondary">Calories</Typography>
          <Typography fontWeight={600}>{Math.round(recipe.calories || 0)}</Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: "0.75rem", borderBottom: 1, borderColor: "divider" }}>
          <Typography color="text.secondary">Protein</Typography>
          <Typography fontWeight={600}>{Math.round(recipe.protein || 0)}g</Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: "0.75rem", borderBottom: 1, borderColor: "divider" }}>
          <Typography color="text.secondary">Fat</Typography>
          <Typography fontWeight={600}>{Math.round(recipe.fat || 0)}g</Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography color="text.secondary">Carbs</Typography>
          <Typography fontWeight={600}>{Math.round(recipe.carbs || 0)}g</Typography>
        </Box>
      </Box>
    </Card>
  </Box>
);
