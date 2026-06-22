import type { BodyStats } from '@/shared';

export interface UserProfile {
  username: string;
  email: string;
  diet: string[];
  allergies: string[];
  healthGoal: string;
  preferences: string[];
  goal: string;
  bodyStats?: Partial<BodyStats>;
  healthGoalId: string;
  loading: boolean;
  saving: boolean;
  error: string | null;
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
  }) => Promise<{
    success: boolean;
    error?: string;
  }>;
}
