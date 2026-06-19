import { Box, Typography } from '@mui/material';
import { gradients, shadows } from '@/core/theme/tokens';

interface ShoppingProgressCardProps {
  inStockItems: number;
  totalItems: number;
  itemsToBuy: number;
  percentage: number;
}

export const ShoppingProgressCard = ({
  inStockItems,
  totalItems,
  itemsToBuy,
  percentage,
}: ShoppingProgressCardProps) => (
  <Box
    sx={{
      background: gradients.greenPanel,
      borderRadius: '1.5rem',
      p: '1.5rem',
      color: '#fff',
      boxShadow: shadows.hero,
      animation: 'pp-slideUp .5s both',
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
      <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,.78)', fontWeight: 600 }}>
        Shopping progress
      </Typography>
      <Typography sx={{ fontSize: 15, fontWeight: 700 }}>
        {inStockItems} / {totalItems} items
      </Typography>
    </Box>
    <Box sx={{ height: 11, borderRadius: '0.375rem', background: 'rgba(255,255,255,.18)', mt: '1rem', overflow: 'hidden' }}>
      <Box
        sx={{
          height: '100%',
          borderRadius: '0.375rem',
          background: gradients.progressLight,
          width: `${percentage}%`,
          transition: 'width .8s cubic-bezier(.34,1.1,.4,1)',
        }}
      />
    </Box>
    <Typography sx={{ fontSize: 12.5, color: 'rgba(255,255,255,.65)', mt: '0.75rem' }}>
      {itemsToBuy} item{itemsToBuy === 1 ? '' : 's'} still to pick up
    </Typography>
  </Box>
);
