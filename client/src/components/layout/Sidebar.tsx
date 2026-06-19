import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { SidebarLogo } from './sidebar/SidebarLogo';
import { SidebarNav } from './sidebar/SidebarNav';
import { SidebarProfile } from './sidebar/SidebarProfile';
import { gradients } from '@/core/theme/tokens';

export const SIDEBAR_WIDTH = 250;

interface SidebarProps {

  onNavigate?: () => void;
}

export const Sidebar = ({ onNavigate }: SidebarProps) => {
  const navigate = useNavigate();

  const go = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  return (
    <Box
      sx={{
        width: SIDEBAR_WIDTH,
        flex: 'none',
        background: gradients.sidebar,
        display: 'flex',
        flexDirection: 'column',
        p: '1.625rem 1rem 1.25rem',
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
      }}
    >

      <Box
        sx={{
          position: 'absolute',
          top: -40,
          left: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(63,227,155,.16), transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <SidebarLogo onClick={() => go('/')} />
      <SidebarNav onGo={go} />
      <SidebarProfile onClick={() => go('/profile')} />
    </Box>
  );
};
