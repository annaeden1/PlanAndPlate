import { useState } from 'react';
import { Box, Button } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { ProgressHeader } from './components/ProgressHeader';
import { DietaryStep, type DietaryPreferences } from './components/DietaryStep';
import { AllergiesStep, type Allergies } from './components/AllergiesStep';
import { GoalsStep } from './components/GoalsStep';
import { BudgetStep } from './components/BudgetStep';

interface OnboardingData {
  preferences: {
    diet: string[];
    allergies: string[];
    healthGoal: string;
    weeklyBudget: number;
  };
}

interface PreferencesProps {
  onComplete: (data: OnboardingData) => void;
}

export function Preferences({ onComplete }: PreferencesProps) {
  const [step, setStep] = useState(1);
  const [preferences, setPreferences] = useState<DietaryPreferences>({
    vegetarian: false,
    vegan: false,
    glutenFree: false,
    dairyFree: false,
    kosher: false,
    halal: false,
  });
  const [allergies, setAllergies] = useState<Allergies>({
    nuts: false,
    dairy: false,
    gluten: false,
    shellfish: false,
    eggs: false,
    soy: false,
  });
  const [goal, setGoal] = useState('');
  const [budget, setBudget] = useState('');

  const totalSteps = 4;

  const handlePreferenceChange = (selectedKey: keyof DietaryPreferences) => {
    const next: DietaryPreferences = {
      vegetarian: false,
      vegan: false,
      glutenFree: false,
      dairyFree: false,
      kosher: false,
      halal: false,
    };

    (Object.keys(next) as Array<keyof DietaryPreferences>).forEach((k) => {
      next[k] = k === selectedKey;
    });

    setPreferences(next);
  };

  const handleAllergyChange = (key: keyof Allergies, value: boolean) => {
    setAllergies((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      const selectedDiet = Object.keys(preferences).find(key => preferences[key as keyof DietaryPreferences]);
      const selectedAllergies = Object.keys(allergies).filter(key => allergies[key as keyof Allergies]);

      const onboardingData: OnboardingData = {
        preferences: {
          diet: selectedDiet ? [selectedDiet] : [],
          allergies: selectedAllergies,
          healthGoal: goal,
          weeklyBudget: parseFloat(budget) || 0,
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

          {step === 3 && <GoalsStep goal={goal} onChange={setGoal} />}

          {step === 4 && <BudgetStep budget={budget} onChange={setBudget} />}
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
        <Box sx={{ maxWidth: '28rem', mx: 'auto' }}>
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handleNext}
            endIcon={<ChevronRightIcon />}
            sx={{
              height: '3.5rem',
              borderRadius: '0.75rem',
              boxShadow: 3,
              fontSize: '1rem',
            }}
          >
            {step === totalSteps ? 'Get Started' : 'Continue'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
