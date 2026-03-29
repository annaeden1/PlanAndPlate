import { Box, Checkbox, Typography } from '@mui/material';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import { SelectableCard } from '../../../core/components/SelectableCard';
import type { DietaryPreferences } from '../../../shared';

interface DietaryStepProps {
  preferences: DietaryPreferences;
  onChange: (key: keyof DietaryPreferences) => void;
}

export function DietaryStep({ preferences, onChange }: DietaryStepProps) {
  const options: { id: keyof DietaryPreferences; label: string }[] = [
    { id: 'glutenFree', label: 'Gluten Free' },
    { id: 'ketogenic', label: 'Ketogenic' },
    { id: 'vegetarian', label: 'Vegetarian' },
    { id: 'lactoVegetarian', label: 'Lacto-Vegetarian' },
    { id: 'ovoVegetarian', label: 'Ovo Vegetarian' },
    { id: 'vegan', label: 'Vegan' },
    { id: 'pescatarian', label: 'Pescetarian' },
    { id: 'paleo', label: 'Paleo' },
    { id: 'primal', label: 'Primal' },
    { id: 'lowFODMAP', label: 'Low FODMAP' },
    { id: 'whole30', label: 'Whole30' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Box>
        <Typography variant="h2" sx={{ mb: '0.5rem' }}>
          Dietary Preferences
        </Typography>
        <Typography color="text.secondary">
          Select one preference
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {options.map((pref) => {
          const selected = preferences[pref.id];
          return (
            <SelectableCard
              key={String(pref.id)}
              selected={selected}
              onClick={() => onChange(pref.id)}
              contentSx={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <Checkbox
                checked={selected}
                onChange={() => onChange(pref.id)}
                sx={{ p: 0 }}
              />
              <Typography sx={{ flex: 1 }}>{pref.label}</Typography>
              <LocalDiningIcon
                sx={{ color: 'primary.main', fontSize: '1.25rem' }}
              />
            </SelectableCard>
          );
        })}
      </Box>
    </Box>
  );
}
