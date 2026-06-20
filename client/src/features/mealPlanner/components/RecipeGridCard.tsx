import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { ApiRecipe } from '@/features/mealPlanner/types/mealPlanner';
import { colors, foodGradientFor } from '@/core/theme/tokens';

interface RecipeGridCardProps {
  recipe: ApiRecipe;
  delay?: string;
}

export const RecipeGridCard = ({ recipe, delay = '0s' }: RecipeGridCardProps) => {
  const navigate = useNavigate();
  const [imgOk, setImgOk] = useState(Boolean(recipe.image));
  const tag = recipe.isLiked ? 'Liked' : 'Custom';

  return (
    <Box
      onClick={() => navigate(`/recipe/${recipe.originRecipeId || recipe._id}`)}
      sx={{
        bgcolor: '#fff',
        borderRadius: '1.25rem',
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: '0 0.5rem 1.375rem -1rem rgba(20,40,30,.4)',
        border: `1px solid ${colors.cardBorder}`,
        transition: 'transform .18s',
        animation: 'pp-slideUp .5s both',
        animationDelay: delay,
        '&:hover': { transform: 'translateY(-0.25rem)' },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          height: 130,
          background: foodGradientFor(recipe.name),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 50,
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
            fontSize: 11,
            fontWeight: 700,
            color: colors.greenDeepest,
            bgcolor: colors.mintSoft,
            px: '0.625rem',
            py: '0.1875rem',
            borderRadius: '0.5rem',
          }}
        >
          {tag}
        </Box>
      </Box>
      <Box sx={{ p: '0.875rem 1rem' }}>
        <Typography noWrap sx={{ fontSize: 15, fontWeight: 700, color: colors.ink }}>
          {recipe.name}
        </Typography>
        <Box sx={{ display: 'flex', gap: '0.75rem', mt: '0.5rem' }}>
          {recipe.readyInMinutes ? (
            <Typography sx={{ fontSize: 12, color: colors.textMuted }}>⏱ {recipe.readyInMinutes} min</Typography>
          ) : null}
          {recipe.calories ? (
            <Typography sx={{ fontSize: 12, color: colors.textMuted }}>🔥 {Math.round(recipe.calories)} kcal</Typography>
          ) : null}
        </Box>
        {recipe.servings ? (
          <Box
            component="span"
            sx={{
              display: 'inline-block',
              mt: '0.625rem',
              fontSize: 11.5,
              fontWeight: 600,
              color: colors.greenLeaf,
              bgcolor: colors.mintTint,
              px: '0.5625rem',
              py: '0.1875rem',
              borderRadius: '0.5rem',
            }}
          >
            {recipe.servings} servings
          </Box>
        ) : null}
      </Box>
    </Box>
  );
};
