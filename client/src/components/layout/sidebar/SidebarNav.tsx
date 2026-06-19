import { Box, Typography } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '@/config/navigation';
import { useGroceryList } from '@/context/GroceryListContext';
import { colors } from '@/core/theme/tokens';

const ITEM_STRIDE = 56;

interface SidebarNavProps {

  onGo: (path: string) => void;
}

export const SidebarNav = ({ onGo }: SidebarNavProps) => {
  const location = useLocation();
  const { groups } = useGroceryList();

  const mainItems = NAV_ITEMS.filter((i) => i.id !== 'profile');
  const toBuy = groups.reduce((n, g) => n + g.items.filter((it) => !it.checked).length, 0);
  const activeIndex = mainItems.findIndex((i) => i.path === location.pathname);

  return (
    <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: 50,
          borderRadius: '0.875rem',
          background: 'rgba(255,255,255,.13)',
          boxShadow: 'inset 0 0 0 0.0625rem rgba(255,255,255,.08)',
          transform: `translateY(${Math.max(activeIndex, 0) * ITEM_STRIDE}px)`,
          opacity: activeIndex < 0 ? 0 : 1,
          transition: 'transform .42s cubic-bezier(.34,1.4,.4,1), opacity .25s',
          pointerEvents: 'none',
        }}
      />
      {mainItems.map((item) => {
        const Icon = item.icon;
        const active = item.path === location.pathname;
        return (
          <Box
            key={item.id}
            onClick={() => onGo(item.path)}
            sx={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              gap: '0.8125rem',
              height: 50,
              px: '1rem',
              borderRadius: '0.875rem',
              cursor: 'pointer',
            }}
          >
            <Icon
              sx={{
                fontSize: 21,
                width: 24,
                color: active ? '#fff' : 'rgba(255,255,255,.62)',
                transition: 'color .25s',
              }}
            />
            <Typography
              sx={{
                fontSize: 14.5,
                fontWeight: active ? 700 : 600,
                color: active ? '#fff' : 'rgba(255,255,255,.62)',
                transition: 'color .25s',
              }}
            >
              {item.label}
            </Typography>
            {item.id === 'cart' && toBuy > 0 && (
              <Box
                sx={{
                  ml: 'auto',
                  fontSize: 11,
                  fontWeight: 700,
                  color: colors.greenDeepest,
                  bgcolor: colors.mintSoft,
                  px: '0.5rem',
                  py: '0.0625rem',
                  borderRadius: '0.5625rem',
                }}
              >
                {toBuy}
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
};
