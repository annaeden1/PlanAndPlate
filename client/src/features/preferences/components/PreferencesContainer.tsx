import { Preferences } from '@/pages/Preferences';
import type { OnboardingData } from '@/shared';

interface PreferencesContainerProps {
  onComplete: (data: OnboardingData) => void;
}

export function PreferencesContainer({
  onComplete,
}: PreferencesContainerProps) {
  return <Preferences onComplete={onComplete} />;
}
