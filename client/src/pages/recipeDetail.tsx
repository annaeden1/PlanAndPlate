import { Box, Button, Card, Chip, IconButton, Typography } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import GroupIcon from "@mui/icons-material/Group";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import { mealPlannerApi } from "../api/mealPlanner";
import type { Ingredient, ApiRecipe } from "../utils/types/mealPlanner";

interface RecipeDetailProps {}

export function RecipeDetail({}: RecipeDetailProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const meal = location.state?.recipe;
  const [recipe, setRecipe] = useState<ApiRecipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          <Box sx={{ position: "relative", height: "25rem", bgcolor: "grey.100" }}>
            <Box
              component="img"
              src={recipe.image}
              alt={recipe.name}
              sx={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0.5) 50%, transparent 100%)",
              }}
            />

            <IconButton
              onClick={() => navigate("/planner")}
              sx={{
                position: "absolute",
                top: "1rem",
                left: "1rem",
                bgcolor: "rgba(255,255,255,0.8)",
                backdropFilter: "blur(4px)",
                "&:hover": { bgcolor: "background.paper" },
              }}
            >
              <ArrowBackIcon />
            </IconButton>

            <Box
              sx={{ position: "absolute", bottom: 0, left: 0, right: 0, p: "2rem" }}
            >
              <Box sx={{ maxWidth: "64rem", mx: "auto" }}>
                <Chip
                  label={recipe.diets?.[0] || "Recipe"}
                  size="small"
                  color="primary"
                  sx={{ mb: "0.75rem" }}
                />
                <Typography variant="h1" sx={{ fontSize: "3rem", mb: "1rem" }}>
                  {recipe.name}
                </Typography>
                <Box
                  sx={{ display: "flex", gap: "1.5rem", color: "text.secondary" }}
                >
                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                  >
                    <AccessTimeIcon sx={{ fontSize: "1.25rem" }} />
                    <Typography>{recipe.readyInMinutes} mins</Typography>
                  </Box>
                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                  >
                    <GroupIcon sx={{ fontSize: "1.25rem" }} />
                    <Typography>{recipe.servings} servings</Typography>
                  </Box>
                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                  >
                    <LocalFireDepartmentIcon sx={{ fontSize: "1.25rem" }} />
                    <Typography>{recipe.calories} cal</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Content */}
          <Box sx={{ maxWidth: "64rem", mx: "auto", px: "1.5rem", mt: "2rem" }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", lg: "repeat(3, 1fr)" },
                gap: "2rem",
              }}
            >
              {/* Main Content */}
              <Box
                sx={{
                  gridColumn: { lg: "span 2" },
                  display: "flex",
                  flexDirection: "column",
                  gap: "2rem",
                }}
              >
                {/* Tags */}
                {recipe.diets && (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {recipe.diets.map((diet: string, idx: number) => (
                      <Chip
                        key={idx}
                        label={diet}
                        size="small"
                        sx={{
                          bgcolor: "rgba(62, 180, 137, 0.1)",
                          color: "primary.main",
                        }}
                      />
                    ))}
                  </Box>
                )}

                {/* Ingredients */}
                <Box>
                  <Typography variant="h2" sx={{ mb: "1rem" }}>
                    Ingredients
                  </Typography>
                  <Card sx={{ p: "1.5rem" }}>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem",
                      }}
                    >
                      {recipe.instructions?.ingredients?.map((ingredient: Ingredient, idx: number) => (
                        <Box
                          key={idx}
                          sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "0.75rem",
                            pb: "0.75rem",
                            borderBottom:
                              idx < (recipe.instructions?.ingredients?.length || 0) - 1 ? 1 : 0,
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

                {/* Instructions */}
                <Box>
                  <Typography variant="h2" sx={{ mb: "1rem" }}>
                    Instructions
                  </Typography>
                  <Card sx={{ p: "1.5rem" }}>
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: "1rem" }}
                    >
                      {recipe.instructions?.steps?.map((step: string, idx: number) => (
                        <Box key={idx} sx={{ display: "flex", gap: "1rem" }}>
                          <Box
                            sx={{
                              flexShrink: 0,
                              width: "2rem",
                              height: "2rem",
                              borderRadius: "50%",
                              bgcolor: "rgba(62, 180, 137, 0.1)",
                              color: "primary.main",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 600,
                            }}
                          >
                            {idx + 1}
                          </Box>
                          <Typography sx={{ flex: 1, pt: "0.25rem" }}>
                            {step}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Card>
                </Box>
              </Box>

              {/* Sidebar */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {/* Nutrition Facts */}
                <Box>
                  <Typography variant="h3" sx={{ mb: "1rem" }}>
                    Nutrition Facts
                  </Typography>
                  <Card sx={{ p: "1.5rem" }}>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          pb: "0.75rem",
                          borderBottom: 1,
                          borderColor: "divider",
                        }}
                      >
                        <Typography color="text.secondary">Calories</Typography>
                        <Typography fontWeight={600}>{recipe.calories}</Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          pb: "0.75rem",
                          borderBottom: 1,
                          borderColor: "divider",
                        }}
                      >
                        <Typography color="text.secondary">Protein</Typography>
                        <Typography fontWeight={600}>{recipe.protein}g</Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          pb: "0.75rem",
                          borderBottom: 1,
                          borderColor: "divider",
                        }}
                      >
                        <Typography color="text.secondary">Fat</Typography>
                        <Typography fontWeight={600}>{recipe.fat}g</Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography color="text.secondary">Carbs</Typography>
                        <Typography fontWeight={600}>{recipe.carbs}g</Typography>
                      </Box>
                    </Box>
                  </Card>
                </Box>

                {/* Actions */}
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
                >
                  <Button
                    variant="contained"
                    sx={{ height: "3rem", borderRadius: "0.625rem" }}
                  >
                    Add Ingredients to Cart
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}
