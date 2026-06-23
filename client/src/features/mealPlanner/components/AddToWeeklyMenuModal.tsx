import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';
import type { ApiRecipe } from '../types/mealPlanner';

interface AddToWeeklyMenuModalProps {
  open: boolean;
  onClose: () => void;
  recipe: ApiRecipe | null;
  onConfirm: (date: string, mealType: 'breakfast' | 'lunch' | 'dinner') => void;
}

const getTodayDateString = () => {
  const date = new Date();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

export function AddToWeeklyMenuModal({
  open,
  onClose,
  recipe,
  onConfirm,
}: AddToWeeklyMenuModalProps) {
  const [date, setDate] = useState(getTodayDateString());
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner'>(
    'breakfast',
  );

  useEffect(() => {
    if (open) {
      setDate(getTodayDateString());
      setMealType('breakfast');
    }
  }, [open]);

  const handleSubmit = () => {
    if (!recipe) return;
    onConfirm(date, mealType);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pb: 1 }}>Add to Weekly Menu</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {recipe && (
            <Typography variant="body2" color="text.secondary">
              Schedule <strong>{recipe.name}</strong> for a meal in your plan.
            </Typography>
          )}

          <TextField
            label="Meal Date"
            type="date"
            fullWidth
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            select
            label="Meal Type"
            fullWidth
            value={mealType}
            onChange={(e) =>
              setMealType(e.target.value as 'breakfast' | 'lunch' | 'dinner')
            }
          >
            <MenuItem value="breakfast">Breakfast</MenuItem>
            <MenuItem value="lunch">Lunch</MenuItem>
            <MenuItem value="dinner">Dinner</MenuItem>
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!recipe}>
          Add to Menu
        </Button>
      </DialogActions>
    </Dialog>
  );
}
