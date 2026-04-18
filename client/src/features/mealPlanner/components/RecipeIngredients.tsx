import { Box, Card, Typography } from "@mui/material";
import type { Ingredient } from "@/features/mealPlanner/types/mealPlanner";

interface RecipeIngredientsProps {
  ingredients?: Ingredient[];
}

export const RecipeIngredients = ({ ingredients }: RecipeIngredientsProps) => (
  <Box>
    <Typography variant="h2" sx={{ mb: "1rem" }}>Ingredients</Typography>
    <Card sx={{ p: "1.5rem" }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {ingredients?.map((ingredient: Ingredient, idx: number) => (
          <Box
            key={idx}
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
              pb: "0.75rem",
              borderBottom: idx < ingredients.length - 1 ? 1 : 0,
              borderColor: "divider",
            }}
          >
            <Box
              sx={{
                width: "0.5rem",
                height: "0.5rem",
                borderRadius: "50%",
                bgcolor: "primary.main",
                mt: "0.5rem",
                flexShrink: 0,
              }}
            />
            <Typography sx={{ flex: 1, fontWeight: 500 }}>
              {ingredient.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {ingredient.amount} {ingredient.unit}
            </Typography>
          </Box>
        ))}
      </Box>
    </Card>
  </Box>
);
