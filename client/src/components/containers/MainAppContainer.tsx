import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { GroceryListProvider } from "../../context/GroceryListContext";
import { Profile } from "@/pages/Profile";
import { GroceryList } from "../../pages/GroceryList";
import { MealPlanner } from "@/pages/MealPlanner";
import { ManualRecipes } from "@/pages/ManualRecipes";
import { RecipeDetail } from "@/pages/RecipeDetail";
import { Scanner } from '@/pages/Scanner';
import { MainLayout } from "../layout/MainLayout";
import { HomePage } from "@/pages/Home";
import { useTodayMealsStore } from "@/features/home/store/todayMealsStore";

function AppRoutes() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/", { replace: true });
  }, []);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/planner" element={<MealPlanner />} />
      <Route path="/my-recipes" element={<ManualRecipes />} />
      <Route path="/recipe/:recipeId" element={<RecipeDetail />} />
      <Route path="/cart" element={<GroceryList />} />
      <Route path="/scanner" element={<Scanner />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function MainAppContainer() {
  const loadToday = useTodayMealsStore((s) => s.loadToday);

  // Today's meals are needed app-wide (home cards, global search), not just on Home
  useEffect(() => {
    loadToday();
  }, [loadToday]);

  return (
    <BrowserRouter>
      <GroceryListProvider>
        <MainLayout>
          <AppRoutes />
        </MainLayout>
      </GroceryListProvider>
    </BrowserRouter>
  );
}
