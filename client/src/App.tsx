import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CssBaseline, ThemeProvider, Typography, Box, CircularProgress } from '@mui/material';
import { MainLayout } from './components/layout/MainLayout';
import { GroceryList } from './pages/GroceryList';
import { GroceryListProvider } from './context/GroceryListContext';
import { theme } from './core/theme/theme';
import { Scanner } from './pages/Scanner/Scanner';
import { useAuth } from './hooks/useAuth';
import { PreferencesContainer } from './components/containers/PreferencesContainer';
import { MainAppContainer } from './components/containers/MainAppContainer';
import { AuthContainer } from './components/containers/AuthContainer';

const Page = ({ title }: { title: string }) => (
  <Box sx={{ pt: 4, textAlign: 'center' }}>
    <Typography variant="h4" fontWeight={700}>
      {title}
    </Typography>
  </Box>
);

function App() {
  const { authState, isLoading, handleAuthComplete, handleOnboardingComplete } =
    useAuth();

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
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Page title="🏠 Home" />} />
            <Route path="/planner" element={<Page title="📅 Planner" />} />
            <Route
              path="/cart"
              element={
                <GroceryListProvider>
                  <GroceryList />
                </GroceryListProvider>
              }
            />
            <Route path="/scanner" element={<Scanner />} />
            <Route path="/profile" element={<Page title="👤 Profile" />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
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
