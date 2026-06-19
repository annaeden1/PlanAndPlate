import { useEffect, useState } from 'react';
import type { ApiMealPlan } from '@/features/mealPlanner/types/mealPlanner';
import type { WeeklyBar } from '@/components/common/WeeklyChart';
import { mealPlannerApi } from '@/features/mealPlanner/api/mealPlanner';
import { getUserId } from '@/shared/utils/userId';

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export interface WeeklyBalance {
  bars: WeeklyBar[];
  avg: number;
  activeIndex: number;
}

export const computeWeeklyBalance = (plan: ApiMealPlan | null): WeeklyBalance => {
  const totals = new Array(7).fill(0);
  const has = new Array(7).fill(false);
  let activeIndex = new Date().getDay();
  const todayKey = new Date().toDateString();

  if (plan?.days?.length) {
    for (const d of plan.days) {
      const date = new Date(d.date);
      const idx = date.getDay();
      totals[idx] =
        (d.breakfast?.calories || 0) +
        (d.lunch?.calories || 0) +
        (d.dinner?.calories || 0);
      has[idx] = true;
      if (date.toDateString() === todayKey) activeIndex = idx;
    }
  }

  const filledTotals = totals.filter((_, i) => has[i]);
  const filledCount = filledTotals.length;
  const avg = filledCount
    ? Math.round(filledTotals.reduce((a, b) => a + b, 0) / filledCount)
    : 0;

  const min = filledCount ? Math.min(...filledTotals) : 0;
  const max = filledCount ? Math.max(...filledTotals) : 1;
  const range = Math.max(max - min, 1);
  const normalise = (t: number) => 0.55 + 0.45 * (t - min) / range;

  const fmtKcal = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n > 0 ? `${n}` : '';
  const bars: WeeklyBar[] = totals.map((t, i) => ({
    label: DOW[i],
    value: has[i] ? normalise(t) : 0,
    calLabel: has[i] ? fmtKcal(t) : undefined,
  }));

  return { bars, avg, activeIndex };
};

export const useWeeklyBalance = (): WeeklyBalance => {
  const [plan, setPlan] = useState<ApiMealPlan | null>(null);

  useEffect(() => {
    const userId = getUserId();
    if (!userId) return;
    const date = new Date().toISOString().split('T')[0];
    mealPlannerApi
      .getWeeklyPlan(userId, date)
      .then(setPlan)
      .catch(() => setPlan(null));
  }, []);

  return computeWeeklyBalance(plan);
};
