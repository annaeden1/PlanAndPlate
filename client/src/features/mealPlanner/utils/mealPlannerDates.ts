import { DAYS } from '@/features/mealPlanner/types/mealPlanner';

export const FULL_DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const spoonacularImageUrl = (recipeId: string | number, size = '312x231') =>
  `https://spoonacular.com/recipeImages/${recipeId}-${size}.jpg`;

export const formatDayKey = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', { weekday: 'short' });

export const computeWeekDate = (selectedDay: string, weekOffset: number) => {
  const ref = new Date();
  const dayIndex = DAYS.indexOf(selectedDay);
  const selectedDate = new Date(ref);
  selectedDate.setDate(ref.getDate() + weekOffset * 7 + (dayIndex - ref.getDay()));
  return selectedDate.toISOString().split('T')[0];
};

export const computeWeekRange = (weekOffset: number) => {
  const ref = new Date();
  ref.setDate(ref.getDate() + weekOffset * 7);
  const sunday = new Date(ref);
  sunday.setDate(ref.getDate() - ref.getDay());
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  const format = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${format(sunday)} - ${format(saturday)}`;
};

export const fullDayName = (shortDay: string) =>
  FULL_DAYS[DAYS.indexOf(shortDay)] ?? shortDay;
