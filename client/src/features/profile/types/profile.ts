export interface UserProfile {
  username: string;
  email: string;
  preferences: string[];
  goal: string;
  budget: string;
  loading: boolean;
  error: string | null;
}
