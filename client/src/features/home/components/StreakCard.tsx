import { Box, Typography } from '@mui/material';
import { colors, gradients } from '@/core/theme/tokens';

interface StreakCardProps {

  days?: number;
}

export const StreakCard = ({ days = 5 }: StreakCardProps) => (
  <Box
    sx={{
      background: gradients.streak,
      borderRadius: '1.5rem',
      p: '1.375rem',
      border: '1px solid rgba(255,122,89,.18)',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      animation: 'pp-slideUp .5s .18s both',
    }}
  >
    <Box sx={{ fontSize: 38, animation: 'pp-floaty 3.5s ease-in-out infinite' }}>🔥</Box>
    <Box>
      <Typography
        sx={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontWeight: 700,
          fontSize: 26,
          color: colors.ink,
          lineHeight: 1,
        }}
      >
        {days} days
      </Typography>
      <Typography sx={{ fontSize: 13, color: '#b06a4a', fontWeight: 600, mt: '0.1875rem' }}>
        on-track streak — keep it up!
      </Typography>
    </Box>
  </Box>
);
