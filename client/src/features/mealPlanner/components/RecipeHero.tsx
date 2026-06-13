import { Box, Chip, IconButton, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import GroupIcon from "@mui/icons-material/Group";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import type { ApiRecipe } from "@/features/mealPlanner/types/mealPlanner";
import platePicturePlaceholder from "@/assets/plate pic.jpg";

interface RecipeHeroProps {
  recipe: ApiRecipe;
  onBack: () => void;
  onToggleLike: () => void;
}

export const RecipeHero = ({ recipe, onBack, onToggleLike }: RecipeHeroProps) => (
  <Box sx={{ position: "relative", height: "25rem", bgcolor: "grey.100" }}>
    <Box
      component="img"
      src={recipe.image || platePicturePlaceholder}
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
      onClick={onBack}
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

    <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, p: "2rem" }}>
      <Box sx={{ maxWidth: "64rem", mx: "auto" }}>
        <Chip
          label={recipe.diets?.[0] || "Recipe"}
          size="small"
          color="primary"
          sx={{ mb: "0.75rem" }}
        />
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Typography variant="h1" sx={{ fontSize: "3rem", mb: "1rem" }}>
            {recipe.name}
          </Typography>
          <IconButton
            onClick={onToggleLike}
            sx={{
              bgcolor: "rgba(255,255,255,0.8)",
              "&:hover": { bgcolor: "background.paper" },
              mt: "0.5rem"
            }}
          >
            {recipe.isLiked ? <FavoriteIcon color="error" fontSize="large" /> : <FavoriteBorderIcon fontSize="large" />}
          </IconButton>
        </Box>
        <Box sx={{ display: "flex", gap: "1.5rem", color: "text.secondary" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <AccessTimeIcon sx={{ fontSize: "1.25rem" }} />
            <Typography>{recipe.readyInMinutes} mins</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <GroupIcon sx={{ fontSize: "1.25rem" }} />
            <Typography>{recipe.servings} servings</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <LocalFireDepartmentIcon sx={{ fontSize: "1.25rem" }} />
            <Typography>{Math.round(recipe.calories || 0)} cal</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  </Box>
);
