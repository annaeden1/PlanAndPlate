export type AuthState = 'idle' | 'preferences' | 'loggedIn';

export interface TokenData {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  tokens: {
    token: string;
    refreshToken: string;
  };
}