import { useEffect, useState } from 'react';
import { userManagementApi } from '../../../api/auth';
import { getUserId } from '../../../shared/utils/userId';
import type { UserProfile } from '../../../types/profileTypes';
import {
  dietaryOptions,
  goalsOptions,
} from '../../preferences/utils/preferencesOptions';
import { errorProfileState, initialProfileState } from '../utils/profileStates';

export const useUserProfile = (): UserProfile => {
  const [profile, setProfile] = useState<UserProfile>(initialProfileState);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('access-token');
      if (!token) {
        setProfile((prev) => ({
          ...prev,
          loading: false,
          error: 'No token found',
        }));
        return;
      }

      const userId = getUserId();
      if (!userId) {
        setProfile((prev) => ({
          ...prev,
          loading: false,
          error: 'Invalid token',
        }));
        return;
      }

      try {
        const [accountData, preferencesData] = await Promise.all([
          userManagementApi.getAccountData(userId, token),
          userManagementApi.getPreferences(userId, token),
        ]);

        const userPreferences = preferencesData.userPreferences || {};

        const dietaryPrefs = userPreferences.diet || [];
        const dietaryLabels = dietaryOptions.reduce(
          (acc, option) => {
            acc[option.id] = option.label;
            return acc;
          },
          {} as Record<string, string>,
        );
        const activePrefs = dietaryPrefs
          .map((key: string) => dietaryLabels[key])
          .filter(Boolean);

        // Parse goal
        const goalLabels = goalsOptions.reduce(
          (acc, option) => {
            acc[option.id] = option.label;
            return acc;
          },
          {} as Record<string, string>,
        );
        const goal = goalLabels[userPreferences.healthGoal] || 'Not set';

        const budgetNum = userPreferences.weeklyBudget;
        const budget = budgetNum ? `$${budgetNum.toFixed(2)}` : 'Not set';

        setProfile({
          username: accountData.name || 'Unknown',
          email: accountData.email || 'Unknown',
          preferences: activePrefs,
          goal,
          budget,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        setProfile((prev) => ({
          ...prev,
          ...errorProfileState,
        }));
      }
    };

    fetchProfile();
  }, []);

  return profile;
};
