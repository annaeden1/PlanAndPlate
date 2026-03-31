import { Box, Card, Typography } from '@mui/material';

export interface HealthScoreCardProps {
  grade: 'a' | 'b' | 'c' | 'd' | 'e' | 'unknown';
}

const gradeConfig = {
  a: { color: '#1E8E3E', label: 'Excellent' },
  b: { color: '#7CB342', label: 'Good' },
  c: { color: '#FBC02D', label: 'Average' },
  d: { color: '#F57C00', label: 'Poor' },
  e: { color: '#D32F2F', label: 'Bad' },
  unknown: { color: '#9E9E9E', label: 'Unknown' },
};

export const HealthScoreCard = ({ grade }: HealthScoreCardProps) => {
  const config = gradeConfig[grade] || gradeConfig.unknown;
  return (
    <Card
      sx={{
        p: '1.5rem',
        mb: '1rem',
        background: `linear-gradient(135deg, ${config.color}20 0%, ${config.color}10 100%)`,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: '0.25rem' }}
          >
            Nutri Score
          </Typography>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 'bold',
              color: config.color,
              textTransform: 'uppercase',
            }}
          >
            {grade}
          </Typography>
          {grade !== 'unknown' && (
            <Typography variant="body2" color="text.secondary">
              {config.label}
            </Typography>
          )}{' '}
        </Box>

        {grade !== 'unknown' && (
          <Box
            sx={{
              width: '4rem',
              height: '4rem',
              borderRadius: '50%',
              bgcolor: `${config.color}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: 'bold',
                color: config.color,
                textTransform: 'uppercase',
              }}
            >
              {grade}
            </Typography>
          </Box>
        )}
      </Box>
    </Card>
  );
};
