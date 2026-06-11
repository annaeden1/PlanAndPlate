import { useEffect, useState } from "react";
import { Box, Typography, Card, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { mealPlannerApi } from "@/features/mealPlanner/api/mealPlanner";
import { getUserId } from "@/shared/utils/userId";
import type { ApiRecipe } from "@/features/mealPlanner/types/mealPlanner";
import FavoriteIcon from "@mui/icons-material/Favorite";
import platePicturePlaceholder from "@/assets/plate pic.jpg";

export const LikedRecipes = () => {
  const [recipes, setRecipes] = useState<ApiRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userId = getUserId();
    const token = localStorage.getItem("access-token");
    if (!userId) return;

    mealPlannerApi.getLikedRecipes(userId, token)
      .then((data) => setRecipes(data))
      .catch((err) => console.error("Error fetching liked recipes:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (recipes.length === 0) return null;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: "1rem" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <FavoriteIcon sx={{ color: "error.main", fontSize: "1.5rem" }} />
          <Typography variant="h6" fontWeight={700}>
            Your Favorites
          </Typography>
        </Box>
        {recipes.length > 3 && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: "0.25rem", userSelect: "none" }}>
            Scroll for more &rarr;
          </Typography>
        )}
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: "1rem",
          overflowX: "auto",
          pb: "0.75rem",
          pt: "0.25rem",
          mx: "-0.5rem", // allow shadow to not be clipped on edges
          px: "0.5rem",
          // Premium subtle scrollbar
          "&::-webkit-scrollbar": {
            height: "0.375rem",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "rgba(0, 0, 0, 0.03)",
            borderRadius: "0.25rem",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(0, 0, 0, 0.12)",
            borderRadius: "0.25rem",
            transition: "background-color 0.2s",
            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.25)",
            },
          },
          scrollbarWidth: "thin", // For Firefox
          scrollbarColor: "rgba(0, 0, 0, 0.12) rgba(0, 0, 0, 0.03)",
        }}
      >
        {recipes.map((recipe) => (
          <Card
            key={recipe._id || recipe.originRecipeId}
            onClick={() => {
              window.scrollTo(0, 0);
              navigate(`/recipe/${recipe.originRecipeId}`);
            }}
            sx={{
              minWidth: "10rem",
              width: "10rem",
              borderRadius: "0.75rem",
              cursor: "pointer",
              boxShadow: "0 0.0625rem 0.25rem rgba(0,0,0,0.06)",
              border: "0.0625rem solid",
              borderColor: "grey.100",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": { 
                transform: "translateY(-0.25rem)", 
                boxShadow: "0 0.25rem 0.75rem rgba(0,0,0,0.1)" 
              },
              flexShrink: 0,
              mb: "0.5rem"
            }}
          >
            <Box
              component="img"
              src={recipe.image || platePicturePlaceholder}
              alt={recipe.name}
              onError={(e: any) => { e.target.src = platePicturePlaceholder; }}
              sx={{ width: "100%", height: "6.875rem", objectFit: "cover", borderTopLeftRadius: "0.75rem", borderTopRightRadius: "0.75rem" }}
            />
            <Box sx={{ p: "0.75rem" }}>
              <Typography 
                variant="body2" 
                fontWeight={600} 
                sx={{ 
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  height: "2.5rem",
                  lineHeight: "1.25rem",
                  mb: "0.5rem"
                }}
              >
                {recipe.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {Math.round(recipe.calories || 0)} kcal
              </Typography>
            </Box>
          </Card>
        ))}
      </Box>
    </Box>
  );
};
