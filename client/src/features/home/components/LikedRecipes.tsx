import { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { mealPlannerApi } from '@/features/mealPlanner/api/mealPlanner';
import { getUserId } from '@/shared/utils/userId';
import type { ApiRecipe } from '@/features/mealPlanner/types/mealPlanner';
import { LikedRecipeCard } from './LikedRecipeCard';
import { colors } from '@/core/theme/tokens';

export const LikedRecipes = () => {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<ApiRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = getUserId();
    if (!userId) {
      setLoading(false);
      return;
    }
    mealPlannerApi
      .getLikedRecipes(userId)
      .then((data) => setRecipes(data))
      .catch((err) => console.error('Error fetching liked recipes:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (recipes.length === 0) return null;

  return (
    <Box sx={{ mt: '1.75rem', animation: 'pp-slideUp .5s .22s both' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: '0.875rem',
        }}
      >
        <Typography variant="h3" sx={{ color: colors.ink }}>
          Liked recipes
        </Typography>
        <Typography
          onClick={() => navigate('/my-recipes')}
          sx={{
            fontSize: 13,
            fontWeight: 600,
            color: colors.greenLeaf,
            cursor: 'pointer',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          See all ›
        </Typography>
      </Box>

      <Box
        className="pp-scroll"
        sx={{ display: 'flex', gap: '0.875rem', overflowX: 'auto', pb: '0.5rem' }}
      >
        {recipes.map((recipe) => (
          <LikedRecipeCard key={recipe._id || recipe.originRecipeId} recipe={recipe} />
        ))}
      </Box>
    </Box>
  );
};
