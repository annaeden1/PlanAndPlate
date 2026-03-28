import { useState } from 'react';
import { Box, Card, CardContent, Typography, Button } from '@mui/material';
import AppleIcon from '@mui/icons-material/Apple';
import { AuthForm } from './components/AuthForm';
import { AuthTabs } from './components/AuthTabs';

interface AuthProps {
  onAuthComplete: (formData: any) => void;
}

export function Auth({ onAuthComplete }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent, formData: any) => {
    e.preventDefault();

    const endpoint = isSignUp ? '/auth/signup' : '/auth/signin';

    try {
      const response = await fetch(`http://localhost:8080${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        onAuthComplete({
          accessToken: data.tokens.token,
          refreshToken: data.tokens.refreshToken,
        });
      } else {
        alert(data.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Network error:', error);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          'linear-gradient(135deg, rgba(62, 180, 137, 0.1) 0%, #ffffff 50%, rgba(255, 143, 90, 0.05) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: '1.5rem',
        py: '3rem',
      }}
    >
      <Box sx={{ width: '100%', maxWidth: '28rem' }}>
        <Box sx={{ textAlign: 'center', mb: '2rem' }}>
          <Box
            sx={{
              width: '5rem',
              height: '5rem',
              bgcolor: 'primary.main',
              borderRadius: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: '1rem',
              boxShadow: 3,
            }}
          >
            <AppleIcon
              sx={{ fontSize: '3rem', color: 'primary.contrastText' }}
            />
          </Box>
          <Typography variant="h1" gutterBottom>
            Plan & Plate
          </Typography>
          <Typography color="text.secondary">
            {isSignUp
              ? 'Start your healthy eating journey'
              : 'Welcome back! Ready to eat healthy?'}
          </Typography>
        </Box>

        <Card
          elevation={6}
          sx={{ p: '2rem', borderRadius: '0.75rem', border: 'none' }}
        >
          <CardContent sx={{ p: 0 }}>
            <AuthTabs isSignUp={isSignUp} setIsSignUp={setIsSignUp} />
            <AuthForm isSignUp={isSignUp} onSubmit={handleSubmit} />
          </CardContent>
        </Card>

        <Box sx={{ mt: '1.5rem', textAlign: 'center' }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: '0.75rem' }}
          >
            Want to explore first?
          </Typography>
          <Button variant="text" color="primary" onClick={onAuthComplete}>
            Continue as Guest →
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
