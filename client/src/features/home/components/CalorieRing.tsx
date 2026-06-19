import { Box, Typography } from '@mui/material';
import { colors } from '@/core/theme/tokens';

const RING_R = 72;
const RING_C = 2 * Math.PI * RING_R;

interface CalorieRingProps {

  ratio: number;

  pct: number;
}

export const CalorieRing = ({ ratio, pct }: CalorieRingProps) => (
  <Box sx={{ position: 'relative', width: 168, height: 168, flex: 'none', mx: { xs: 'auto', sm: 0 } }}>
    <Box component="svg" width={168} height={168} viewBox="0 0 168 168" sx={{ transform: 'rotate(-90deg)' }}>
      <circle cx={84} cy={84} r={RING_R} fill="none" stroke="rgba(255,255,255,.13)" strokeWidth={14} />
      <circle
        cx={84}
        cy={84}
        r={RING_R}
        fill="none"
        stroke="url(#ppRing)"
        strokeWidth={14}
        strokeLinecap="round"
        strokeDasharray={RING_C}
        style={{
          strokeDashoffset: RING_C * (1 - ratio),
          transition: 'stroke-dashoffset .35s cubic-bezier(.34,1.2,.4,1)',
        }}
      />
      <defs>
        <linearGradient id="ppRing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={colors.mintPale} />
          <stop offset="100%" stopColor={colors.mint} />
        </linearGradient>
      </defs>
    </Box>
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography sx={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 34, color: '#fff' }}>
        {pct}%
      </Typography>
      <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,.6)', fontWeight: 600 }}>of goal</Typography>
    </Box>
  </Box>
);
