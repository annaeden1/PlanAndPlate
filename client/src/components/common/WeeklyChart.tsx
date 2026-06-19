import { Box, Typography } from '@mui/material';
import { colors } from '@/core/theme/tokens';

export interface WeeklyBar {
  label: string;

  value: number;

  calLabel?: string;
}

interface WeeklyChartProps {
  title: string;
  bars: WeeklyBar[];
  activeIndex?: number;
  avgLabel?: string;
  height?: number;
}

export const WeeklyChart = ({
  title,
  bars,
  activeIndex = -1,
  avgLabel,
  height = 108,
}: WeeklyChartProps) => {
  return (
    <Box
      sx={{
        bgcolor: '#fff',
        borderRadius: '1.5rem',
        p: '1.375rem',
        boxShadow: '0 0.5rem 1.5rem -1rem rgba(20,40,30,.4)',
        border: `1px solid ${colors.cardBorder}`,
        animation: 'pp-slideUp .5s .12s both',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: colors.ink }}>{title}</Typography>
        {avgLabel && (
          <Typography sx={{ fontSize: 12, color: colors.textMuted }}>
            avg <Box component="span" sx={{ color: colors.green, fontWeight: 700 }}>{avgLabel}</Box> kcal
          </Typography>
        )}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '0.625rem', height, mt: '1.125rem' }}>
        {bars.map((b, i) => {
          const active = i === activeIndex;
          return (
            <Box
              key={`${b.label}-${i}`}
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                height: '100%',
                justifyContent: 'flex-end',
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  height: `${Math.max(6, Math.round(b.value * 100))}%`,
                  borderRadius: '0.4375rem',
                  background: active ? 'linear-gradient(to top,#15674c,#3fe39b)' : '#d7e6dd',
                  transformOrigin: 'bottom',
                  animation: 'pp-rise .6s both',
                  animationDelay: `${i * 0.05}s`,
                  position: 'relative',
                  transform: active ? 'scaleY(1.12) scaleX(1.08)' : 'scaleY(1)',
                  transition: 'transform .25s cubic-bezier(.34,1.3,.4,1)',
                  boxShadow: active ? '0 0.25rem 0.875rem -0.25rem rgba(21,103,76,.55)' : 'none',
                }}
              >
                {b.calLabel && (
                  <Typography
                    sx={{
                      position: 'absolute',
                      top: '-1rem',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: 9,
                      fontWeight: 700,
                      color: active ? colors.green : colors.textMuted,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {b.calLabel}
                  </Typography>
                )}
              </Box>
              <Typography
                sx={{ fontSize: 11, fontWeight: 600, color: active ? colors.green : colors.textGhost }}
              >
                {b.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
