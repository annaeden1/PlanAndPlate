import { BrowserRouter, Routes, Route } from 'react-router-dom';
import {
  CssBaseline,
  ThemeProvider,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import { MainLayout } from './components/layout/MainLayout';
import { useEffect, useState } from 'react';
import { Auth } from './features/auth/Auth';
import { theme } from './core/theme/theme';
import { Preferences } from './features/preferences/prefernces';
import { jwtDecode } from 'jwt-decode';

const Page = ({ title }: { title: string }) => (
  <Box sx={{ pt: 4, textAlign: 'center' }}>
    <Typography variant="h4" fontWeight={700}>
      {title}
    </Typography>
  </Box>
);

function App() {
  type AuthState = 'idle' | 'preferences' | 'loggedIn';

  const [authState, setAuthState] = useState<AuthState>('idle');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access-token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:8080/auth/verify', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          setAuthState('loggedIn');
        } else {
          localStorage.removeItem('access-token');
          localStorage.removeItem('refresh-token');
          setAuthState('idle');
        }
      } catch (error) {
        console.error('Auth verification failed', error);
        setAuthState('idle');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const handleAuthComplete = (
    token: {
      accessToken: string;
      refreshToken: string;
    },
    isSignUp: boolean,
  ) => {
    localStorage.setItem('access-token', token.accessToken);
    localStorage.setItem('refresh-token', token.refreshToken);

    if (isSignUp) {
      setAuthState('preferences');
    } else {
      setAuthState('loggedIn');
    }
  };

  const handleOnboardingComplete = async (onboardingData: {
    preferences: {
      diet: string[];
      allergies: string[];
      healthGoal: string;
      weeklyBudget: number;
    };
  }) => {
    const token = localStorage.getItem('access-token');

    if (!token) {
      alert('Could not find auth token. Please sign in again.');
      setAuthState('idle');
      return;
    }

    try {
      const token: string | null = localStorage.getItem('access-token');
      let decoded: { userId: string } = { userId: '' };
      if (token) {
        decoded = jwtDecode<{ userId: string }>(token);
      }
console.log('Decoded token:', decoded);
console.log('Onboarding data to send:', onboardingData);

      const response = await fetch(
        `http://localhost:8080/userManagement/${decoded.userId}/preferences`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(onboardingData),
        },
      );

      if (response.ok) {
        setAuthState('loggedIn');
      } else {
        const data = await response.json();
        alert(data.message || 'Could not complete onboarding.');
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      alert('Network error while completing onboarding.');
    }
  };

  const renderScreen = () => {
    return (
      <>
        <BrowserRouter>
          <MainLayout>
            <Routes>
              <Route path="/" element={<Page title="🏠 Home" />} />
              <Route path="/planner" element={<Page title="📅 Planner" />} />
              <Route path="/cart" element={<Page title="🛒 Cart" />} />
              <Route path="/scanner" element={<Page title="📷 Scanner" />} />
              <Route path="/profile" element={<Page title="👤 Profile" />} />
            </Routes>
          </MainLayout>
        </BrowserRouter>
      </>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        {authState === 'idle' && <Auth onAuthComplete={handleAuthComplete} />}
        {authState === 'preferences' && (
          <Preferences onComplete={handleOnboardingComplete} />
        )}
        {authState === 'loggedIn' && (
          <>
            <Box component="main" sx={{ width: '100%' }}>
              {renderScreen()}
            </Box>
          </>
        )}
      </Box>
    </ThemeProvider>
  );
}

export default App;
