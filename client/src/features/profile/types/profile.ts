import type { BodyStats } from '@/shared';

export interface UserProfile {
  username: string;
  email: string;
  preferences: string[];
  goal: string;
  budget: string;
  bodyStats?: Partial<BodyStats>;
  healthGoalId: string;
  loading: boolean;
  error: string | null;
}
