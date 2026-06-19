import { Box, IconButton, Typography } from '@mui/material';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { colors, gradients } from '@/core/theme/tokens';

interface WeeklyTimelineProps {
  currentWeek: number;
  onWeekChange: (week: number) => void;
  selectedDay: string;
  onDaySelect: (day: string) => void;
  days: string[];
  weekRange: string;
}

export function WeeklyTimeline({
  currentWeek,
  onWeekChange,
  selectedDay,
  onDaySelect,
  days,
  weekRange,
}: WeeklyTimelineProps) {
  const today = new Date();

  const ref = new Date();
  ref.setDate(today.getDate() + currentWeek * 7);
  const sunday = new Date(ref);
  sunday.setDate(ref.getDate() - ref.getDay());

  const weekDates = days.map((_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });

  const isToday = (d: Date) => d.toDateString() === today.toDateString();

  return (
    <Box sx={{ animation: 'pp-slideUp .5s both' }}>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.875rem',
          mb: '0.875rem',
        }}
      >
        <IconButton
          onClick={() => onWeekChange(currentWeek - 1)}
          aria-label="Previous week"
          sx={{ bgcolor: '#fff', border: `1px solid ${colors.cardBorder}`, '&:hover': { bgcolor: colors.mintTint } }}
        >
          <ChevronLeftRoundedIcon />
        </IconButton>
        <Box sx={{ textAlign: 'center', minWidth: 160 }}>
          <Typography sx={{ fontSize: 11, color: colors.textMuted, fontWeight: 600 }}>
            Week of
          </Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: colors.ink }}>
            {weekRange}
          </Typography>
        </Box>
        <IconButton
          onClick={() => onWeekChange(currentWeek + 1)}
          aria-label="Next week"
          sx={{ bgcolor: '#fff', border: `1px solid ${colors.cardBorder}`, '&:hover': { bgcolor: colors.mintTint } }}
        >
          <ChevronRightRoundedIcon />
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', gap: '0.625rem', overflowX: 'auto' }} className="pp-scroll">
        {days.map((day, i) => {
          const active = selectedDay === day;
          const date = weekDates[i];
          const past = currentWeek === 0 && date < today && !isToday(date);
          return (
            <Box
              key={day}
              onClick={() => onDaySelect(day)}
              sx={{
                flex: '1 0 auto',
                minWidth: 64,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.4375rem',
                py: '0.875rem',
                borderRadius: '1.125rem',
                cursor: 'pointer',
                background: active ? gradients.cta : '#fff',
                border: `1px solid ${active ? 'transparent' : colors.cardBorder}`,
                boxShadow: active
                  ? '0 0.875rem 1.625rem -0.875rem rgba(21,103,76,.6)'
                  : '0 0.375rem 1.125rem -1rem rgba(20,40,30,.4)',
                transition: 'transform .2s, background .3s',
                '&:hover': { transform: 'translateY(-0.1875rem)' },
              }}
            >
              <Typography
                sx={{ fontSize: 11, fontWeight: 700, color: active ? 'rgba(255,255,255,.75)' : colors.textGhost }}
              >
                {day}
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  fontSize: 20,
                  fontWeight: 700,
                  color: active ? '#fff' : colors.ink,
                }}
              >
                {date.getDate()}
              </Typography>
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: active ? colors.mintPale : past ? colors.greenBright : 'transparent',
                }}
              />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
