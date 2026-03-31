import type { UserProfile } from '../../../types/profileTypes';

export const initialProfileState: UserProfile = {
  username: 'Loading...',
  email: 'Loading...',
  preferences: [],
  goal: 'Loading...',
  budget: 'Loading...',
  loading: true,
  error: null,
};

export const errorProfileState: Partial<UserProfile> = {
  username: 'Error loading',
  email: 'Error loading',
  preferences: [],
  goal: 'Error loading',
  budget: 'Error loading',
  loading: false,
  error: 'Failed to load profile',
};
