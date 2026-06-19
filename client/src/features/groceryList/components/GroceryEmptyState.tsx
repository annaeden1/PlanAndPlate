import { Typography } from '@mui/material';
import { SurfaceCard } from '@/components/common/SurfaceCard';
import { colors } from '@/core/theme/tokens';

interface GroceryEmptyStateProps {

  searching: boolean;
}

export const GroceryEmptyState = ({ searching }: GroceryEmptyStateProps) => (
  <SurfaceCard padding="2.5rem" shadow={null} sx={{ mt: '1.375rem', textAlign: 'center' }}>
    <Typography sx={{ fontSize: 38 }}>🛒</Typography>
    <Typography sx={{ fontSize: 16, fontWeight: 700, color: colors.ink, mt: '0.5rem' }}>
      {searching ? 'No items found' : 'Your list is empty'}
    </Typography>
    <Typography sx={{ fontSize: 13, color: colors.textMuted, mt: '0.25rem' }}>
      {searching ? 'Try a different search.' : 'Add items or import them from a meal plan.'}
    </Typography>
  </SurfaceCard>
);
