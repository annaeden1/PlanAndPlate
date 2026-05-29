export interface MealPlanItem {
  id: number;
  name: string;
  type: string;
  calories: number;
  image: string;
}

export interface MealPlan {
  date: string;
  meals: MealPlanItem[];
}

export interface MealSlot {
  recipeId: string;
  name: string;
  calories: number;
}

export interface ApiMealPlanDay {
  date: string;
  breakfast: MealSlot;
  morningSnack?: MealSlot;
  lunch: MealSlot;
  afternoonSnack?: MealSlot;
  dinner: MealSlot;
}

export interface ApiMealPlan {
  _id?: string;
  userId: string;
  days: ApiMealPlanDay[];
}

export interface Ingredient {
  id: number;
  name: string;
  image?: string;
  amount: number;
  unit?: string;
  aisle?: string;
}

export interface ApiRecipe {
  _id?: string;
  originRecipeId: string;
  name: string;
  image?: string;
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  servings?: number;
  readyInMinutes?: number;
  diets?: string[];
  isLiked?: boolean;
  instructions?: {
    steps: string[];
    ingredients: Ingredient[];
  };
}

export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface RecipeSuggestion {
  originRecipeId: string;
  name: string;
  image?: string;
  calories?: number;
  readyInMinutes?: number;
  score: number;
  why?: string;
}