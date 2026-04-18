import { Box, Button, Chip, Typography, Snackbar, Alert } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { mealPlannerApi } from "@/features/mealPlanner/api/mealPlanner";
import { groceryListApi } from "@/features/groceryList/api/groceryList";
import { getUserId } from "@/shared/utils/userId";
import type { ApiRecipe } from "@/features/mealPlanner/types/mealPlanner";

import { RecipeHero } from "@/features/mealPlanner/components/RecipeHero";
import { RecipeIngredients } from "@/features/mealPlanner/components/RecipeIngredients";
import { RecipeInstructions } from "@/features/mealPlanner/components/RecipeInstructions";
import { RecipeNutritionStats } from "@/features/mealPlanner/components/RecipeNutritionStats";

interface RecipeDetailProps {}

export function RecipeDetail({}: RecipeDetailProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const meal = location.state?.recipe;
  const [recipe, setRecipe] = useState<ApiRecipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleAddIngredientsToList = async () => {
    if (!recipe) return;

    try {
      const userId = getUserId() ?? "";
      const recipeId = recipe._id || recipe.originRecipeId || meal?.id?.toString() || "";
      await groceryListApi.importRecipe(userId, recipeId, "");
      setSnackbar({ open: true, message: 'Ingredients added to grocery list successfully!', severity: 'success' });
    } catch (err) {
      console.error('Failed to import ingredients from recipe:', err);
      setSnackbar({ open: true, message: 'Failed to add ingredients to grocery list.', severity: 'error' });
    }
  };

  const handleToggleLike = async () => {
    if (!recipe) return;
    const token = localStorage.getItem('access-token');
    const recipeId = recipe.originRecipeId || meal?.id?.toString() || "";
    
    // Optimistic UI update
    setRecipe(prev => prev ? { ...prev, isLiked: !prev.isLiked } : prev);
    
    try {
      const result = await mealPlannerApi.toggleRecipeLike(recipeId, token);
      // Sync with backend confirmed state
      setRecipe(prev => prev ? { ...prev, isLiked: result.isLiked } : prev);
    } catch (err) {
      console.error('Failed to toggle like:', err);
      // Revert optimistic update
      setRecipe(prev => prev ? { ...prev, isLiked: !prev.isLiked } : prev);
      setSnackbar({ open: true, message: 'Failed to save like status.', severity: 'error' });
    }
  };

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const token = localStorage.getItem('access-token');
        if (!meal?.id) {
          setError("No recipe ID provided");
          setLoading(false);
          return;
        }
        const data = await mealPlannerApi.getRecipeDetails(meal.id.toString(), token);
        setRecipe(data);
      } catch (err) {
        console.error("Error fetching recipe:", err);
        setError("Failed to load recipe details");
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [meal?.id]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: "3rem" }}>
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
          <Typography>Loading recipe...</Typography>
        </Box>
      )}
      {error && (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}
      
      {recipe && (
        <>
          <RecipeHero 
            recipe={recipe} 
            onBack={() => navigate("/planner")} 
            onToggleLike={handleToggleLike} 
          />

          <Box sx={{ maxWidth: "64rem", mx: "auto", px: "1.5rem", mt: "2rem" }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(3, 1fr)" }, gap: "2rem" }}>
              
              <Box sx={{ gridColumn: { lg: "span 2" }, display: "flex", flexDirection: "column", gap: "2rem" }}>
                {recipe.diets && recipe.diets.length > 0 && (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {recipe.diets.map((diet: string, idx: number) => (
                      <Chip key={idx} label={diet} size="small" sx={{ bgcolor: "rgba(62, 180, 137, 0.1)", color: "primary.main" }} />
                    ))}
                  </Box>
                )}
                <RecipeIngredients ingredients={recipe.instructions?.ingredients} />
                <RecipeInstructions steps={recipe.instructions?.steps} />
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <RecipeNutritionStats recipe={recipe} />
                <Button variant="contained" sx={{ height: "3rem", borderRadius: "0.625rem" }} onClick={handleAddIngredientsToList}>
                  Add Ingredients to Cart
                </Button>
              </Box>

            </Box>
          </Box>
        </>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
