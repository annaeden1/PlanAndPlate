// Goal-driven calorie engine (Mifflin-St Jeor, same approach as calculator.net).
// Pure module duplicated in client/src/shared/utils/calorieCalculator.ts —
// keep both copies in sync so client display and server meal-gen never drift.

export type Gender = 'male' | 'female';

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'very_active'
  | 'extra_active';

export type UnitSystem = 'metric' | 'us';

export interface BodyStats {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: Gender;
  activityLevel: ActivityLevel;
  unitSystem: UnitSystem;
}

export interface CalorieTargets {
  bmr: number;
  maintenance: number;
  targetCalories: number;
  proteinGramsPerDay: number;
}

// calculator.net activity multipliers
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.465,
  active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

// Per-goal modifier. Protein per kg of bodyweight; a deficit keeps protein high
// to preserve muscle. healthyNote drives the "eat healthier" guidance copy.
export const GOAL_MODIFIERS: Record<
  string,
  { calorieFactor: number; proteinPerKg: number; healthyNote?: boolean }
> = {
  gain_muscle: { calorieFactor: 1.15, proteinPerKg: 1.9 },
  lose_weight: { calorieFactor: 0.85, proteinPerKg: 1.6 },
  eat_healthier: { calorieFactor: 1.0, proteinPerKg: 1.2, healthyNote: true },
  maintain_weight: { calorieFactor: 1.0, proteinPerKg: 1.2 },
};

export const lbToKg = (lb: number): number => lb * 0.453592;

export const ftInToCm = (ft: number, inch: number): number =>
  (ft * 12 + inch) * 2.54;

// Mifflin-St Jeor BMR
const calcBmr = (
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender,
): number => {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === 'male' ? base + 5 : base - 161;
};

const isComplete = (stats?: Partial<BodyStats> | null): stats is BodyStats =>
  !!stats &&
  typeof stats.weightKg === 'number' &&
  stats.weightKg > 0 &&
  typeof stats.heightCm === 'number' &&
  stats.heightCm > 0 &&
  typeof stats.age === 'number' &&
  stats.age > 0 &&
  (stats.gender === 'male' || stats.gender === 'female') &&
  !!stats.activityLevel &&
  stats.activityLevel in ACTIVITY_MULTIPLIERS;

// Returns null when stats are incomplete → callers stay backward-compatible
// (no target sent = previous behavior).
export const calcTargets = (
  stats: Partial<BodyStats> | null | undefined,
  healthGoal: string,
): CalorieTargets | null => {
  if (!isComplete(stats)) return null;

  const bmr = calcBmr(stats.weightKg, stats.heightCm, stats.age, stats.gender);
  const maintenance = bmr * ACTIVITY_MULTIPLIERS[stats.activityLevel];

  const goal = GOAL_MODIFIERS[healthGoal] ?? GOAL_MODIFIERS.maintain_weight;
  const targetCalories = maintenance * goal.calorieFactor;
  const proteinGramsPerDay = goal.proteinPerKg * stats.weightKg;

  return {
    bmr: Math.round(bmr),
    maintenance: Math.round(maintenance),
    targetCalories: Math.round(targetCalories),
    proteinGramsPerDay: Math.round(proteinGramsPerDay),
  };
};
