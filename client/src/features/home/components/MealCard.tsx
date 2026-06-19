import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import type { Meal } from '@/features/home/types/home';
import { colors, foodGradientFor } from '@/core/theme/tokens';

interface MealCardProps {
  meal: Meal;
  onToggle: () => void;
  delay?: string;
}

const MEAL_EMOJI: Record<Meal['mealType'], string> = {
  Breakfast: '🥑',
  Lunch: '🥗',
  Dinner: '🍣',
};

export const MealCard = ({ meal, onToggle, delay = '0s' }: MealCardProps) => {
  const [imgOk, setImgOk] = useState(Boolean(meal.image));
  const done = meal.completed;

  return (
    <Box
      onClick={onToggle}
      role="button"
      aria-pressed={done}
      sx={{
        flex: 1,
        minWidth: 0,
        bgcolor: '#fff',
        borderRadius: '1.25rem',
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: '0 0.5rem 1.375rem -1rem rgba(20,40,30,.45)',
        border: `1px solid ${colors.cardBorder}`,
        transition: 'transform .18s, box-shadow .25s',
        animation: 'pp-slideUp .5s both',
        animationDelay: delay,
        '&:hover': {
          transform: 'translateY(-0.25rem)',
          boxShadow: '0 1.25rem 2rem -1.125rem rgba(20,40,30,.4)',
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          height: 84,
          background: foodGradientFor(meal.name),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 40,
        }}
      >
        {imgOk ? (
          <Box
            component="img"
            src={meal.image}
            alt={meal.name}
            onError={() => setImgOk(false)}
            sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          MEAL_EMOJI[meal.mealType] ?? '🍽️'
        )}
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: done ? 'linear-gradient(135deg,#2fbf87,#15674c)' : 'rgba(255,255,255,.9)',
            border: `2px solid ${done ? 'transparent' : '#fff'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all .2s',
            boxShadow: '0 0.25rem 0.625rem -0.25rem rgba(20,40,30,.5)',
          }}
        >
          {done && (
            <Box
              component="svg"
              width={14}
              height={14}
              viewBox="0 0 24 24"
              fill="none"
              sx={{ animation: 'pp-checkpop .35s both' }}
            >
              <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
            </Box>
          )}
        </Box>
      </Box>
      <Box sx={{ p: '0.8125rem 0.9375rem' }}>
        <Box
          component="span"
          sx={{
            fontSize: 11,
            fontWeight: 700,
            color: colors.greenLeaf,
            bgcolor: colors.mintTint,
            px: '0.5625rem',
            py: '0.125rem',
            borderRadius: '0.5rem',
          }}
        >
          {meal.mealType}
        </Box>
        <Typography
          noWrap
          sx={{
            fontSize: 14.5,
            fontWeight: 700,
            color: colors.ink,
            mt: '0.5625rem',
            textDecoration: done ? 'line-through' : 'none',
            opacity: done ? 0.5 : 1,
          }}
        >
          {meal.name}
        </Typography>
        <Typography sx={{ fontSize: 12, color: colors.textMuted, mt: '0.25rem' }}>
          {meal.time} · {Math.round(meal.calories)} kcal
        </Typography>
      </Box>
    </Box>
  );
};
