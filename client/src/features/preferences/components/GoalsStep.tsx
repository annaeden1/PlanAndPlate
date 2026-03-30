import FavoriteIcon from '@mui/icons-material/Favorite';
import { Box, Typography } from '@mui/material';
import { IconBox } from '../../../core/components/IconBox';
import { SelectableCard } from '../../../core/components/SelectableCard';
import type { Options } from '../utils/optionsTypes';
import { goalsOptions } from '../utils/preferencesOptions';

interface GoalsStepProps {
  goal: string;
  onChange: (goal: string) => void;
}

export function GoalsStep({ goal, onChange }: GoalsStepProps) {
  const options: Options<string> = goalsOptions;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Box>
        <Typography variant="h2" sx={{ mb: '0.5rem' }}>
          Health Goals
        </Typography>
        <Typography color="text.secondary">
          What's your primary focus?
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {options.map((goalOption) => {
          const selected = goal === goalOption.id;
          return (
            <SelectableCard
              key={goalOption.id}
              selected={selected}
              onClick={() => onChange(goalOption.id)}
              contentSx={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                p: '1.25rem',
              }}
            >
              <IconBox
                icon={<FavoriteIcon />}
                color={selected ? 'primary.contrastText' : 'text.secondary'}
                bgColor={selected ? 'primary.main' : 'grey.100'}
                size="3rem"
                iconSize="1.5rem"
              />
              <Typography sx={{ flex: 1 }}>{goalOption.label}</Typography>
            </SelectableCard>
          );
        })}
      </Box>
    </Box>
  );
}
