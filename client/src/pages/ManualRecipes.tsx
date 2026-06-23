import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Stack } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { PageHeader } from '@/components/common/PageHeader';
import { mealPlannerApi } from '@/features/mealPlanner/api/mealPlanner';
import type { ApiRecipe } from '@/features/mealPlanner/types/mealPlanner';
import AddManualRecipeModal from '@/features/addRecipe/components/AddManualRecipeModal';
import { AddToWeeklyMenuModal } from '@/features/mealPlanner/components/AddToWeeklyMenuModal';
import { getUserId } from '@/shared/utils/userId';
import platePicturePlaceholder from '@/assets/plate pic.jpg';

export function ManualRecipes() {
  const navigate = useNavigate();
  const [isAddRecipeModalOpen, setIsAddRecipeModalOpen] = useState(false);
  const [selectedRecipeForMenu, setSelectedRecipeForMenu] =
    useState<ApiRecipe | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualRecipes, setManualRecipes] = useState<ApiRecipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);

  const handleOpenAddRecipeModal = () => {
    setSuccessMessage(null);
    setErrorMessage(null);
    setIsAddRecipeModalOpen(true);
  };

  const handleCloseAddRecipeModal = () => {
    setIsAddRecipeModalOpen(false);
  };

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

  const handleConfirmAddToMenu = async (date: string, mealType: string) => {
    if (!selectedRecipeForMenu) return;
    const userId = getUserId();
    if (!userId) {
      setErrorMessage('Error: User not authenticated.');
      setSuccessMessage(null);
      return;
    }
    try {
      await mealPlannerApi.replaceMeal(userId, {
        date,
        mealType,
        newRecipeId:
          selectedRecipeForMenu.originRecipeId ||
          selectedRecipeForMenu._id ||
          '',
      });
      setSuccessMessage(
        `Recipe "${selectedRecipeForMenu.name}" added to menu for ${date} (${mealType}).`,
      );
      setErrorMessage(null);
    } catch (error: any) {
      if (error.response?.status === 404) {
        try {
          await mealPlannerApi.createWeeklyPlan(userId, date);
          await mealPlannerApi.replaceMeal(userId, {
            date,
            mealType,
            newRecipeId:
              selectedRecipeForMenu.originRecipeId ||
              selectedRecipeForMenu._id ||
              '',
          });
          setSuccessMessage(
            `Recipe "${selectedRecipeForMenu.name}" added to menu for ${date} (${mealType}).`,
          );
          setErrorMessage(null);
          return;
        } catch (retryError) {
          console.error(
            'Failed to replace meal after initializing plan:',
            retryError,
          );
        }
      }
      console.error('Failed to replace meal:', error);
      setErrorMessage('Failed to add recipe to menu. Please try again.');
      setSuccessMessage(null);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: '3rem' }}>
      <PageHeader
        title="Manual Recipes"
        subtitle="Add and manage your custom recipes"
        action={
          <Button variant="contained" onClick={handleOpenAddRecipeModal}>
            Add Recipe
          </Button>
        }
      />
      <Box
        sx={{
          maxWidth: '80rem',
          mx: 'auto',
          px: { xs: '1rem', sm: '1.5rem' },
          py: '1.5rem',
        }}
      >
        {loadingRecipes ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Loading your recipes...
          </Typography>
        ) : manualRecipes.length > 0 ? (
          <Stack spacing={2} sx={{ mb: 3 }}>
            {manualRecipes.map((recipe) => (
              <Box
                key={recipe._id ?? recipe.name}
                onClick={() =>
                  navigate(`/recipe/${recipe.originRecipeId || recipe._id}`)
                }
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    borderColor: 'primary.main',
                    boxShadow: 1,
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    component="img"
                    src={recipe.image || platePicturePlaceholder}
                    alt={recipe.name}
                    onError={(e: any) => {
                      e.target.src = platePicturePlaceholder;
                    }}
                    sx={{
                      width: 80,
                      height: 80,
                      objectFit: 'cover',
                      borderRadius: 1,
                      bgcolor: 'background.default',
                    }}
                  />
                  <Box>
                    <Typography variant="h6" sx={{ mb: 0.5 }}>
                      {recipe.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {recipe.servings
                        ? `${recipe.servings} servings`
                        : 'Servings not set'}
                      {' • '}
                      {recipe.readyInMinutes
                        ? `${recipe.readyInMinutes} min`
                        : 'Ready time not set'}
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<CalendarTodayIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSuccessMessage(null);
                    setErrorMessage(null);
                    setSelectedRecipeForMenu(recipe);
                  }}
                  sx={{
                    ml: 2,
                    flexShrink: 0,
                    textTransform: 'none',
                    borderRadius: '1.5rem',
                  }}
                >
                  Add to Menu
                </Button>
              </Box>
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            No manual recipes added yet. Use the button above to create one.
          </Typography>
        )}
        {successMessage && (
          <Typography variant="body2" color="success.main" sx={{ mt: 2 }}>
            {successMessage}
          </Typography>
        )}
        {errorMessage && (
          <Typography variant="body2" color="error.main" sx={{ mt: 2 }}>
            {errorMessage}
          </Typography>
        )}
      </Box>

      <AddManualRecipeModal
        open={isAddRecipeModalOpen}
        onClose={handleCloseAddRecipeModal}
        onSaved={async () => {
          setSuccessMessage('Recipe saved successfully.');
          setErrorMessage(null);
          await loadManualRecipes();
        }}
      />

      <AddToWeeklyMenuModal
        open={selectedRecipeForMenu !== null}
        onClose={() => setSelectedRecipeForMenu(null)}
        recipe={selectedRecipeForMenu}
        onConfirm={handleConfirmAddToMenu}
      />
    </Box>
  );
}
