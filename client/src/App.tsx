import { Box, CircularProgress, CssBaseline, ThemeProvider } from '@mui/material';
import { MainAppContainer } from './components/containers/MainAppContainer';
import { theme } from './core/theme/theme';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Auth } from './pages/Auth';
import { Preferences } from './pages/Preferences';

function App() {
  const { authState, isLoading, handleAuthComplete, handleOnboardingComplete } = useAuth();

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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        {authState === 'idle' && (
          <Auth onAuthComplete={handleAuthComplete} />
        )}
        {authState === 'preferences' && (
          <Preferences onComplete={handleOnboardingComplete} />
        )}
        {authState === 'loggedIn' && <MainAppContainer />}
      </Box>
    </ThemeProvider>
  );
}

export default App;
