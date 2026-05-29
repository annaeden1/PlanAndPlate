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
  onAdd: (s: RecipeSuggestion) => void;
}

export function SuggestionsDrawer({
  open, loading, suggestions, onClose, onUse, onAdd,
}: SuggestionsDrawerProps) {
  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: { xs: '100vw', sm: 420 }, p: '1.5rem' }}>
        <Typography variant="h6" sx={{ mt: '3rem' }}>
          New Recipe Suggestions for you
        </Typography>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: '2rem' }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && suggestions.length === 0 && (
          <Typography color="text.secondary">
            No suggestions right now — we couldn't find recipes matching your
            preferences for this meal. Try again later or adjust your dietary
            settings.
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
                <Box sx={{ display: 'flex', gap: '0.25rem', mt: '0.5rem' }}>
                  <Button
                    size="small"
                    variant="text"
                    color="primary"
                    sx={{ px: '0.5rem', minWidth: 0, fontSize: '0.72rem' }}
                    onClick={() => onUse(s)}
                  >
                    Replace
                  </Button>
                  <Button
                    size="small"
                    variant="text"
                    color="inherit"
                    sx={{ px: '0.5rem', minWidth: 0, fontSize: '0.72rem', color: 'text.secondary' }}
                    onClick={() => onAdd(s)}
                  >
                    + Add to plan
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    </Drawer>
  );
}
