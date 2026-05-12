import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { GroceryListProvider } from "../../context/GroceryListContext";
import { MealPlannerProvider } from "../../context/MealPlannerContext";
import { Profile } from "@/pages/Profile";
import { GroceryList } from "../../pages/GroceryList";
import { MealPlanner } from "@/pages/MealPlanner";
import { RecipeDetail } from "@/pages/RecipeDetail";
import { Scanner } from '@/pages/Scanner';
import { MainLayout } from "../layout/MainLayout";
import { HomePage } from "@/pages/Home";

function AppRoutes() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/", { replace: true });
  }, []);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/planner" element={<MealPlanner />} />
      <Route path="/recipe/:recipeId" element={<RecipeDetail />} />
      <Route path="/cart" element={<GroceryList />} />
      <Route path="/scanner" element={<Scanner />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function MainAppContainer() {
  return (
    <BrowserRouter>
      <GroceryListProvider>
      <MealPlannerProvider>
        <MainLayout>
          <AppRoutes />
        </MainLayout>
      </MealPlannerProvider>
      </GroceryListProvider>
    </BrowserRouter>
  );
}
