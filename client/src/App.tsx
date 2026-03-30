import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CssBaseline, ThemeProvider, Typography, Box } from '@mui/material';
import { MainLayout } from './components/layout/MainLayout';
import { GroceryList } from './pages/GroceryList';
import { GroceryListProvider } from './context/GroceryListContext';
import { theme } from './core/theme/theme';
import { Scanner } from './pages/Scanner/Scanner';

const Page = ({ title }: { title: string }) => (
  <Box sx={{ pt: 4, textAlign: 'center' }}>
    <Typography variant="h4" fontWeight={700}>
      {title}
    </Typography>
  </Box>
);

function App() {
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
    </ThemeProvider>
  );
}

export default App;
