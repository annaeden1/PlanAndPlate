import { Box, Checkbox, Typography } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import { SelectableCard } from '../../../core/components/SelectableCard';

export interface Allergies {
  nuts: boolean;
  dairy: boolean;
  gluten: boolean;
  shellfish: boolean;
  eggs: boolean;
  soy: boolean;
}

interface AllergiesStepProps {
  allergies: Allergies;
  onChange: (key: keyof Allergies, value: boolean) => void;
}

export function AllergiesStep({ allergies, onChange }: AllergiesStepProps) {
  const options: { id: keyof Allergies; label: string }[] = [
    { id: 'nuts', label: 'Nuts' },
    { id: 'dairy', label: 'Dairy' },
    { id: 'gluten', label: 'Gluten' },
    { id: 'shellfish', label: 'Shellfish' },
    { id: 'eggs', label: 'Eggs' },
    { id: 'soy', label: 'Soy' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Box>
        <Typography variant="h2" sx={{ mb: '0.5rem' }}>
          Allergies
        </Typography>
        <Typography color="text.secondary">
          Select all that apply to you
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {options.map((allergy) => {
          const selected = allergies[allergy.id];
          return (
            <SelectableCard
              key={allergy.id}
              selected={selected}
              onClick={() => onChange(allergy.id, !selected)}
              contentSx={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <Checkbox
                checked={selected}
                onChange={(e) => onChange(allergy.id, e.target.checked)}
                sx={{ p: 0 }}
              />
              <Typography sx={{ flex: 1 }}>{allergy.label}</Typography>
              <WarningIcon
                sx={{ color: 'warning.main', fontSize: '1.25rem' }}
              />
            </SelectableCard>
          );
        })}
      </Box>
    </Box>
  );
}
