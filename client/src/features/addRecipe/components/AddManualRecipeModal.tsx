import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Autocomplete,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { UNIT_OPTIONS } from '@/features/groceryList/utils/unitOptions';
import { CATEGORY_EMOJIS } from '@/features/groceryList/utils/categoryEmojis';
import { mealPlannerApi } from '@/features/mealPlanner/api/mealPlanner';
import { fileApi } from '@/features/addRecipe/api/file';

const INITIAL_RECIPE_FORM = {
  name: '',
  image: '',
  servings: '',
  readyInMinutes: '',
  instructions: '',
  ingredients: [{ name: '', amount: '', unit: '', aisle: '' }],
};

const CATEGORY_OPTIONS = Object.keys(CATEGORY_EMOJIS) as string[];

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: () => Promise<void> | void;
}

export default function AddManualRecipeModal({
  open,
  onClose,
  onSaved,
}: Props) {
  const [recipeForm, setRecipeForm] = useState(INITIAL_RECIPE_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const handleIngredientChange = (
    index: number,
    field: 'name' | 'amount' | 'unit' | 'aisle',
    value: string,
  ) => {
    setRecipeForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((ingredient, ingredientIndex) =>
        ingredientIndex === index
          ? { ...ingredient, [field]: value }
          : ingredient,
      ),
    }));
  };

  const handleAddIngredient = () => {
    setRecipeForm((prev) => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        { name: '', amount: '', unit: '', aisle: '' },
      ],
    }));
  };

  const handleRemoveIngredient = (index: number) => {
    setRecipeForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    e.target.value = '';
  };

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl('');
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile]);

  const handleChange = (
    field: keyof typeof INITIAL_RECIPE_FORM,
    value: string,
  ) => {
    setRecipeForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitRecipe = async () => {
    if (!recipeForm.name.trim()) {
      setFormError('Recipe name is required.');
      return;
    }

    setFormError(null);
    setSubmitting(true);

    const servingsNum = recipeForm.servings
      ? Number(recipeForm.servings)
      : undefined;
    if (
      servingsNum !== undefined &&
      (!Number.isFinite(servingsNum) || servingsNum < 0)
    ) {
      setFormError('Servings must be a non-negative number.');
      setSubmitting(false);
      return;
    }

    const readyNum = recipeForm.readyInMinutes
      ? Number(recipeForm.readyInMinutes)
      : undefined;
    if (
      readyNum !== undefined &&
      (!Number.isFinite(readyNum) || readyNum < 0)
    ) {
      setFormError('Ready in minutes must be a non-negative number.');
      setSubmitting(false);
      return;
    }

    const invalidIngredientAmount = recipeForm.ingredients.some((ing) => {
      if (!ing.name || !ing.name.trim()) return false;
      const amt = Number(ing.amount);
      return !Number.isFinite(amt) || amt < 0;
    });
    if (invalidIngredientAmount) {
      setFormError('All ingredient amounts must be non-negative numbers.');
      setSubmitting(false);
      return;
    }

    try {
      let uploadedImageUrl: string | undefined;

      if (imageFile) {
        const uploadResponse = await fileApi.uploadImage(imageFile);
        uploadedImageUrl = uploadResponse.url;
      }

      await mealPlannerApi.createManualRecipe({
        name: recipeForm.name.trim(),
        image: uploadedImageUrl,
        servings: recipeForm.servings ? Number(recipeForm.servings) : undefined,
        readyInMinutes: recipeForm.readyInMinutes
          ? Number(recipeForm.readyInMinutes)
          : undefined,
        instructions: recipeForm.instructions
          ? {
            steps: [recipeForm.instructions.trim()],
            ingredients: recipeForm.ingredients
              .filter((ingredient) => ingredient.name.trim())
              .map((ingredient) => ({
                name: ingredient.name.trim(),
                amount: Number(ingredient.amount) || 0,
                unit: ingredient.unit.trim() || undefined,
                aisle: ingredient.aisle ? ingredient.aisle.trim() : undefined,
              })),
          }
          : undefined,
      });

      if (onSaved) await onSaved();
      handleClose();
    } catch (error) {
      console.error('Failed to save manual recipe:', error);
      setFormError('Failed to save recipe. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setRecipeForm(INITIAL_RECIPE_FORM);
    setImageFile(null);
    setImagePreviewUrl('');
    setFormError(null);
    setSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Add Manual Recipe</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {formError && (
            <Typography color="error" variant="body2">
              {formError}
            </Typography>
          )}
          <TextField
            label="Recipe name"
            value={recipeForm.name}
            onChange={(e) => handleChange('name', e.target.value)}
            fullWidth
            autoFocus
          />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button variant="outlined" component="label" fullWidth>
              Upload Recipe Image
              <input
                hidden
                accept="image/*"
                type="file"
                onChange={handleImageChange}
              />
            </Button>
            {imagePreviewUrl && (
              <Box sx={{ position: 'relative' }}>
                <Box
                  component="img"
                  src={imagePreviewUrl}
                  alt="Recipe preview"
                  sx={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                />
                <Button
                  size="small"
                  color="error"
                  onClick={() => setImageFile(null)}
                  sx={{ mt: 1 }}
                >
                  Remove Image
                </Button>
              </Box>
            )}
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 16,
            }}
          >
            <TextField
              label="Servings"
              type="number"
              value={recipeForm.servings}
              onChange={(e) => handleChange('servings', e.target.value)}
              inputProps={{ min: 0, step: '1' }}
              fullWidth
            />
            <TextField
              label="Ready in minutes"
              type="number"
              value={recipeForm.readyInMinutes}
              onChange={(e) => handleChange('readyInMinutes', e.target.value)}
              inputProps={{ min: 0, step: '1' }}
              fullWidth
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Ingredients
            </Typography>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddIngredient}
            >
              Add ingredient
            </Button>
          </Box>

          {recipeForm.ingredients.map((ingredient, index) => (
            <Box
              key={`ingredient-${index}`}
              sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1 }}
            >
              <TextField
                label="Name"
                value={ingredient.name}
                onChange={(e) =>
                  handleIngredientChange(index, 'name', e.target.value)
                }
                fullWidth
                size="medium"
              />

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr auto',
                    sm: '0.75fr 0.45fr 0.6fr auto',
                  },
                  gap: 1,
                  alignItems: 'center',
                }}
              >
                <TextField
                  label="Amount"
                  type="number"
                  value={ingredient.amount}
                  onChange={(e) =>
                    handleIngredientChange(index, 'amount', e.target.value)
                  }
                  fullWidth
                  size="medium"
                  inputProps={{ min: 0.01, step: 'any' }}
                  sx={{ '& .MuiInputBase-root': { minHeight: 40 } }}
                />

                <Autocomplete
                  options={UNIT_OPTIONS}
                  getOptionLabel={(o) => (typeof o === 'string' ? o : o.unit)}
                  value={
                    UNIT_OPTIONS.find((o) => o.unit === ingredient.unit) ?? null
                  }
                  onChange={(_, val) =>
                    handleIngredientChange(
                      index,
                      'unit',
                      typeof val === 'string' ? val : (val?.unit ?? ''),
                    )
                  }
                  freeSolo
                  onInputChange={(_, val) =>
                    handleIngredientChange(index, 'unit', val)
                  }
                  disablePortal={false}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Unit"
                      size="medium"
                      sx={{ '& .MuiInputBase-root': { minHeight: 40 } }}
                    />
                  )}
                />

                <TextField
                  select
                  label="Aisle (optional)"
                  value={ingredient.aisle ?? ''}
                  onChange={(e) =>
                    handleIngredientChange(index, 'aisle', e.target.value)
                  }
                  size="medium"
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="">— None —</MenuItem>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {CATEGORY_EMOJIS[cat as keyof typeof CATEGORY_EMOJIS]}{' '}
                      {cat}
                    </MenuItem>
                  ))}
                </TextField>

                <IconButton
                  aria-label="Remove ingredient"
                  onClick={() => handleRemoveIngredient(index)}
                  sx={{ mt: { xs: 0.5, sm: 0 } }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>
          ))}

          <TextField
            label="Instructions"
            value={recipeForm.instructions}
            onChange={(e) => handleChange('instructions', e.target.value)}
            fullWidth
            multiline
            minRows={4}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmitRecipe}
          disabled={submitting}
        >
          {submitting ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            'Save Recipe'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
