import { CssBaseline, ThemeProvider, Box, CircularProgress } from '@mui/material';
import { useAuth } from './hooks/useAuth';
import { theme } from './core/theme/theme';
import { AuthContainer } from './components/containers/AuthContainer';
import { PreferencesContainer } from './components/containers/PreferencesContainer';
import { MainAppContainer } from './components/containers/MainAppContainer';

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
          <AuthContainer onAuthComplete={handleAuthComplete} />
        )}
        {authState === 'preferences' && (
          <PreferencesContainer onComplete={handleOnboardingComplete} />
        )}
        {authState === 'loggedIn' && <MainAppContainer />}
      </Box>
    </ThemeProvider>
  );
}

export default App;
