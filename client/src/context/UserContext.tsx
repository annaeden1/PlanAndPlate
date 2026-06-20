import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { userManagementApi } from '@/features/auth/api/auth';
import { getUserId } from '@/shared/utils/userId';

interface UserSummary {
  name: string;
  email: string;

  firstName: string;

  initial: string;
  loading: boolean;
}

const FALLBACK: UserSummary = {
  name: '',
  email: '',
  firstName: '',
  initial: '🙂',
  loading: true,
};

const UserContext = createContext<UserSummary>(FALLBACK);

const summarise = (name: string, email: string): UserSummary => {
  const clean = name?.trim() || '';
  const firstName = clean.split(/\s+/)[0] || '';
  const initial = (clean || email || '?').trim().charAt(0).toUpperCase() || '?';
  return { name: clean, email: email ?? '', firstName, initial, loading: false };
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserSummary>(FALLBACK);

  useEffect(() => {
    const token = localStorage.getItem('access-token');
    const userId = getUserId();
    if (!token || !userId) {
      setUser((u) => ({ ...u, loading: false }));
      return;
    }
    userManagementApi
      .getAccountData(userId, token)
      .then((data) => setUser(summarise(data?.name ?? '', data?.email ?? '')))
      .catch(() => setUser((u) => ({ ...u, loading: false })));
  }, []);

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
};

export const useCurrentUser = () => useContext(UserContext);
