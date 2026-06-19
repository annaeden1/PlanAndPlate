import { Box, Typography } from '@mui/material';

export interface MacroStat {
  label: string;
  val: number;
  pct: number;
  color: string;
}

export const MacroStatChip = ({ label, val, pct, color }: MacroStat) => (
  <Box sx={{ width: 118, background: 'rgba(255,255,255,.1)', borderRadius: '0.875rem', p: '0.6875rem 0.8125rem' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,.75)', fontWeight: 600 }}>{label}</Typography>
      <Box sx={{ textAlign: 'right' }}>
        <Typography sx={{ fontSize: 12, color: '#fff', fontWeight: 700, lineHeight: 1 }}>{val}g</Typography>
        <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,.55)', lineHeight: 1.4 }}>{pct}% kcal</Typography>
      </Box>
    </Box>
    <Box sx={{ height: 5, borderRadius: '0.1875rem', background: 'rgba(255,255,255,.18)', mt: '0.5rem', overflow: 'hidden' }}>
      <Box
        sx={{
          height: '100%',
          borderRadius: '0.1875rem',
          background: color,
          width: `${pct}%`,
          transition: 'width 1s cubic-bezier(.34,1.1,.4,1)',
        }}
      />
    </Box>
  </Box>
);
