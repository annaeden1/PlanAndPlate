// client/src/features/mealPlanner/components/AddToPlanDialog.tsx
import {
  Dialog, DialogTitle, DialogContent, Table, TableBody, TableCell,
  TableHead, TableRow, Button, CircularProgress, Typography, Box,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { mealPlannerApi } from '@/features/mealPlanner/api/mealPlanner';
import type { ApiMealPlan } from '@/features/mealPlanner/types/mealPlanner';
import { getUserId } from '@/shared/utils/userId';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'] as const;
type MealType = (typeof MEAL_TYPES)[number];

interface AddToPlanDialogProps {
  open: boolean;
  recipeName: string;
  onClose: () => void;
  onSelect: (date: string, mealType: MealType) => void;
}

function shortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function AddToPlanDialog({ open, recipeName, onClose, onSelect }: AddToPlanDialogProps) {
  const [plan, setPlan] = useState<ApiMealPlan | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const token = localStorage.getItem('access-token');
    const userId = getUserId() ?? '';
    const today = new Date().toISOString().split('T')[0];
    mealPlannerApi.getWeeklyPlan(userId, today, token)
      .then(setPlan)
      .catch(() => setPlan(null))
      .finally(() => setLoading(false));
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Add "{recipeName}" to plan</DialogTitle>
      <DialogContent>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: '2rem' }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && !plan && (
          <Typography color="text.secondary">No meal plan found for this week.</Typography>
        )}

        {!loading && plan && (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Day</TableCell>
                {MEAL_TYPES.map((m) => (
                  <TableCell key={m} align="center" sx={{ textTransform: 'capitalize' }}>
                    {m}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {plan.days.map((day) => (
                <TableRow key={day.date}>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{shortDate(day.date)}</TableCell>
                  {MEAL_TYPES.map((mealType) => {
                    const slot = day[mealType];
                    return (
                      <TableCell key={mealType} align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => onSelect(day.date, mealType)}
                          sx={{ fontSize: '0.7rem', lineHeight: 1.2, px: 1 }}
                        >
                          {slot?.name
                            ? slot.name.length > 18
                              ? slot.name.slice(0, 18) + '…'
                              : slot.name
                            : 'Empty'}
                        </Button>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
