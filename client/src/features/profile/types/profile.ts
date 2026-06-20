export interface UserProfile {
  username: string;
  email: string;
  diet: string[];
  allergies: string[];
  healthGoal: string;
  weeklyBudget?: number;
  preferences: string[];
  goal: string;
  budget: string;
  loading: boolean;
  saving: boolean;
  error: string | null;
  mealsLogged: number;
  weeksActive: number;
  updateAccount: (payload: { username: string }) => Promise<{
    success: boolean;
    error?: string;
  }>;
  updatePassword: (payload: {
    oldPassword: string;
    newPassword: string;
  }) => Promise<{
    success: boolean;
    error?: string;
  }>;
  updatePreferenceSettings: (payload: {
    diet: string[];
    allergies: string[];
    healthGoal: string;
    weeklyBudget?: number;
  }) => Promise<{
    success: boolean;
    error?: string;
  }>;
}
