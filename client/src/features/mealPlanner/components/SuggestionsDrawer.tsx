// client/src/features/mealPlanner/components/SuggestionsDrawer.tsx
import {
  Drawer, Box, Typography, Card, CardMedia, CardContent, Button, CircularProgress,
} from '@mui/material';
import type { RecipeSuggestion } from '@/features/mealPlanner/types/mealPlanner';

interface SuggestionsDrawerProps {
  open: boolean;
  loading: boolean;
  suggestions: RecipeSuggestion[];
  onClose: () => void;
  onUse: (s: RecipeSuggestion) => void;
}

export function SuggestionsDrawer({
  open, loading, suggestions, onClose, onUse,
}: SuggestionsDrawerProps) {
  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: { xs: '100vw', sm: 420 }, p: '1.5rem' }}>
        <Typography variant="h6" sx={{ mb: '1rem' }}>
          Suggested for you
        </Typography>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: '2rem' }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && suggestions.length === 0 && (
          <Typography color="text.secondary">
            No matches yet — like a few more recipes and try again.
          </Typography>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {suggestions.map((s) => (
            <Card key={s.originRecipeId} sx={{ display: 'flex' }}>
              {s.image && (
                <CardMedia component="img" image={s.image} sx={{ width: 96 }} />
              )}
              <CardContent sx={{ flex: 1 }}>
                <Typography variant="subtitle1">{s.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(s.calories ?? 0)} kcal
                  {s.readyInMinutes ? ` · ${s.readyInMinutes} min` : ''}
                </Typography>
                {s.why && (
                  <Typography variant="caption" color="primary">{s.why}</Typography>
                )}
                <Button size="small" sx={{ mt: '0.5rem' }} onClick={() => onUse(s)}>
                  Use this
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    </Drawer>
  );
}
