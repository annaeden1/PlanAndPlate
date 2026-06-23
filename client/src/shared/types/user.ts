export interface UserPreferences {
  diet: string[];
  allergies: string[];
  healthGoal: string;
}

export interface OnboardingData {
  preferences: UserPreferences;
}
