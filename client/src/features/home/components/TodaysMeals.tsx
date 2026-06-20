import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { MealCard } from './MealCard';
import type { Meal } from '@/features/home/types/home';
import { colors } from '@/core/theme/tokens';

interface TodaysMealsProps {
  meals: Meal[];
  onToggleMeal: (id: string) => void;
}

export const TodaysMeals = ({ meals, onToggleMeal }: TodaysMealsProps) => {
  const navigate = useNavigate();

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: '0.875rem',
        }}
      >
        <Typography variant="h3" sx={{ color: colors.ink }}>
          Today's meals
        </Typography>
        <Typography
          onClick={() => navigate('/planner')}
          sx={{
            fontSize: 13,
            fontWeight: 600,
            color: colors.greenLeaf,
            cursor: 'pointer',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          Open planner ›
        </Typography>
      </Box>

      {meals.length === 0 ? (
        <Box
          sx={{
            bgcolor: '#fff',
            borderRadius: '20px',
            border: `1px solid ${colors.cardBorder}`,
            p: '28px',
            textAlign: 'center',
          }}
        >
          <Typography sx={{ fontSize: 32 }}>🍽️</Typography>
          <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: colors.ink, mt: '8px' }}>
            No meals planned yet
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: colors.textMuted, mt: '4px' }}>
            Generate a plan to see your day fill up.
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: '14px',
          }}
        >
          {meals.map((meal, i) => (
            <MealCard
              key={meal.id}
              meal={meal}
              onToggle={() => onToggleMeal(meal.id)}
              delay={`${0.12 + i * 0.06}s`}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};
