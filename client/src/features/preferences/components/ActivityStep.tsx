import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import { Box, Typography } from '@mui/material';
import { IconBox } from '@/components/common/IconBox';
import { SelectableCard } from '@/components/common/SelectableCard';
import type { Options } from '../types/options';
import { activityOptions } from '../utils/preferencesOptions';

interface ActivityStepProps {
  activityLevel: string;
  onChange: (activityLevel: string) => void;
}

export function ActivityStep({ activityLevel, onChange }: ActivityStepProps) {
  const options: Options<string> = activityOptions;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Box>
        <Typography variant="h2" sx={{ mb: '0.5rem' }}>
          Activity Level
        </Typography>
        <Typography color="text.secondary">
          How active are you on a typical week?
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {options.map((option) => {
          const selected = activityLevel === option.id;
          return (
            <SelectableCard
              key={option.id}
              selected={selected}
              onClick={() => onChange(option.id)}
              contentSx={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                p: '1.25rem',
              }}
            >
              <IconBox
                icon={<DirectionsRunIcon />}
                color={selected ? 'primary.contrastText' : 'text.secondary'}
                bgColor={selected ? 'primary.main' : 'grey.100'}
                size="3rem"
                iconSize="1.5rem"
              />
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 600 }}>{option.label}</Typography>
                {option.description && (
                  <Typography variant="body2" color="text.secondary">
                    {option.description}
                  </Typography>
                )}
              </Box>
            </SelectableCard>
          );
        })}
      </Box>
    </Box>
  );
}
