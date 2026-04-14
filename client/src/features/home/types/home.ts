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
