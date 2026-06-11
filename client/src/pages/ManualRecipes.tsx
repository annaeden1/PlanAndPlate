import { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { PageHeader } from '@/components/common/PageHeader';

export function ManualRecipes() {
  const [isAddRecipeModalOpen, setIsAddRecipeModalOpen] = useState(false);

  const handleOpenAddRecipeModal = () => {
    setIsAddRecipeModalOpen(true);
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
        <Typography variant="body1" color="text.secondary">
          Use the button above to add a new recipe.
        </Typography>
        {isAddRecipeModalOpen && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            add modal here
          </Typography>
        )}
      </Box>
    </Box>
  );
}
