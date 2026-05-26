import { Box, Card, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import type { PreferenceMatch } from '@/shared';
import HelpIcon from '@mui/icons-material/Help';

export interface PreferenceMatchesCardProps {
  preferenceMatches: PreferenceMatch[];
}

export const PreferenceMatchesCard = ({
  preferenceMatches,
}: PreferenceMatchesCardProps) => {
  const safePreferences = preferenceMatches || [];

  if (safePreferences.length === 0) {
    return null;
  }

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
        {safePreferences.map((item) => {
          let icon = null;

          if (item.status === 'match') {
            icon = (
              <CheckCircleIcon
                sx={{ fontSize: '1.25rem', color: 'success.main' }}
              />
            );
          } else if (item.status === 'mismatch') {
            icon = (
              <ErrorIcon sx={{ fontSize: '1.25rem', color: 'error.main' }} />
            );
          } else {
            icon = (
              <HelpIcon sx={{ fontSize: '1.25rem', color: 'warning.main' }} />
            );
          }

          return (
            <Box
              key={item.label}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="body2">{item.label}</Typography>
              {icon}
            </Box>
          );
        })}
      </Box>
    </Card>
  );
};
