import { Box, Card, Typography, Chip } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import type { Meal } from "../mockData";

interface MealCardProps {
  meal: Meal;
  onToggle: () => void;
}

export const MealCard = ({ meal, onToggle }: MealCardProps) => {
  return (
    <Card
      onClick={onToggle}
      sx={{
        display: "flex",
        alignItems: "center",
        p: "1rem",
        borderRadius: "0.75rem",
        boxShadow: "0 0.0625rem 0.25rem rgba(0,0,0,0.06)",
        border: "0.0625rem solid",
        borderColor: "grey.100",
        cursor: "pointer",
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.1)" },
      }}
    >
      <Box
        component="img"
        src={meal.image}
        alt={meal.name}
        sx={{
          width: "4rem",
          height: "4rem",
          borderRadius: "0.5rem",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />

      <Box sx={{ ml: "1rem", flex: 1, minWidth: 0 }}>
        <Typography variant="body1" fontWeight={600} noWrap>
          {meal.name}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: "0.5rem", mt: "0.25rem" }}>
          <Chip
            label={meal.mealType}
            size="small"
            sx={{
              bgcolor: "grey.100",
              color: "text.secondary",
              fontWeight: 500,
              fontSize: "0.75rem",
              height: "1.5rem",
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {meal.time}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: "0.25rem" }}>
          {meal.calories} kcal
        </Typography>
      </Box>

      <Box sx={{ flexShrink: 0, ml: "0.5rem" }}>
        {meal.completed ? (
          <CheckCircleIcon sx={{ color: "primary.main", fontSize: "1.75rem" }} />
        ) : (
          <RadioButtonUncheckedIcon sx={{ color: "grey.300", fontSize: "1.75rem" }} />
        )}
      </Box>
    </Card>
  );
};
