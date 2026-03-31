import { Box, Card, Chip, LinearProgress, Typography } from '@mui/material';
import type { NutritionItem } from '../../shared';

export interface NutritionFactsCardProps {
  nutritionFacts?: NutritionItem[];
}

export const NutritionFactsCard = ({
  nutritionFacts,
}: NutritionFactsCardProps) => {
  const safeFacts = nutritionFacts || [];

  return (
    <Card sx={{ p: '1.5rem', mb: '1rem' }}>
      <Typography variant="h4" sx={{ mb: '1rem' }}>
        Nutrition Facts
      </Typography>

      {safeFacts.length === 0 ? (
        <Typography color="text.secondary">
          No nutrition data available
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {safeFacts.map((item) => (
            <Box key={item.label}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: '0.25rem',
                }}
              >
                <Typography variant="body2">{item.label}</Typography>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Typography>{item.value}</Typography>
                  <Chip label={`${item.percent}%`} size="small" />
                </Box>
              </Box>

              <LinearProgress
                variant="determinate"
                value={Math.min(item.percent * 5, 100)}
                sx={{
                  height: '0.375rem',
                  borderRadius: '0.25rem',
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: 'primary.main',
                    borderRadius: '0.25rem',
                  },
                }}
              />
            </Box>
          ))}
        </Box>
      )}
    </Card>
  );
};
