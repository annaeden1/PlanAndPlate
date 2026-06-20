import { Box, Button, Chip, Typography, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { mealPlannerApi } from '@/features/mealPlanner/api/mealPlanner';
import { useGroceryList } from '@/context/GroceryListContext';
import type { ApiRecipe, RecipeSuggestion } from '@/features/mealPlanner/types/mealPlanner';
import { SuggestionsDrawer } from '@/features/mealPlanner/components/SuggestionsDrawer';
import { getUserId } from '@/shared/utils/userId';
import AddManualRecipeModal from '@/features/addRecipe/components/AddManualRecipeModal';

import { RecipeHero } from '@/features/mealPlanner/components/RecipeHero';
import { RecipeIngredients } from '@/features/mealPlanner/components/RecipeIngredients';
import { RecipeInstructions } from '@/features/mealPlanner/components/RecipeInstructions';
import { RecipeNutritionStats } from '@/features/mealPlanner/components/RecipeNutritionStats';

interface RecipeDetailProps {}

export function RecipeDetail({}: RecipeDetailProps) {
  const { recipeId } = useParams<{ recipeId: string }>();
  const navigate = useNavigate();
  const { importRecipe } = useGroceryList();
  const [recipe, setRecipe] = useState<ApiRecipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = Boolean(
    recipe && recipe.source === 'manual' && recipe.userId === getUserId(),
  );

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
      setSnackbar({ open: true, message: 'Failed to load suggestions.', severity: 'error' });
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleUseSuggestion = async (s: RecipeSuggestion) => {
    const userId = getUserId() ?? '';
    try {
      if (date) {
        await mealPlannerApi.replaceMeal(
          userId,
          { date, mealType, newRecipeId: s.originRecipeId },
        );
      }
      setDrawerOpen(false);
      navigate(`/recipe/${s.originRecipeId}${date ? `?date=${date}&mealType=${mealType}` : ''}`);
    } catch (err) {
      console.error('Failed to replace meal:', err);
      setSnackbar({ open: true, message: 'Failed to replace meal.', severity: 'error' });
    }
  };

  const handleAddIngredientsToList = async () => {
    if (!recipe) return;

    try {
      const id = recipe._id || recipe.originRecipeId || recipeId || '';
      await importRecipe(id);
      setSnackbar({
        open: true,
        message: 'Ingredients added to grocery list successfully!',
        severity: 'success',
      });
    } catch (err) {
      console.error('Failed to import ingredients from recipe:', err);
      setSnackbar({
        open: true,
        message: 'Failed to add ingredients to grocery list.',
        severity: 'error',
      });
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
      setSnackbar({
        open: true,
        message: 'Failed to save like status.',
        severity: 'error',
      });
    }
  };

  const handleDeleteRecipe = async () => {
    if (!recipe) return;
    setDeleting(true);
    try {
      const id = recipe.originRecipeId || recipeId || '';
      await mealPlannerApi.deleteManualRecipe(id);
      setDeleteDialogOpen(false);
      navigate('/my-recipes');
    } catch (err) {
      console.error('Failed to delete recipe:', err);
      setDeleteDialogOpen(false);
      setSnackbar({ open: true, message: 'Failed to delete recipe.', severity: 'error' });
    } finally {
      setDeleting(false);
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

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: '3rem' }}>
      {loading && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
          }}
        >
          <Typography>Loading recipe...</Typography>
        </Box>
      )}
      {error && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
          }}
        >
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      {recipe && (
        <>
          <RecipeHero
            recipe={recipe}
            onBack={() => navigate(-1)}
            onToggleLike={handleToggleLike}
          />

          <Box sx={{ maxWidth: '64rem', mx: 'auto', px: '1.5rem', mt: '2rem' }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, 1fr)' },
                gap: '2rem',
              }}
            >
              <Box
                sx={{
                  gridColumn: { lg: 'span 2' },
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2rem',
                }}
              >
                {recipe.diets && recipe.diets.length > 0 && (
                  <Box
                    sx={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}
                  >
                    {recipe.diets.map((diet: string, idx: number) => (
                      <Chip
                        key={idx}
                        label={diet}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(62, 180, 137, 0.1)',
                          color: 'primary.main',
                        }}
                      />
                    ))}
                  </Box>
                )}
                <RecipeIngredients
                  ingredients={recipe.instructions?.ingredients}
                />
                <RecipeInstructions steps={recipe.instructions?.steps} />
              </Box>

              <Box
                sx={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
              >
                <RecipeNutritionStats recipe={recipe} />
                <Button
                  variant="contained"
                  sx={{ height: '3rem', borderRadius: '0.625rem' }}
                  onClick={handleAddIngredientsToList}
                >
                  Add Ingredients to Cart
                </Button>
                <Button
                  variant="outlined"
                  sx={{ height: '3rem', borderRadius: '0.625rem' }}
                  onClick={handleOpenSuggestions}
                >
                  New Recipe Suggestions for you
                </Button>
                {isOwner && (
                  <>
                    <Button
                      variant="outlined"
                      color="primary"
                      sx={{ height: '3rem', borderRadius: '0.625rem' }}
                      onClick={() => setEditModalOpen(true)}
                    >
                      Edit Recipe
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      sx={{ height: '3rem', borderRadius: '0.625rem' }}
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      Delete Recipe
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          </Box>
        </>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <SuggestionsDrawer
        open={drawerOpen}
        loading={suggestionsLoading}
        suggestions={suggestions}
        onClose={() => setDrawerOpen(false)}
        onUse={handleUseSuggestion}
      />

      {/* Edit Modal */}
      <AddManualRecipeModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        recipeToEdit={recipe ?? undefined}
        onSaved={async () => {
          setEditModalOpen(false);
          // Reload recipe data
          if (recipeId) {
            const updated = await mealPlannerApi.getRecipeDetails(recipeId);
            setRecipe(updated);
          }
          setSnackbar({ open: true, message: 'Recipe updated successfully!', severity: 'success' });
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Recipe</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete &ldquo;{recipe?.name}&rdquo;? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button onClick={handleDeleteRecipe} color="error" disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
