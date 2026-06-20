import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { mealPlannerApi } from '@/features/mealPlanner/api/mealPlanner';
import { useGroceryList } from '@/context/GroceryListContext';
import type { ApiRecipe, RecipeSuggestion } from '@/features/mealPlanner/types/mealPlanner';
import { SuggestionsDrawer } from '@/features/mealPlanner/components/SuggestionsDrawer';
import { getUserId } from '@/shared/utils/userId';
import { AppSnackbar } from '@/components/common/AppSnackbar';
import { useSnackbar } from '@/shared/hooks/useSnackbar';
import { RecipeHero } from '@/features/mealPlanner/components/RecipeHero';
import { RecipeIngredients } from '@/features/mealPlanner/components/RecipeIngredients';
import { RecipeInstructions } from '@/features/mealPlanner/components/RecipeInstructions';
import { RecipeNutritionStats } from '@/features/mealPlanner/components/RecipeNutritionStats';

export function RecipeDetail() {
  const { recipeId } = useParams<{ recipeId: string }>();
  const navigate = useNavigate();
  const { importRecipe } = useGroceryList();
  const [recipe, setRecipe] = useState<ApiRecipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { snackbar, showSuccess, showError, close } = useSnackbar();

  const [searchParams] = useSearchParams();
  const date = searchParams.get('date');
  const mealType = searchParams.get('mealType') ?? 'dinner';

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([]);

  const handleOpenSuggestions = async () => {
    setDrawerOpen(true);
    setSuggestionsLoading(true);
    try {
      const userId = getUserId() ?? '';
      const id = recipe?.originRecipeId || recipeId || '';
      const data = await mealPlannerApi.getSuggestions(userId, id, mealType);
      setSuggestions(data);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
      showError('Failed to load suggestions.');
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleUseSuggestion = async (s: RecipeSuggestion) => {
    const userId = getUserId() ?? '';
    try {
      if (date) {
        await mealPlannerApi.replaceMeal(userId, { date, mealType, newRecipeId: s.originRecipeId });
      }
      setDrawerOpen(false);
      navigate(`/recipe/${s.originRecipeId}${date ? `?date=${date}&mealType=${mealType}` : ''}`);
    } catch (err) {
      console.error('Failed to replace meal:', err);
      showError('Failed to replace meal.');
    }
  };

  const handleAddIngredientsToList = async () => {
    if (!recipe) return;
    try {
      const id = recipe._id || recipe.originRecipeId || recipeId || '';
      await importRecipe(id);
      showSuccess('Ingredients added to grocery list successfully!');
    } catch (err) {
      console.error('Failed to import ingredients from recipe:', err);
      showError('Failed to add ingredients to grocery list.');
    }
  };

  const handleToggleLike = async () => {
    if (!recipe) return;
    const id = recipe.originRecipeId || recipeId || '';
    setRecipe((prev) => (prev ? { ...prev, isLiked: !prev.isLiked } : prev));
    try {
      const result = await mealPlannerApi.toggleRecipeLike(id);
      setRecipe((prev) => (prev ? { ...prev, isLiked: result.isLiked } : prev));
    } catch (err) {
      console.error('Failed to toggle like:', err);
      setRecipe((prev) => (prev ? { ...prev, isLiked: !prev.isLiked } : prev));
      showError('Failed to save like status.');
    }
  };

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        if (!recipeId) {
          setError('No recipe ID provided');
          setLoading(false);
          return;
        }
        const data = await mealPlannerApi.getRecipeDetails(recipeId);
        setRecipe(data);
      } catch (err) {
        console.error('Error fetching recipe:', err);
        setError('Failed to load recipe details');
      } finally {
        setLoading(false);
      }
    };
    fetchRecipe();
  }, [recipeId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: '4rem' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" sx={{ textAlign: 'center', py: '4rem' }}>
        {error}
      </Typography>
    );
  }

  if (!recipe) return null;

  return (
    <Box sx={{ animation: 'pp-slideUp .4s both' }}>
      <RecipeHero recipe={recipe} onBack={() => navigate(-1)} onToggleLike={handleToggleLike} />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1.7fr 1fr' },
          gap: '2rem',
          mt: '2rem',
          alignItems: 'start',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2rem', minWidth: 0 }}>
          <RecipeIngredients ingredients={recipe.instructions?.ingredients} />
          <RecipeInstructions steps={recipe.instructions?.steps} />
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            minWidth: 0,
            position: { lg: 'sticky' },
            top: { lg: '1.5rem' },
          }}
        >
          <RecipeNutritionStats recipe={recipe} />
          <Button
            variant="contained"
            sx={{ height: '3rem', borderRadius: '0.875rem' }}
            onClick={handleAddIngredientsToList}
          >
            Add ingredients to cart
          </Button>
          <Button
            variant="outlined"
            sx={{ height: '3rem', borderRadius: '0.875rem' }}
            onClick={handleOpenSuggestions}
          >
            Suggest alternatives
          </Button>
        </Box>
      </Box>

      <AppSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={close} />

      <SuggestionsDrawer
        open={drawerOpen}
        loading={suggestionsLoading}
        suggestions={suggestions}
        onClose={() => setDrawerOpen(false)}
        onUse={handleUseSuggestion}
      />
    </Box>
  );
}
