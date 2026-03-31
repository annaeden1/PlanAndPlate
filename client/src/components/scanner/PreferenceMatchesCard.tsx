import { Box, Card, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import type { PreferenceMatch } from '../../shared';

export interface PreferenceMatchesCardProps {
  preferenceMatches: PreferenceMatch[];
}

export const PreferenceMatchesCard = ({
  preferenceMatches,
}: PreferenceMatchesCardProps) => {
  const safePreferences = preferenceMatches || [];

  return (
    <Card sx={{ p: '1.5rem', mb: '1rem' }}>
      <Typography variant="h4" sx={{ mb: '1rem' }}>
        Matches Your Preferences
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        {safePreferences.map((item) => (
          <Box
            key={item.label}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="body2">{item.label}</Typography>
            {item.match ? (
              <CheckCircleIcon
                sx={{ fontSize: '1.25rem', color: 'primary.main' }}
              />
            ) : (
              <ErrorIcon
                sx={{ fontSize: '1.25rem', color: 'text.secondary' }}
              />
            )}
          </Box>
        ))}
      </Box>
    </Card>
  );
};
