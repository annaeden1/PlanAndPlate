import { Box, Typography } from '@mui/material';

interface StatCardsProps {
  mealsLogged: number;
  weeksActive: number;
}

export function StatCards({ mealsLogged, weeksActive }: StatCardsProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-around',
        gap: '2rem',
        pt: '1rem',
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h4">{mealsLogged}</Typography>
        <Typography variant="caption" color="text.secondary">
          Meals Logged
        </Typography>
      </Box>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h4">{weeksActive}</Typography>
        <Typography variant="caption" color="text.secondary">
          Weeks Active
        </Typography>
      </Box>
    </Box>
  );
}
