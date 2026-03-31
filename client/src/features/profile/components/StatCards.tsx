import { Box, Typography } from '@mui/material';

export function StatCards() {
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
      {/* TODO: currently mock, fetch from server in future tasks*/}
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h4">127</Typography>
        <Typography variant="caption" color="text.secondary">
          Meals Logged
        </Typography>
      </Box>
      {/* TODO: currently mock, fetch from server in future tasks*/}
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h4">18</Typography>
        <Typography variant="caption" color="text.secondary">
          Weeks Active
        </Typography>
      </Box>
    </Box>
  );
}
