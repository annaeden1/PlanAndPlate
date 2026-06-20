import { Box, Typography } from '@mui/material';
import type { CalorieProgress } from '@/features/home/types/home';
import { MacroStatChip, type MacroStat } from '@/features/home/components/MacroStatChip';
import { CalorieRing } from '@/features/home/components/CalorieRing';
import { useCountUp } from '@/shared/hooks/useCountUp';
import { gradients, shadows } from '@/core/theme/tokens';

export type { MacroStat } from '@/features/home/components/MacroStatChip';

interface CalorieHeroProps {
  calorieProgress: CalorieProgress;
  macros?: MacroStat[];
}

const FALLBACK_MACROS: MacroStat[] = [
  { label: 'Protein', val: 0, pct: 0, color: gradients.protein },
  { label: 'Carbs', val: 0, pct: 0, color: gradients.carbs },
  { label: 'Fat', val: 0, pct: 0, color: gradients.fat },
];

export const CalorieHero = ({ calorieProgress, macros }: CalorieHeroProps) => {
  const MACROS = macros && macros.length ? macros : FALLBACK_MACROS;
  const { consumed, target } = calorieProgress;
  const display = useCountUp(consumed);
  const ratio = target > 0 ? Math.min(1, display / target) : 0;
  const pct = target > 0 ? Math.round((display / target) * 100) : 0;
  const left = Math.max(0, target - display);

  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: '1.625rem',
        p: { xs: '1.5rem', md: '1.75rem 1.875rem' },
        background: gradients.hero,
        overflow: 'hidden',
        boxShadow: shadows.hero,
        animation: 'pp-slideUp .5s both',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -70,
          right: -40,
          width: 230,
          height: 230,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(143,214,148,.32), transparent 70%)',
          animation: 'pp-breathe 6s ease-in-out infinite',
        }}
      />
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.25rem',
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 600,
              color: 'rgba(255,255,255,.7)',
              letterSpacing: '.05em',
              textTransform: 'uppercase',
            }}
          >
            Calories left today
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem', mt: '0.5rem' }}>
            <Typography
              sx={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontWeight: 700,
                fontSize: { xs: 46, md: 58 },
                color: '#fff',
                lineHeight: 1,
              }}
            >
              {left.toLocaleString()}
            </Typography>
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,.65)' }}>kcal</Typography>
          </Box>
          <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,.6)', mt: '0.375rem' }}>
            {display.toLocaleString()} eaten of {target.toLocaleString()} goal
          </Typography>

          <Box sx={{ display: 'flex', gap: '0.75rem', mt: '1.375rem', flexWrap: 'wrap' }}>
            {MACROS.map((m) => (
              <MacroStatChip key={m.label} {...m} />
            ))}
          </Box>
        </Box>

        <CalorieRing ratio={ratio} pct={pct} />
      </Box>
    </Box>
  );
};
