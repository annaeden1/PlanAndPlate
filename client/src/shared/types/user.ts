export interface UserPreferences {
  diet: string[];
  allergies: string[];
  healthGoal: string;
  weeklyBudget: number;
}

export interface OnboardingData {
  preferences: UserPreferences;
}