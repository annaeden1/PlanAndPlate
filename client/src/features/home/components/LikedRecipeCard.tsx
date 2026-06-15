import { Box, Card, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import type { ApiRecipe } from "@/features/mealPlanner/types/mealPlanner";
import platePicturePlaceholder from "@/assets/plate pic.jpg";

interface LikedRecipeCardProps {
  recipe: ApiRecipe;
}

export const LikedRecipeCard = ({ recipe }: LikedRecipeCardProps) => {
  const navigate = useNavigate();

  return (
    <Card
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
  );
};
