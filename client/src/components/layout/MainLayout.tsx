import { useState, type ReactNode } from 'react';
import { Box, Drawer } from '@mui/material';
import { Sidebar, SIDEBAR_WIDTH } from './Sidebar';
import { TopBar } from './TopBar';
import { colors } from '@/core/theme/tokens';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        bgcolor: colors.canvas,
      }}
    >

      <Box sx={{ display: { xs: 'none', md: 'block' }, flex: 'none', height: '100%' }}>
        <Sidebar />
      </Box>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            border: 'none',
            backgroundColor: 'transparent',
          },
        }}
      >
        <Sidebar onNavigate={() => setDrawerOpen(false)} />
      </Drawer>

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: colors.surface,
        }}
      >
        <TopBar onMenuClick={() => setDrawerOpen(true)} />
        <Box
          className="pp-scroll"
          component="main"
          sx={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            px: { xs: '1rem', md: '2.125rem' },
            pt: '0.375rem',
            pb: '2.5rem',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};
