import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, Button } from '@mui/material';
import { useState } from 'react';
import type {
  Allergies,
  BodyStats,
  DietaryPreferences,
  OnboardingData,
} from '@/shared';
import { ActivityStep } from '@/features/preferences/components/ActivityStep';
import { AllergiesStep } from '@/features/preferences/components/AllergiesStep';
import { BodyStatsStep } from '@/features/preferences/components/BodyStatsStep';
import { BudgetStep } from '@/features/preferences/components/BudgetStep';
import { DietaryStep } from '@/features/preferences/components/DietaryStep';
import { GoalsStep } from '@/features/preferences/components/GoalsStep';
import { ProgressHeader } from '@/features/preferences/components/ProgressHeader';
import {
  allergiesInitialState,
  dietaryInitialState,
} from '@/features/preferences/utils/preferencesInitialStates';

interface PreferencesProps {
  onComplete: (data: OnboardingData) => void;
}

const isBodyStatsComplete = (s: Partial<BodyStats>): s is BodyStats =>
  !!s.weightKg &&
  s.weightKg > 0 &&
  !!s.heightCm &&
  s.heightCm > 0 &&
  !!s.age &&
  s.age >= 13 &&
  s.age <= 100 &&
  (s.gender === 'male' || s.gender === 'female');

export function Preferences({ onComplete }: PreferencesProps) {
  const [step, setStep] = useState(1);
  const [preferences, setPreferences] =
    useState<DietaryPreferences>(dietaryInitialState);
  const [allergies, setAllergies] = useState<Allergies>(allergiesInitialState);
  const [bodyStats, setBodyStats] = useState<Partial<BodyStats>>({});
  const [goal, setGoal] = useState('');
  const [budget, setBudget] = useState('');

  const totalSteps = 6;

  const handlePreferenceChange = (selectedKey: keyof DietaryPreferences) => {
    const defaultPreferences: DietaryPreferences = dietaryInitialState;

    const newPreferences = Object.keys(defaultPreferences).reduce(
      (acc, key) => {
        acc[key as keyof DietaryPreferences] = key === selectedKey;
        return acc;
      },
      {} as DietaryPreferences,
    );

    setPreferences(newPreferences);
  };

  const handleAllergyChange = (key: keyof Allergies, value: boolean) => {
    setAllergies((prev: Allergies) => ({ ...prev, [key]: value }));
  };

  const handleBodyStatsChange = (patch: Partial<BodyStats>) => {
    setBodyStats((prev) => ({ ...prev, ...patch }));
  };

  // Gate "Continue" on the steps that need valid input before calorie calc.
  const canContinue =
    (step !== 3 || isBodyStatsComplete(bodyStats)) &&
    (step !== 4 || !!bodyStats.activityLevel);

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      const selectedDiet = Object.keys(preferences).find(
        (key) => preferences[key as keyof DietaryPreferences],
      );
      const selectedAllergies = Object.keys(allergies).filter(
        (key) => allergies[key as keyof Allergies],
      );

      const onboardingData: OnboardingData = {
        preferences: {
          diet: selectedDiet ? [selectedDiet] : [],
          allergies: selectedAllergies,
          healthGoal: goal,
          weeklyBudget: parseFloat(budget) || undefined,
          bodyStats:
            isBodyStatsComplete(bodyStats) && bodyStats.activityLevel
              ? (bodyStats as BodyStats)
              : undefined,
        },
      };

      onComplete(onboardingData);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          'linear-gradient(180deg, rgba(62, 180, 137, 0.1) 0%, #ffffff 100%)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ flex: 1, overflowY: 'auto', pb: '8rem', pt: '2rem' }}>
        <Box sx={{ maxWidth: '28rem', mx: 'auto', px: '1.5rem' }}>
          <ProgressHeader step={step} totalSteps={totalSteps} />

          {step === 1 && (
            <DietaryStep
              preferences={preferences}
              onChange={handlePreferenceChange}
            />
          )}

          {step === 2 && (
            <AllergiesStep
              allergies={allergies}
              onChange={handleAllergyChange}
            />
          )}

          {step === 3 && (
            <BodyStatsStep value={bodyStats} onChange={handleBodyStatsChange} />
          )}

          {step === 4 && (
            <ActivityStep
              activityLevel={bodyStats.activityLevel ?? ''}
              onChange={(activityLevel) =>
                handleBodyStatsChange({
                  activityLevel: activityLevel as BodyStats['activityLevel'],
                })
              }
            />
          )}

          {step === 5 && (
            <GoalsStep goal={goal} onChange={setGoal} stats={bodyStats} />
          )}

          {step === 6 && <BudgetStep budget={budget} onChange={setBudget} />}
        </Box>
      </Box>

      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background:
            'linear-gradient(180deg, transparent 0%, #ffffff 20%, #ffffff 100%)',
          p: '1.5rem',
          pb: '2rem',
        }}
      >
        <Box sx={{ maxWidth: '28rem', mx: 'auto', display: 'flex', gap: '1rem' }}>
          {step > 1 && (
            <Button
              variant="outlined"
              size="large"
              onClick={() => setStep(step - 1)}
              sx={{
                height: '3.5rem',
                borderRadius: '0.75rem',
                fontSize: '1rem',
                flex: 1,
              }}
            >
              Back
            </Button>
          )}
          <Button
            variant="contained"
            fullWidth={step === 1}
            size="large"
            disabled={!canContinue}
            onClick={handleNext}
            endIcon={<ChevronRightIcon />}
            sx={{
              height: '3.5rem',
              borderRadius: '0.75rem',
              boxShadow: 3,
              fontSize: '1rem',
              flex: step > 1 ? 2 : undefined,
            }}
          >
            {step === totalSteps ? 'Get Started' : 'Continue'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
