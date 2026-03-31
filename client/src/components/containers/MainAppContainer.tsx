import { Box, Typography } from '@mui/material';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { GroceryListProvider } from '../../context/GroceryListContext';
import { Profile } from '../../features/profile/Profile';
import { GroceryList } from '../../pages/GroceryList';
import { Scanner } from '../../pages/Scanner/Scanner';
import { MainLayout } from '../layout/MainLayout';
import { HomePage } from '../../pages/Home/HomePage';

const Page = ({ title }: { title: string }) => (
  <Box sx={{ pt: 4, textAlign: 'center' }}>
    <Typography variant="h4" fontWeight={700}>
      {title}
    </Typography>
  </Box>
);

export function MainAppContainer() {
  return (
    <BrowserRouter>
      <GroceryListProvider>
        <MainLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/planner" element={<Page title="📅 Planner" />} />
            <Route path="/cart" element={<GroceryList />} />
            <Route path="/scanner" element={<Scanner />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </MainLayout>
      </GroceryListProvider>
    </BrowserRouter>
  );
}
