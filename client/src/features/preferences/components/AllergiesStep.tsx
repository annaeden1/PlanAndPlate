import WarningIcon from '@mui/icons-material/Warning';
import { Box, Checkbox, Typography } from '@mui/material';
import { SelectableCard } from '../../../core/components/SelectableCard';
import type { Allergies } from '../../../shared';
import type { Options } from '../utils/optionsTypes';
import { allergiesOptions } from '../utils/preferencesOptions';

interface AllergiesStepProps {
  allergies: Allergies;
  onChange: (key: keyof Allergies, value: boolean) => void;
}

export function AllergiesStep({ allergies, onChange }: AllergiesStepProps) {
  const options: Options<keyof Allergies> = allergiesOptions;

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
              key={String(allergy.id)}
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
