import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Typography, Box } from '@mui/material';
import { MainLayout } from '../layout/MainLayout';
import { GroceryListProvider } from '../../context/GroceryListContext';
import { GroceryList } from '../../pages/GroceryList';
import { MealPlanner } from '../../pages/mealPlanner';
import { RecipeDetail } from '../../pages/recipeDetail';

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
      <MainLayout>
        <Routes>
          <Route path="/" element={<Page title="🏠 Home" />} />
            <Route path="/planner" element={<MealPlanner />} />
            <Route path="/recipe" element={<RecipeDetail />} />          <Route
            path="/cart"
            element={
              <GroceryListProvider>
                <GroceryList />
              </GroceryListProvider>
            }
          />
          <Route path="/scanner" element={<Page title="📷 Scanner" />} />
          <Route path="/profile" element={<Page title="👤 Profile" />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}
