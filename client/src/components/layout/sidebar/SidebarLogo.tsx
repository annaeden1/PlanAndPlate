import { Box, Typography } from '@mui/material';
import { colors, gradients, shadows } from '@/core/theme/tokens';

interface SidebarLogoProps {
  onClick: () => void;
}

export const SidebarLogo = ({ onClick }: SidebarLogoProps) => (
  <Box
    onClick={onClick}
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.6875rem',
      px: '0.625rem',
      mb: '2.125rem',
      position: 'relative',
      cursor: 'pointer',
    }}
  >
    <Box
      sx={{
        width: 40,
        height: 40,
        borderRadius: '0.8125rem',
        background: gradients.ctaSoft,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 21,
        boxShadow: shadows.sidebarLogo,
      }}
    >
      🍃
    </Box>
    <Typography
      sx={{
        fontFamily: "'Bricolage Grotesque', sans-serif",
        fontWeight: 700,
        fontSize: 18,
        color: '#fff',
        lineHeight: 1,
      }}
    >
      Plan
      <Box component="span" sx={{ color: colors.mintSoft }}>
        &
      </Box>
      Plate
    </Typography>
  </Box>
);
