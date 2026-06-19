import { Box, Typography } from '@mui/material';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import { useNavigate } from 'react-router-dom';
import type { GroceryListStatus } from '@/features/home/types/home';
import { colors, gradients, shadows } from '@/core/theme/tokens';

interface GroceryListCardProps {
  groceryStatus: GroceryListStatus;
}

export const GroceryListCard = ({ groceryStatus }: GroceryListCardProps) => {
  const navigate = useNavigate();
  const { checkedItems, totalItems } = groceryStatus;
  const toBuy = totalItems - checkedItems;
  const pct = totalItems === 0 ? 0 : Math.round((checkedItems / totalItems) * 100);

  return (
    <Box
      onClick={() => navigate('/cart')}
      sx={{
        bgcolor: '#fff',
        borderRadius: '1.5rem',
        p: '1.375rem',
        cursor: 'pointer',
        boxShadow: shadows.card,
        border: `1px solid ${colors.cardBorder}`,
        animation: 'pp-slideUp .5s .06s both',
        transition: 'transform .2s',
        '&:hover': { transform: 'translateY(-0.1875rem)' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Box
          sx={{
            width: 46,
            height: 46,
            borderRadius: '0.875rem',
            bgcolor: colors.orangeTint,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors.orange,
          }}
        >
          <ShoppingCartRoundedIcon />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: colors.ink }}>
            Grocery list
          </Typography>
          <Typography sx={{ fontSize: 12, color: colors.textMuted }}>
            {toBuy} item{toBuy === 1 ? '' : 's'} left to buy
          </Typography>
        </Box>
        <Box
          sx={{
            fontSize: 13,
            fontWeight: 700,
            color: '#fff',
            background: `linear-gradient(135deg,${colors.orange},${colors.orangeBurnt})`,
            px: '0.9375rem',
            py: '0.5rem',
            borderRadius: '0.8125rem',
            boxShadow: shadows.orange,
          }}
        >
          Open
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mt: '1.125rem' }}>
        <Typography sx={{ fontSize: 13, color: colors.textMuted }}>Shopping progress</Typography>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: colors.ink }}>
          {checkedItems}/{totalItems}
        </Typography>
      </Box>
      <Box sx={{ height: 8, borderRadius: '0.3125rem', bgcolor: '#eef0ea', mt: '0.5625rem', overflow: 'hidden' }}>
        <Box
          sx={{
            height: '100%',
            borderRadius: '0.3125rem',
            background: gradients.progress,
            width: `${pct}%`,
            transition: 'width 1s cubic-bezier(.34,1.1,.4,1)',
          }}
        />
      </Box>
    </Box>
  );
};
