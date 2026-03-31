import { jwtDecode } from 'jwt-decode';

export const getUserId = (): string | null => {
  const token: string | null = localStorage.getItem('access-token');
  if (!token) {
    return null;
  }

  try {
    const decoded = jwtDecode<{ userId: string }>(token);
    return decoded.userId;
  } catch (error) {
    return null;
  }
};
