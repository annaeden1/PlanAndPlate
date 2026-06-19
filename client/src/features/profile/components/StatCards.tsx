import { Box, Typography } from '@mui/material';
import { colors } from '@/core/theme/tokens';

const STATS = [
  { icon: '🔥', value: '5', label: 'day streak', tint: colors.orangeTintWarm, shadow: 'rgba(255,122,89,.4)' },
  { icon: '📖', value: '12', label: 'recipes saved', tint: colors.mintTint, shadow: 'rgba(47,191,135,.35)' },
  { icon: '🗓️', value: '8', label: 'plans created', tint: '#eef4fb', shadow: 'rgba(100,160,220,.3)' },
];

export function StatCards() {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(3,1fr)' },
        gap: '1.125rem',
      }}
    >
      {STATS.map((s) => (
        <Box
          key={s.label}
          sx={{
            bgcolor: '#fff',
            borderRadius: '1.375rem',
            p: '1.375rem',
            boxShadow: '0 0.5rem 1.375rem -1rem rgba(20,40,30,.35)',
            border: `1px solid ${colors.cardBorder}`,
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: '1rem',
              bgcolor: s.tint,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              flex: 'none',
              boxShadow: `0 8px 16px -10px ${s.shadow}`,
            }}
          >
            {s.icon}
          </Box>
          <Box>
            <Typography
              sx={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontSize: 28,
                fontWeight: 700,
                color: colors.ink,
                lineHeight: 1,
              }}
            >
              {s.value}
            </Typography>
            <Typography sx={{ fontSize: 12, color: colors.textMuted, mt: '0.25rem' }}>
              {s.label}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
