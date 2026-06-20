import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import { useNavigate } from 'react-router-dom';
import type { ApiRecipe } from '@/features/mealPlanner/types/mealPlanner';
import { colors, foodGradientFor } from '@/core/theme/tokens';

interface LikedRecipeCardProps {
  recipe: ApiRecipe;
}

export const LikedRecipeCard = ({ recipe }: LikedRecipeCardProps) => {
  const navigate = useNavigate();
  const [imgOk, setImgOk] = useState(Boolean(recipe.image));

  return (
    <Box
      onClick={() => navigate(`/recipe/${recipe.originRecipeId}`)}
      sx={{
        flex: 'none',
        width: 188,
        bgcolor: '#fff',
        borderRadius: '1.25rem',
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: '0 0.5rem 1.375rem -1rem rgba(20,40,30,.45)',
        border: `1px solid ${colors.cardBorder}`,
        transition: 'transform .18s',
        '&:hover': { transform: 'translateY(-0.25rem)' },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          height: 108,
          background: foodGradientFor(recipe.name),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 44,
        }}
      >
        {imgOk ? (
          <Box
            component="img"
            src={recipe.image}
            alt={recipe.name}
            onError={() => setImgOk(false)}
            sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          '🍲'
        )}
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'rgba(255,255,255,.88)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FavoriteRoundedIcon sx={{ fontSize: 15, color: colors.orange }} />
        </Box>
      </Box>
      <Box sx={{ p: '0.75rem 0.875rem' }}>
        <Typography noWrap sx={{ fontSize: 14, fontWeight: 700, color: colors.ink }}>
          {recipe.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.625rem', mt: '0.4375rem' }}>
          {recipe.readyInMinutes ? (
            <Typography sx={{ fontSize: 12, color: colors.textMuted }}>
              ⏱ {recipe.readyInMinutes} min
            </Typography>
          ) : null}
        </Box>
        <Typography sx={{ fontSize: 11.5, color: colors.textMuted, mt: '0.25rem' }}>
          🔥 {Math.round(recipe.calories || 0)} kcal
        </Typography>
      </Box>
    </Box>
  );
};
