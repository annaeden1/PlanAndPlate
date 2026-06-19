import { Box, Typography } from '@mui/material';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import { useCurrentUser } from '@/context/UserContext';
import { colors, gradients } from '@/core/theme/tokens';

interface SidebarProfileProps {
  onClick: () => void;
}

export const SidebarProfile = ({ onClick }: SidebarProfileProps) => {
  const user = useCurrentUser();

  return (
    <Box
      onClick={onClick}
      sx={{
        mt: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: '0.6875rem',
        p: '0.75rem',
        borderRadius: '1rem',
        background: 'rgba(255,255,255,.07)',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background .2s',
        '&:hover': { background: 'rgba(255,255,255,.13)' },
      }}
    >
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: '0.6875rem',
          background: gradients.ctaSoft,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          fontWeight: 700,
          color: '#fff',
          flex: 'none',
        }}
      >
        {user.initial}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography noWrap sx={{ fontSize: 13.5, fontWeight: 700, color: '#fff' }}>
          {user.name || 'Your account'}
        </Typography>
        <Typography sx={{ fontSize: 11, color: colors.mintSoft }}>Premium plan</Typography>
      </Box>
      <SettingsRoundedIcon sx={{ fontSize: 18, color: 'rgba(255,255,255,.5)' }} />
    </Box>
  );
};
