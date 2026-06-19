import { useEffect, useMemo, useState } from 'react';
import { Box, Button, CircularProgress, Snackbar, Alert, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { mealPlannerApi } from '@/features/mealPlanner/api/mealPlanner';
import type { ApiRecipe } from '@/features/mealPlanner/types/mealPlanner';
import { RecipeGridCard } from '@/features/mealPlanner/components/RecipeGridCard';
import AddManualRecipeModal from '@/features/addRecipe/components/AddManualRecipeModal';
import { colors, gradients } from '@/core/theme/tokens';

type Filter = 'All' | 'Liked' | 'Quick';
const FILTERS: Filter[] = ['All', 'Liked', 'Quick'];

export function ManualRecipes() {
  const [isAddRecipeModalOpen, setIsAddRecipeModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [manualRecipes, setManualRecipes] = useState<ApiRecipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [filter, setFilter] = useState<Filter>('All');

  const loadManualRecipes = async () => {
    setLoadingRecipes(true);
    try {
      const recipes = await mealPlannerApi.getManualRecipes();
      setManualRecipes(recipes);
    } catch (error) {
      console.error('Failed to load manual recipes:', error);
    } finally {
      setLoadingRecipes(false);
    }
  };

  useEffect(() => {
    loadManualRecipes();
  }, []);

  const visibleRecipes = useMemo(() => {
    if (filter === 'Liked') return manualRecipes.filter((r) => r.isLiked);
    if (filter === 'Quick')
      return manualRecipes.filter((r) => r.readyInMinutes && r.readyInMinutes <= 20);
    return manualRecipes;
  }, [manualRecipes, filter]);

  return (
    <Box sx={{ animation: 'pp-slideUp .4s both' }}>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          mb: '1.25rem',
          flexWrap: 'wrap',
        }}
      >
        <Box className="pp-scroll" sx={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', flex: 1 }}>
          {FILTERS.map((f) => {
            const active = filter === f;
            return (
              <Box
                key={f}
                onClick={() => setFilter(f)}
                sx={{
                  flex: 'none',
                  px: '1.25rem',
                  py: '0.5625rem',
                  borderRadius: '0.8125rem',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  background: active ? gradients.cta : '#fff',
                  color: active ? '#fff' : colors.ink,
                  border: `1.5px solid ${active ? 'transparent' : 'rgba(20,40,30,.1)'}`,
                  boxShadow: '0 0.25rem 0.75rem -0.5rem rgba(20,40,30,.25)',
                  transition: 'all .25s',
                }}
              >
                {f}
              </Box>
            );
          })}
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setIsAddRecipeModalOpen(true)}>
          Add recipe
        </Button>
      </Box>

      {loadingRecipes ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: '3rem' }}>
          <CircularProgress color="primary" />
        </Box>
      ) : visibleRecipes.length > 0 ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(3,1fr)' },
            gap: '1.125rem',
          }}
        >
          {visibleRecipes.map((recipe, i) => (
            <RecipeGridCard key={recipe._id ?? recipe.name} recipe={recipe} delay={`${i * 0.04}s`} />
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            bgcolor: '#fff',
            borderRadius: '1.375rem',
            border: `1px solid ${colors.cardBorder}`,
            p: '2.5rem',
            textAlign: 'center',
          }}
        >
          <Typography sx={{ fontSize: 38 }}>📖</Typography>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: colors.ink, mt: '0.5rem' }}>
            {filter === 'All' ? 'No recipes yet' : `No ${filter.toLowerCase()} recipes`}
          </Typography>
          <Typography sx={{ fontSize: 13, color: colors.textMuted, mt: '0.25rem' }}>
            Use “Add recipe” to create your first custom recipe.
          </Typography>
        </Box>
      )}

      <AddManualRecipeModal
        open={isAddRecipeModalOpen}
        onClose={() => setIsAddRecipeModalOpen(false)}
        onSaved={async () => {
          setSuccessMessage('Recipe saved successfully.');
          await loadManualRecipes();
        }}
      />

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccessMessage(null)} sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
