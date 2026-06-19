import { Box, Button, Typography } from '@mui/material';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import { colors, gradients, shadows } from '@/core/theme/tokens';

interface ProfileHeaderProps {
  username: string;
  email: string;
  onEdit?: () => void;
}

export function ProfileHeader({ username, email, onEdit }: ProfileHeaderProps) {
  const initial = (username || email || '?').trim().charAt(0).toUpperCase() || '🙂';

  return (
    <Box
      sx={{
        position: 'relative',
        background: gradients.greenPanel,
        borderRadius: '1.625rem',
        p: { xs: '1.5rem', md: '2rem' },
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: { xs: '1.125rem', md: '1.625rem' },
        flexWrap: { xs: 'wrap', sm: 'nowrap' },
        overflow: 'hidden',
        boxShadow: shadows.hero,
        animation: 'pp-slideUp .5s both',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -70,
          right: -50,
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(143,214,148,.25),transparent 70%)',
          animation: 'pp-breathe 7s ease-in-out infinite',
        }}
      />
      <Box
        sx={{
          width: 88,
          height: 88,
          borderRadius: '1.5rem',
          background: 'rgba(255,255,255,.16)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 40,
          fontWeight: 700,
          flex: 'none',
          boxShadow: 'inset 0 0 0 0.125rem rgba(255,255,255,.2)',
        }}
      >
        {initial}
      </Box>
      <Box sx={{ flex: 1, position: 'relative', minWidth: 0 }}>
        <Typography
          sx={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 700,
            fontSize: { xs: 24, md: 30 },
            lineHeight: 1.05,
          }}
        >
          {username || 'Your account'}
        </Typography>
        <Typography sx={{ fontSize: 14, color: 'rgba(255,255,255,.75)', mt: '0.3125rem' }} noWrap>
          {email}
        </Typography>
        <Box sx={{ display: 'flex', gap: '0.625rem', mt: '0.875rem', flexWrap: 'wrap' }}>
          <Box
            component="span"
            sx={{
              fontSize: 12,
              fontWeight: 700,
              color: colors.greenDeepest,
              bgcolor: colors.mintSoft,
              px: '0.8125rem',
              py: '0.25rem',
              borderRadius: '0.5625rem',
            }}
          >
            ✨ Premium
          </Box>
          <Box
            component="span"
            sx={{
              fontSize: 12,
              color: 'rgba(255,255,255,.8)',
              bgcolor: 'rgba(255,255,255,.12)',
              px: '0.8125rem',
              py: '0.25rem',
              borderRadius: '0.5625rem',
            }}
          >
            Member since 2025
          </Box>
        </Box>
      </Box>
      <Button
        onClick={onEdit}
        startIcon={<EditRoundedIcon />}
        sx={{
          position: 'relative',
          flex: 'none',
          color: '#fff',
          background: 'rgba(255,255,255,.14)',
          border: '1px solid rgba(255,255,255,.18)',
          borderRadius: '0.875rem',
          px: '1.25rem',
          py: '0.6875rem',
          '&:hover': { background: 'rgba(255,255,255,.24)' },
        }}
      >
        Edit profile
      </Button>
    </Box>
  );
}
