import { Box, Button } from '@mui/material';

interface AuthTabsProps {
  isSignUp: boolean;
  setIsSignUp: (val: boolean) => void;
}

export function AuthTabs({ isSignUp, setIsSignUp }: AuthTabsProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: '0.5rem',
        p: '0.25rem',
        bgcolor: 'grey.100',
        borderRadius: '0.75rem',
        mb: '1.5rem',
      }}
    >
      <Button
        fullWidth
        onClick={() => setIsSignUp(false)}
        sx={{
          py: '0.75rem',
          borderRadius: '0.625rem',
          bgcolor: !isSignUp ? 'background.paper' : 'transparent',
          color: !isSignUp ? 'text.primary' : 'text.secondary',
          boxShadow: !isSignUp ? 1 : 0,
          '&:hover': {
            bgcolor: !isSignUp ? 'background.paper' : 'grey.200',
          },
        }}
      >
        Sign In
      </Button>
      <Button
        fullWidth
        onClick={() => setIsSignUp(true)}
        sx={{
          py: '0.75rem',
          borderRadius: '0.625rem',
          bgcolor: isSignUp ? 'background.paper' : 'transparent',
          color: isSignUp ? 'text.primary' : 'text.secondary',
          boxShadow: isSignUp ? 1 : 0,
          '&:hover': {
            bgcolor: isSignUp ? 'background.paper' : 'grey.200',
          },
        }}
      >
        Sign Up
      </Button>
    </Box>
  );
}
