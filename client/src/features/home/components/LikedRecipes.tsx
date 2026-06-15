import { useEffect, useState, useRef } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import { mealPlannerApi } from "@/features/mealPlanner/api/mealPlanner";
import { getUserId } from "@/shared/utils/userId";
import type { ApiRecipe } from "@/features/mealPlanner/types/mealPlanner";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { LikedRecipeCard } from "./LikedRecipeCard";

export const LikedRecipes = () => {
  const [recipes, setRecipes] = useState<ApiRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [canScroll, setCanScroll] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const checkScroll = () => {
    if (containerRef.current) {
      const { scrollWidth, clientWidth } = containerRef.current;
      setCanScroll(scrollWidth > clientWidth);
    }
  };

  useEffect(() => {
    const userId = getUserId();
    const token = localStorage.getItem("access-token");
    if (!userId) {
      setLoading(false);
      return;
    }

    mealPlannerApi.getLikedRecipes(userId, token)
      .then((data) => setRecipes(data))
      .catch((err) => console.error("Error fetching liked recipes:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && recipes.length > 0) {
      const timer = setTimeout(checkScroll, 100);
      window.addEventListener("resize", checkScroll);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [recipes, loading]);

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
        {canScroll && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: "0.25rem", userSelect: "none" }}>
            Scroll for more &rarr;
          </Typography>
        )}
      </Box>

      <Box
        ref={containerRef}
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
          <LikedRecipeCard
            key={recipe._id || recipe.originRecipeId}
            recipe={recipe}
          />
        ))}
      </Box>
    </Box>
  );
};
