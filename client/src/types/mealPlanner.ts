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
