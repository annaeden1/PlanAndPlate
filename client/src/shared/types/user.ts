import type { BodyStats } from '../utils/calorieCalculator';

export interface UserPreferences {
  diet: string[];
  allergies: string[];
  healthGoal: string;
  weeklyBudget?: number;
  bodyStats?: BodyStats;
}

export interface OnboardingData {
  preferences: UserPreferences;
}
