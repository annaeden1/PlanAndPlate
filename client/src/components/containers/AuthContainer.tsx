import { Auth } from '../../features/auth/Auth';
import type { TokenData } from '../../shared';

interface AuthContainerProps {
  onAuthComplete: (token: TokenData, isSignUp: boolean) => void;
}

export function AuthContainer({ onAuthComplete }: AuthContainerProps) {
  return <Auth onAuthComplete={onAuthComplete} />;
}
