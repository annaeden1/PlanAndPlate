import { useCallback, useEffect, useState } from 'react';
import { userManagementApi } from '@/features/auth/api/auth';
import type { OnboardingData } from '@/shared';
import { getUserId } from '../../../shared/utils/userId';
import type { UserProfile } from '@/features/profile/types/profile';
import {
  dietaryOptions,
  goalsOptions,
} from '../../preferences/utils/preferencesOptions';
import { errorProfileState, initialProfileState } from '../utils/profileStates';

type ApiLikeError = {
  response?: {
    data?: {
      error?: string;
    };
  };
};

const extractApiErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const apiError = error as ApiLikeError;
    const message = apiError.response?.data?.error;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }

  return fallback;
};

export const useUserProfile = (): UserProfile => {
  const [profile, setProfile] = useState<UserProfile>(initialProfileState);

  const getAuthContext = useCallback(() => {
    const token = localStorage.getItem('access-token');
    if (!token) {
      return { token: null, userId: null, error: 'No token found' as const };
    }

    const userId = getUserId();
    if (!userId) {
      return { token: null, userId: null, error: 'Invalid token' as const };
    }

    return { token, userId, error: null as null };
  }, []);

  const updateAccount = useCallback<UserProfile['updateAccount']>(
    async ({ username }) => {
      const { token, userId, error } = getAuthContext();
      if (!token || !userId) {
        return { success: false, error: error || 'Unauthorized' };
      }

      try {
        setProfile((prev) => ({ ...prev, saving: true, error: null }));

        const response = await userManagementApi.updateAccountData(
          userId,
          { name: username },
          token,
        );

        const updatedAccount = response.accountData || {};
        setProfile((prev) => ({
          ...prev,
          username: updatedAccount.name || username,
          saving: false,
        }));

        return { success: true };
      } catch (error) {
        console.error('Failed to update account profile:', error);
        setProfile((prev) => ({ ...prev, saving: false }));
        return {
          success: false,
          error: extractApiErrorMessage(error, 'Failed to update profile'),
        };
      }
    },
    [getAuthContext],
  );

  const updatePassword = useCallback<UserProfile['updatePassword']>(
    async ({ oldPassword, newPassword }) => {
      const { token, userId, error } = getAuthContext();
      if (!token || !userId) {
        return { success: false, error: error || 'Unauthorized' };
      }

      try {
        setProfile((prev) => ({ ...prev, saving: true, error: null }));
        await userManagementApi.updatePassword(
          userId,
          { oldPassword, newPassword },
          token,
        );
        setProfile((prev) => ({ ...prev, saving: false }));
        return { success: true };
      } catch (error) {
        console.error('Failed to update password:', error);
        setProfile((prev) => ({ ...prev, saving: false }));
        return {
          success: false,
          error: extractApiErrorMessage(error, 'Failed to update password'),
        };
      }
    },
    [getAuthContext],
  );

  const updatePreferenceSettings = useCallback<
    UserProfile['updatePreferenceSettings']
  >(
    async ({ diet, allergies, healthGoal, weeklyBudget }) => {
      const { token, userId, error } = getAuthContext();
      if (!token || !userId) {
        return { success: false, error: error || 'Unauthorized' };
      }

      try {
        setProfile((prev) => ({ ...prev, saving: true, error: null }));

        const payload: OnboardingData = {
          preferences: {
            diet,
            allergies,
            healthGoal,
            weeklyBudget,
          },
        };

        await userManagementApi.updatePreferences(userId, payload, token);

        const dietaryLabels = dietaryOptions.reduce(
          (acc, option) => {
            acc[option.id] = option.label;
            return acc;
          },
          {} as Record<string, string>,
        );

        const activePrefs = diet
          .map((key) => dietaryLabels[key])
          .filter(Boolean);

        const goalLabels = goalsOptions.reduce(
          (acc, option) => {
            acc[option.id] = option.label;
            return acc;
          },
          {} as Record<string, string>,
        );

        setProfile((prev) => ({
          ...prev,
          diet,
          allergies,
          healthGoal,
          weeklyBudget,
          preferences: activePrefs,
          goal: goalLabels[healthGoal] || 'Not set',
          budget: weeklyBudget ? `$${weeklyBudget.toFixed(2)}` : 'Not set',
          saving: false,
        }));

        return { success: true };
      } catch (error) {
        console.error('Failed to update preferences:', error);
        setProfile((prev) => ({ ...prev, saving: false }));
        return {
          success: false,
          error: extractApiErrorMessage(error, 'Failed to update preferences'),
        };
      }
    },
    [getAuthContext],
  );

  useEffect(() => {
    const fetchProfile = async () => {
      const { token, userId, error } = getAuthContext();
      if (!token || !userId) {
        setProfile((prev) => ({
          ...prev,
          loading: false,
          error: error || 'Unauthorized',
          updateAccount,
          updatePassword,
          updatePreferenceSettings,
        }));
        return;
      }

      try {
        const [accountData, preferencesData] = await Promise.all([
          userManagementApi.getAccountData(userId, token),
          userManagementApi.getPreferences(userId, token),
        ]);

        const userPreferences = preferencesData.userPreferences || {};
        const dietaryPrefs: string[] = userPreferences.diet || [];
        const selectedAllergies: string[] = userPreferences.allergies || [];

        const dietaryLabels = dietaryOptions.reduce(
          (acc, option) => {
            acc[option.id] = option.label;
            return acc;
          },
          {} as Record<string, string>,
        );

        const activePrefs = dietaryPrefs
          .map((key) => dietaryLabels[key])
          .filter(Boolean);

        const goalLabels = goalsOptions.reduce(
          (acc, option) => {
            acc[option.id] = option.label;
            return acc;
          },
          {} as Record<string, string>,
        );

        const rawGoal = userPreferences.healthGoal || '';
        const rawBudget: number | undefined = userPreferences.weeklyBudget;

        setProfile({
          username: accountData.name || 'Unknown',
          email: accountData.email || 'Unknown',
          diet: dietaryPrefs,
          allergies: selectedAllergies,
          healthGoal: rawGoal,
          weeklyBudget: rawBudget,
          preferences: activePrefs,
          goal: goalLabels[rawGoal] || 'Not set',
          budget: rawBudget ? `$${rawBudget.toFixed(2)}` : 'Not set',
          bodyStats: userPreferences.bodyStats,
          healthGoalId: userPreferences.healthGoal || '',
          loading: false,
          saving: false,
          error: null,
          updateAccount,
          updatePassword,
          updatePreferenceSettings,
        });
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        setProfile((prev) => ({
          ...prev,
          ...errorProfileState,
          updateAccount,
          updatePassword,
          updatePreferenceSettings,
        }));
      }
    };

    fetchProfile();
  }, [getAuthContext, updateAccount, updatePassword, updatePreferenceSettings]);

  return profile;
};
