import { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded';
import AddShoppingCartRoundedIcon from '@mui/icons-material/AddShoppingCartRounded';
import type { MealPlanItem } from '@/features/mealPlanner/types/mealPlanner';
import { colors, foodGradientFor } from '@/core/theme/tokens';

interface PlannedMealCardProps {
  meal: MealPlanItem;
  onViewRecipe: (meal: MealPlanItem) => void;
  onAddToList: (meal: MealPlanItem) => void;
  delay?: string;
}

const TYPE_EMOJI: Record<string, string> = {
  Breakfast: '🥑',
  Lunch: '🥗',
  Dinner: '🍣',
};

export function PlannedMealCard({ meal, onViewRecipe, onAddToList, delay = '0s' }: PlannedMealCardProps) {
  const [imgOk, setImgOk] = useState(Boolean(meal.image));

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        bgcolor: '#fff',
        borderRadius: '1.125rem',
        overflow: 'hidden',
        boxShadow: '0 0.5rem 1.5rem -1rem rgba(20,40,30,.4)',
        border: `1px solid ${colors.cardBorder}`,
        animation: 'pp-slideUp .5s both',
        animationDelay: delay,
      }}
    >
      <Box
        sx={{
          width: 90,
          flex: 'none',
          position: 'relative',
          background: foodGradientFor(meal.name),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 36,
        }}
      >
        {imgOk ? (
          <Box
            component="img"
            src={meal.image}
            alt={meal.name}
            onError={() => setImgOk(false)}
            sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          TYPE_EMOJI[meal.type] ?? '🍽️'
        )}
      </Box>

      <Box sx={{ flex: 1, p: '0.75rem 0.875rem', minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <Box
            component="span"
            sx={{
              fontSize: 10,
              fontWeight: 700,
              color: colors.greenLeaf,
              bgcolor: colors.mintTint,
              px: '0.5625rem',
              py: '0.125rem',
              borderRadius: '0.4375rem',
            }}
          >
            {meal.type}
          </Box>
          <Typography sx={{ fontSize: 12, color: colors.textMuted }}>
            🔥 {Math.round(meal.calories)} kcal
          </Typography>
        </Box>
        <Typography
          noWrap
          sx={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: 15,
            fontWeight: 700,
            color: colors.ink,
            mt: '0.375rem',
          }}
        >
          {meal.name}
        </Typography>
        <Box sx={{ display: 'flex', gap: '0.5rem', mt: '0.625rem' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RestaurantMenuRoundedIcon />}
            onClick={() => onViewRecipe(meal)}
            sx={{ fontSize: 12, py: '0.25rem' }}
          >
            View recipe
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddShoppingCartRoundedIcon />}
            onClick={() => onAddToList(meal)}
            sx={{ fontSize: 12, py: '0.25rem' }}
          >
            Add to list
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
