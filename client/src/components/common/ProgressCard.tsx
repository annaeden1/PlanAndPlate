import { Card, CardContent, Box, Typography, Chip, LinearProgress } from '@mui/material';

interface ProgressCardProps {
  title: string;
  primaryText: string;
  chipLabel?: string;
  progressValue: number;
}

export const ProgressCard = ({
  title,
  primaryText,
  chipLabel,
  progressValue,
}: ProgressCardProps) => {
  return (
    <Card sx={{ borderRadius: '1.5rem', mb: '2rem', boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
      <CardContent sx={{ p: '1.5rem' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: '1rem' }}>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          {chipLabel && (
            <Chip
              label={chipLabel}
              size="small"
              sx={{
                fontWeight: 500,
                opacity: 0.8,
                bgcolor: '#f9cfd0',    // Light red background
                color: '#c62828',      // Dark red text
              }}
            />
          )}
        </Box>
        <Typography variant="h5" sx={{ mt: '1rem', mb: '1rem', fontWeight: 500 }}>
          {primaryText}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={progressValue}
          sx={{
            height: '0.5rem',
            borderRadius: '0.25rem',
            opacity: 0.8,
            '& .MuiLinearProgress-bar': {
              borderRadius: '0.25rem',
              backgroundColor: '#4caf50', // Darker green progress
            },
          }}
        />
      </CardContent>
    </Card>
  );
};
