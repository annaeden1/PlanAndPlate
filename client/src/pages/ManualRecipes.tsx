import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Stack } from '@mui/material';
import { PageHeader } from '@/components/common/PageHeader';
import { mealPlannerApi } from '@/features/mealPlanner/api/mealPlanner';
import type { ApiRecipe } from '@/features/mealPlanner/types/mealPlanner';
import AddManualRecipeModal from '@/features/addRecipe/components/AddManualRecipeModal';

export function ManualRecipes() {
  const navigate = useNavigate();
  const [isAddRecipeModalOpen, setIsAddRecipeModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [manualRecipes, setManualRecipes] = useState<ApiRecipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);

  const handleOpenAddRecipeModal = () => {
    setSuccessMessage(null);
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
                  '&:hover': {
                    bgcolor: 'action.hover',
                    borderColor: 'primary.main',
                    boxShadow: 1,
                  },
                }}
              >
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
      </Box>

      <AddManualRecipeModal
        open={isAddRecipeModalOpen}
        onClose={handleCloseAddRecipeModal}
        onSaved={async () => {
          setSuccessMessage('Recipe saved successfully.');
          await loadManualRecipes();
        }}
      />
    </Box>
  );
}
