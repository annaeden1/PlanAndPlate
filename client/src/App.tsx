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

const Page = ({ title }: { title: string }) => (
  <Box sx={{ pt: 4, textAlign: 'center' }}>
    <Typography variant="h4" fontWeight={700}>
      {title}
    </Typography>
  </Box>
);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('access-token');
          localStorage.removeItem('refresh-token');
        }
      } catch (error) {
        console.error('Auth verification failed', error);
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

  const handleAuthComplete = (token: {
    accessToken: string;
    refreshToken: string;
  }) => {
    localStorage.setItem('access-token', token.accessToken);
    localStorage.setItem('refresh-token', token.refreshToken);
    setIsAuthenticated(true);
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
        {!isAuthenticated ? (
          <Auth onAuthComplete={handleAuthComplete} />
        ) : (
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
