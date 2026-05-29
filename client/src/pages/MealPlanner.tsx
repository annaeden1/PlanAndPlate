import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Snackbar, Alert, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { WeeklyTimeline } from '@/features/mealPlanner/components/weeklyTimeLine';
import { PlannedMealCard } from '@/features/mealPlanner/components/mealPlannerCard';
import { MealPlannerEmptyState } from '@/features/mealPlanner/components/mealPlannerEmptyState';
import { SuggestionsDrawer } from '@/features/mealPlanner/components/SuggestionsDrawer';
import { AddToPlanDialog } from '@/features/mealPlanner/components/AddToPlanDialog';
import {
  DAYS,
  type MealPlanItem,
  type RecipeSuggestion,
} from '@/features/mealPlanner/types/mealPlanner';
import type { ApiMealPlan } from '@/features/mealPlanner/types/mealPlanner';
import { mealPlannerApi } from '@/features/mealPlanner/api/mealPlanner';
import { useGroceryList } from '@/context/GroceryListContext';
import { getUserId } from '@/shared/utils/userId';
import { PageHeader } from '@/components/common/PageHeader';
interface MealPlannerProps {}

export function MealPlanner({}: MealPlannerProps) {
  const today = new Date();
  const todayName = DAYS[today.getDay()];

  const [selectedDay, setSelectedDay] = useState(todayName);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [mealPlan, setMealPlan] = useState<ApiMealPlan | null>(null);
  const [cachedWeekKey, setCachedWeekKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const spoonacularImageUrl = (recipeId: string | number, size = '312x231') =>
    `https://spoonacular.com/recipeImages/${recipeId}-${size}.jpg`;
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const navigate = useNavigate();
  const { importRecipe } = useGroceryList();

  // Snack slot suggestions drawer
  const [snackDrawerOpen, setSnackDrawerOpen] = useState(false);
  const [snackSuggestions, setSnackSuggestions] = useState<RecipeSuggestion[]>([]);
  const [snackSuggestionsLoading, setSnackSuggestionsLoading] = useState(false);
  const [snackTarget, setSnackTarget] = useState<{
    snackKey: 'morningSnack' | 'afternoonSnack';
    date: string;
  } | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [pendingAddSuggestion, setPendingAddSuggestion] = useState<RecipeSuggestion | null>(null);

  const formatDayKey = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { weekday: 'short' });

  const handleAddToList = async (meal: MealPlanItem) => {
    try {
      const mealPlanId = mealPlan?._id ?? '';
      const recipeDetails = await mealPlannerApi.getRecipeDetails(
        meal.id.toString(),
        localStorage.getItem('access-token'),
      );
      const recipeIdForImport =
        recipeDetails._id || recipeDetails.originRecipeId || meal.id.toString();

      await importRecipe(recipeIdForImport, mealPlanId);
      setSnackbar({
        open: true,
        message: 'Ingredients added to grocery list successfully!',
        severity: 'success',
      });
    } catch (err) {
      console.error('Error adding to grocery list:', err);
      setSnackbar({
        open: true,
        message: 'Failed to add ingredients to grocery list.',
        severity: 'error',
      });
    }
  };

  const handleOpenSnackDrawer = async (
    snackKey: 'morningSnack' | 'afternoonSnack',
    date: string,
    anchorRecipeId: string,
  ) => {
    setSnackTarget({ snackKey, date });
    setSnackDrawerOpen(true);
    setSnackSuggestionsLoading(true);
    try {
      const token = localStorage.getItem('access-token');
      const userId = getUserId() ?? '';
      const data = await mealPlannerApi.getSuggestions(userId, anchorRecipeId, snackKey, token);
      setSnackSuggestions(data);
    } catch {
      setSnackSuggestions([]);
    } finally {
      setSnackSuggestionsLoading(false);
    }
  };

  const handleUseSnackSuggestion = async (s: RecipeSuggestion) => {
    if (!snackTarget) return;
    const token = localStorage.getItem('access-token');
    const userId = getUserId() ?? '';
    try {
      await mealPlannerApi.replaceMeal(
        userId,
        { date: snackTarget.date, mealType: snackTarget.snackKey, newRecipeId: s.originRecipeId },
        token,
      );
      // Update local plan state so UI reflects change immediately
      setMealPlan((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          days: prev.days.map((d) => {
            if (new Date(d.date).toISOString() !== new Date(snackTarget.date).toISOString()) return d;
            return { ...d, [snackTarget.snackKey]: { recipeId: s.originRecipeId, name: s.name, calories: s.calories ?? 0 } };
          }),
        };
      });
      setSnackDrawerOpen(false);
      setSnackTarget(null);
    } catch {
      setSnackbar({ open: true, message: 'Failed to add snack.', severity: 'error' });
    }
  };

  const handleAddSnackToOtherSlot = (s: RecipeSuggestion) => {
    setPendingAddSuggestion(s);
    setAddDialogOpen(true);
  };

  const handleAddToPlanSelect = async (targetDate: string, targetMealType: string) => {
    if (!pendingAddSuggestion) return;
    setAddDialogOpen(false);
    const token = localStorage.getItem('access-token');
    const userId = getUserId() ?? '';
    try {
      await mealPlannerApi.replaceMeal(
        userId,
        { date: targetDate, mealType: targetMealType, newRecipeId: pendingAddSuggestion.originRecipeId },
        token,
      );
      setCachedWeekKey(null); // invalidate cache so plan re-fetches
      setSnackDrawerOpen(false);
      setSnackbar({ open: true, message: 'Meal added to plan!', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to add meal to plan.', severity: 'error' });
    } finally {
      setPendingAddSuggestion(null);
    }
  };

  const weekRange = (() => {
    const ref = new Date();
    ref.setDate(ref.getDate() + currentWeek * 7);

    const day = ref.getDay();
    const sunday = new Date(ref);
    sunday.setDate(ref.getDate() - day);

    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);

    const format = (d: Date) =>
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return `${format(sunday)} - ${format(saturday)}`;
  })();

  const selectedMeals: MealPlanItem[] = [];
  const selectedDayRecord = mealPlan?.days.find(
    (day) => formatDayKey(day.date) === selectedDay,
  ) ?? null;

  if (selectedDayRecord) {
    const candidates: MealPlanItem[] = [
      {
        id: Number(selectedDayRecord.breakfast.recipeId),
        name: selectedDayRecord.breakfast.name,
        type: 'Breakfast',
        calories: selectedDayRecord.breakfast.calories,
        image: spoonacularImageUrl(selectedDayRecord.breakfast.recipeId),
      },
      ...(selectedDayRecord.morningSnack ? [{
        id: Number(selectedDayRecord.morningSnack.recipeId),
        name: selectedDayRecord.morningSnack.name,
        type: 'Morning Snack',
        calories: selectedDayRecord.morningSnack.calories,
        image: spoonacularImageUrl(selectedDayRecord.morningSnack.recipeId),
      }] : []),
      {
        id: Number(selectedDayRecord.lunch.recipeId),
        name: selectedDayRecord.lunch.name,
        type: 'Lunch',
        calories: selectedDayRecord.lunch.calories,
        image: spoonacularImageUrl(selectedDayRecord.lunch.recipeId),
      },
      ...(selectedDayRecord.afternoonSnack ? [{
        id: Number(selectedDayRecord.afternoonSnack.recipeId),
        name: selectedDayRecord.afternoonSnack.name,
        type: 'Afternoon Snack',
        calories: selectedDayRecord.afternoonSnack.calories,
        image: spoonacularImageUrl(selectedDayRecord.afternoonSnack.recipeId),
      }] : []),
      {
        id: Number(selectedDayRecord.dinner.recipeId),
        name: selectedDayRecord.dinner.name,
        type: 'Dinner',
        calories: selectedDayRecord.dinner.calories,
        image: spoonacularImageUrl(selectedDayRecord.dinner.recipeId),
      },
    ];
    selectedMeals.push(...candidates.filter((m) => m.id && m.name));
  }

  const fetchWeeklyPlan = async () => {
    setLoading(true);
    setError(null);

    try {
      const today = new Date();
      const dayIndex = DAYS.indexOf(selectedDay);
      const selectedDate = new Date(today);
      selectedDate.setDate(
        today.getDate() + currentWeek * 7 + (dayIndex - today.getDay()),
      );
      const weekDate = selectedDate.toISOString().split('T')[0];

      // Cache key is based on currentWeek only - ensures same week doesn't re-fetch
      const weekKey = currentWeek.toString();

      // Check if week is already cached
      if (cachedWeekKey === weekKey && mealPlan) {
        setLoading(false);
        return;
      }

      const userId = getUserId() ?? '';
      const token = localStorage.getItem('access-token');

      try {
        const data = await mealPlannerApi.getWeeklyPlan(
          userId,
          weekDate,
          token,
        );
        setMealPlan(data);
        setCachedWeekKey(weekKey);
      } catch (error: any) {
        if (error.response?.status === 404) {
          console.log('No meal plan found, creating new weekly plan...');
          const data = await mealPlannerApi.createWeeklyPlan(
            userId,
            weekDate,
            token,
          );
          setSnackbar({
            open: true,
            message: 'New weekly meal plan created!',
            severity: 'success',
          });
          setMealPlan(data);
          setCachedWeekKey(weekKey);
        } else {
          throw error;
        }
      }
    } catch (fetchError: any) {
      console.error('Error loading meal plan:', fetchError);
      setError('Accessing meal plan failed. Please try again later.');
      setMealPlan(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyPlan();
  }, [currentWeek]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: '3rem' }}>
      <PageHeader
        title="Weekly Planner"
        subtitle="Your personalized weekly menu"
      />
      <Box
        sx={{
          maxWidth: 3000,
          mx: 'auto',
          px: { xs: '1rem', sm: '1.5rem' },
          py: '1.5rem',
          mt: '-2rem',
        }}
      >
        <WeeklyTimeline
          currentWeek={currentWeek}
          onWeekChange={setCurrentWeek}
          selectedDay={selectedDay}
          onDaySelect={setSelectedDay}
          days={DAYS}
          weekRange={weekRange}
        />

        <Box sx={{ px: { xs: '0', sm: '1.5rem' }, py: '1.5rem' }}>
          {loading ? (
            <Typography>Loading weekly plan...</Typography>
          ) : error ? (
            <Typography color="error">{error}</Typography>
          ) : selectedMeals.length === 0 ? (
            <MealPlannerEmptyState selectedDay={selectedDay} />
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: { xs: 'stretch', md: 'flex-start' },
                gap: 0,
                overflowX: { xs: 'visible', md: 'auto' },
                pb: '0.5rem',
              }}
            >
              {/* Breakfast */}
              <Box sx={{ minWidth: { md: '220px' }, flex: { md: '0 0 220px' } }}>
                <PlannedMealCard
                  meal={selectedMeals.find((m) => m.type === 'Breakfast')!}
                  onViewRecipe={(meal) => navigate(`/recipe/${meal.id}?date=${selectedDayRecord?.date ?? ''}&mealType=breakfast`)}
                  onAddToList={handleAddToList}
                />
              </Box>

              {/* Morning snack slot */}
              <Box sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'column' }, alignItems: 'center', justifyContent: 'center', px: { xs: 0, md: '0.5rem' }, py: { xs: '0.5rem', md: 0 } }}>
                {selectedDayRecord?.morningSnack ? null : (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddIcon fontSize="small" />}
                    onClick={() => handleOpenSnackDrawer('morningSnack', selectedDayRecord!.date, selectedDayRecord!.breakfast.recipeId)}
                    sx={{ whiteSpace: 'nowrap', fontSize: '0.7rem', px: '0.5rem', py: '0.25rem', borderStyle: 'dashed', color: 'text.secondary', borderColor: 'divider' }}
                  >
                    Snack
                  </Button>
                )}
              </Box>

              {/* Morning snack card (if exists) */}
              {selectedDayRecord?.morningSnack && (
                <>
                  <Box sx={{ minWidth: { md: '220px' }, flex: { md: '0 0 220px' } }}>
                    <PlannedMealCard
                      meal={selectedMeals.find((m) => m.type === 'Morning Snack')!}
                      onViewRecipe={(meal) => navigate(`/recipe/${meal.id}?date=${selectedDayRecord?.date ?? ''}&mealType=morningSnack`)}
                      onAddToList={handleAddToList}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', px: { xs: 0, md: '0.5rem' }, py: { xs: '0.5rem', md: 0 } }}>
                    <Typography color="text.disabled" sx={{ fontSize: '1.2rem' }}>›</Typography>
                  </Box>
                </>
              )}

              {/* Lunch */}
              <Box sx={{ minWidth: { md: '220px' }, flex: { md: '0 0 220px' } }}>
                <PlannedMealCard
                  meal={selectedMeals.find((m) => m.type === 'Lunch')!}
                  onViewRecipe={(meal) => navigate(`/recipe/${meal.id}?date=${selectedDayRecord?.date ?? ''}&mealType=lunch`)}
                  onAddToList={handleAddToList}
                />
              </Box>

              {/* Afternoon snack slot */}
              <Box sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'column' }, alignItems: 'center', justifyContent: 'center', px: { xs: 0, md: '0.5rem' }, py: { xs: '0.5rem', md: 0 } }}>
                {selectedDayRecord?.afternoonSnack ? null : (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddIcon fontSize="small" />}
                    onClick={() => handleOpenSnackDrawer('afternoonSnack', selectedDayRecord!.date, selectedDayRecord!.lunch.recipeId)}
                    sx={{ whiteSpace: 'nowrap', fontSize: '0.7rem', px: '0.5rem', py: '0.25rem', borderStyle: 'dashed', color: 'text.secondary', borderColor: 'divider' }}
                  >
                    Snack
                  </Button>
                )}
              </Box>

              {/* Afternoon snack card (if exists) */}
              {selectedDayRecord?.afternoonSnack && (
                <>
                  <Box sx={{ minWidth: { md: '220px' }, flex: { md: '0 0 220px' } }}>
                    <PlannedMealCard
                      meal={selectedMeals.find((m) => m.type === 'Afternoon Snack')!}
                      onViewRecipe={(meal) => navigate(`/recipe/${meal.id}?date=${selectedDayRecord?.date ?? ''}&mealType=afternoonSnack`)}
                      onAddToList={handleAddToList}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', px: { xs: 0, md: '0.5rem' }, py: { xs: '0.5rem', md: 0 } }}>
                    <Typography color="text.disabled" sx={{ fontSize: '1.2rem' }}>›</Typography>
                  </Box>
                </>
              )}

              {/* Dinner */}
              <Box sx={{ minWidth: { md: '220px' }, flex: { md: '0 0 220px' } }}>
                <PlannedMealCard
                  meal={selectedMeals.find((m) => m.type === 'Dinner')!}
                  onViewRecipe={(meal) => navigate(`/recipe/${meal.id}?date=${selectedDayRecord?.date ?? ''}&mealType=dinner`)}
                  onAddToList={handleAddToList}
                />
              </Box>
            </Box>
          )}
        </Box>
      </Box>
      <SuggestionsDrawer
        open={snackDrawerOpen}
        loading={snackSuggestionsLoading}
        suggestions={snackSuggestions}
        onClose={() => { setSnackDrawerOpen(false); setSnackTarget(null); }}
        onUse={handleUseSnackSuggestion}
        onAdd={handleAddSnackToOtherSlot}
      />

      <AddToPlanDialog
        open={addDialogOpen}
        recipeName={pendingAddSuggestion?.name ?? ''}
        onClose={() => { setAddDialogOpen(false); setPendingAddSuggestion(null); }}
        onSelect={handleAddToPlanSelect}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
