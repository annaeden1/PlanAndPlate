import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Alert, CircularProgress } from '@mui/material';
import { WeeklyTimeline } from '@/features/mealPlanner/components/weeklyTimeLine';
import { PlannedMealCard } from '@/features/mealPlanner/components/mealPlannerCard';
import { MealPlannerEmptyState } from '@/features/mealPlanner/components/mealPlannerEmptyState';
import { WeeklyChart } from '@/components/common/WeeklyChart';
import { AppSnackbar } from '@/components/common/AppSnackbar';
import { DAYS } from '@/features/mealPlanner/types/mealPlanner';
import { useWeeklyMealPlan } from '@/features/mealPlanner/hooks/useWeeklyMealPlan';
import { computeWeekRange, fullDayName } from '@/features/mealPlanner/utils/mealPlannerDates';
import { selectMealsForDay, dateForSelectedDay } from '@/features/mealPlanner/utils/selectMealsForDay';
import { computeWeeklyBalance } from '@/features/mealPlanner/utils/weeklyBalance';
import { colors } from '@/core/theme/tokens';

export function MealPlanner() {
  const todayName = DAYS[new Date().getDay()];
  const [selectedDay, setSelectedDay] = useState(todayName);
  const [currentWeek, setCurrentWeek] = useState(0);

  const navigate = useNavigate();
  const {
    mealPlan,
    loading,
    generating,
    error,
    generatePlan,
    addMealToList,
    snackbar,
    closeSnackbar,
  } = useWeeklyMealPlan(currentWeek, selectedDay);

  const selectedMeals = selectMealsForDay(mealPlan, selectedDay);
  const selectedFullName = fullDayName(selectedDay);
  const weeklyBalance = computeWeeklyBalance(mealPlan);
  const selectedDayIndex = DAYS.indexOf(selectedDay);

  return (
    <Box sx={{ animation: 'pp-slideUp .4s both' }}>
      <WeeklyTimeline
        currentWeek={currentWeek}
        onWeekChange={setCurrentWeek}
        selectedDay={selectedDay}
        onDaySelect={setSelectedDay}
        days={DAYS}
        weekRange={computeWeekRange(currentWeek)}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1.7fr 1fr' },
          gap: '1.375rem',
          mt: '1.5rem',
          alignItems: 'start',
        }}
      >

        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h3" sx={{ color: colors.ink, mb: '0.875rem' }}>
            {selectedFullName}'s plan
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: '3rem' }}>
              <CircularProgress color="primary" />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ borderRadius: '14px' }}>
              {error}
            </Alert>
          ) : selectedMeals.length === 0 ? (
            <MealPlannerEmptyState
              selectedDay={selectedFullName}
              onGenerate={generatePlan}
              loading={generating}
            />
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {selectedMeals.map((meal, i) => (
                <PlannedMealCard
                  key={`${selectedDay}-${meal.type}`}
                  meal={meal}
                  delay={`${0.06 + i * 0.07}s`}
                  onViewRecipe={(m) =>
                    navigate(
                      `/recipe/${m.id}?date=${dateForSelectedDay(mealPlan, selectedDay)}&mealType=${m.type.toLowerCase()}`,
                    )
                  }
                  onAddToList={addMealToList}
                />
              ))}
            </Box>
          )}
        </Box>

        {/* side column */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '22px', minWidth: 0 }}>
          <WeeklyChart
            title="Weekly balance"
            bars={weeklyBalance.bars}
            activeIndex={selectedDayIndex}
            avgLabel={weeklyBalance.avg ? weeklyBalance.avg.toLocaleString() : undefined}
            height={120}
          />
        </Box>
      </Box>

      <AppSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </Box>
  );
}
