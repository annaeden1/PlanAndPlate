export interface Meal {
  id: string;
  name: string;
  image: string;
  mealType: "Breakfast" | "Lunch" | "Dinner";
  time: string;
  calories: number;
  completed: boolean;
}

export interface CalorieProgress {
  consumed: number;
  target: number;
}

export interface GroceryListStatus {
  checkedItems: number;
  totalItems: number;
}

export const mockCalorieProgress: CalorieProgress = {
  consumed: 420,
  target: 1650,
};

export const mockGroceryListStatus: GroceryListStatus = {
  checkedItems: 2,
  totalItems: 5,
};

export const mockMeals: Meal[] = [
  {
    id: "1",
    name: "Avocado Toast & Eggs",
    image:
      "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=120&h=120&fit=crop",
    mealType: "Breakfast",
    time: "8:00 AM",
    calories: 420,
    completed: true,
  },
  {
    id: "2",
    name: "Mediterranean Pasta Bowl",
    image:
      "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=120&h=120&fit=crop",
    mealType: "Lunch",
    time: "12:30 PM",
    calories: 580,
    completed: false,
  },
  {
    id: "3",
    name: "Grilled Salmon & Veggies",
    image:
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=120&h=120&fit=crop",
    mealType: "Dinner",
    time: "6:30 PM",
    calories: 650,
    completed: false,
  },
];
