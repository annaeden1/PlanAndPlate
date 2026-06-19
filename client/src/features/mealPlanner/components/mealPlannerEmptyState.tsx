import { Box, Button, Typography } from '@mui/material';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import { colors } from '@/core/theme/tokens';

interface EmptyStateProps {
  selectedDay: string;
  onGenerate?: () => void;
  loading?: boolean;
}

export function MealPlannerEmptyState({ selectedDay, onGenerate, loading }: EmptyStateProps) {
  return (
    <Box
      sx={{
        bgcolor: '#fff',
        borderRadius: '1.5rem',
        border: `1px solid ${colors.cardBorder}`,
        boxShadow: '0 0.5rem 1.5rem -1rem rgba(20,40,30,.4)',
        p: '2.5rem',
        textAlign: 'center',
      }}
    >
      <Box sx={{ fontSize: 44 }}>🗓️</Box>
      <Typography variant="h3" sx={{ color: colors.ink, mt: '0.75rem' }}>
        No meals planned
      </Typography>
      <Typography sx={{ color: colors.textMuted, mt: '0.375rem', maxWidth: 360, mx: 'auto' }}>
        Generate a plan to fill {selectedDay} and the rest of your week with balanced meals.
      </Typography>
      {onGenerate && (
        <Button
          variant="contained"
          startIcon={<AutoAwesomeRoundedIcon />}
          onClick={onGenerate}
          disabled={loading}
          sx={{ mt: '1.25rem' }}
        >
          {loading ? 'Generating…' : 'Generate plan'}
        </Button>
      )}
    </Box>
  );
}
