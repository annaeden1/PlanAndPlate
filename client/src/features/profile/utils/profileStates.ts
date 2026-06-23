import type { UserProfile } from '@/features/profile/types/profile';

export const initialProfileState: UserProfile = {
  username: 'Loading...',
  email: 'Loading...',
  diet: [],
  allergies: [],
  healthGoal: '',
  preferences: [],
  goal: 'Loading...',
  loading: true,
  saving: false,
  error: null,
  mealsLogged: 0,
  weeksActive: 0,
  updateAccount: async () => ({ success: false, error: 'Not initialized' }),
  updatePassword: async () => ({ success: false, error: 'Not initialized' }),
  updatePreferenceSettings: async () => ({
    success: false,
    error: 'Not initialized',
  }),
};

export const errorProfileState: Partial<UserProfile> = {
  username: 'Error loading',
  email: 'Error loading',
  diet: [],
  allergies: [],
  healthGoal: '',
  preferences: [],
  goal: 'Error loading',
  loading: false,
  saving: false,
  error: 'Failed to load profile',
  mealsLogged: 0,
  weeksActive: 0,
};
