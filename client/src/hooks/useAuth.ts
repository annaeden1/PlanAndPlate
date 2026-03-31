import { useEffect, useState } from 'react';
import { userManagementApi } from '../api/auth';
import type { AuthState, OnboardingData, TokenData } from '../shared';
import { getUserId } from '../shared/utils/userId';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>('idle');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access-token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await userManagementApi.verify(token);

        if (response) {
          setAuthState('loggedIn');
        } else {
          localStorage.removeItem('access-token');
          localStorage.removeItem('refresh-token');
          setAuthState('idle');
        }
      } catch (error) {
        console.error('Auth verification failed', error);
        setAuthState('idle');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleAuthComplete = (token: TokenData, isSignUp: boolean) => {
    localStorage.setItem('access-token', token.accessToken);
    localStorage.setItem('refresh-token', token.refreshToken);

    if (isSignUp) {
      setAuthState('preferences');
    } else {
      setAuthState('loggedIn');
    }
  };

  const handleOnboardingComplete = async (onboardingData: OnboardingData) => {
    const token = localStorage.getItem('access-token');

    if (!token) {
      alert('Could not find auth token. Please sign in again.');
      setAuthState('idle');
      return;
    }

    try {
      const userId = getUserId();

      if (!userId) {
        throw new Error('Authentication required');
      }

      const response = await userManagementApi.updatePreferences(
        userId,
        onboardingData,
        token,
      );
      if (response.updatedUser) {
        setAuthState('loggedIn');
      } else {
        alert(response.message || 'Could not complete onboarding.');
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      alert('Network error while completing onboarding.');
    }
  };

  return {
    authState,
    isLoading,
    handleAuthComplete,
    handleOnboardingComplete,
  };
};
