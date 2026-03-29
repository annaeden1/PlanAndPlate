import { Box, Typography } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { SelectableCard } from '../../../core/components/SelectableCard';
import { IconBox } from '../../../core/components/IconBox';

interface GoalsStepProps {
  goal: string;
  onChange: (goal: string) => void;
}

export function GoalsStep({ goal, onChange }: GoalsStepProps) {
  const options = [
    { id: 'lose_weight', label: 'Lose Weight' },
    { id: 'gain_muscle', label: 'Gain Muscle' },
    { id: 'eat_healthier', label: 'Eat Healthier' },
    { id: 'maintain_weight', label: 'Maintain Weight' },
  ];

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
