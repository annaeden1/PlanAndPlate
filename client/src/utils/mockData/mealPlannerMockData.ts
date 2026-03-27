import type { MealPlanItem } from "../types/mealPlanner";

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const WEEKLY_MEALS: Record<string, MealPlanItem[]> = {
  Mon: [
    {
      id: 1,
      name: "Avocado Toast",
      type: "Breakfast",
      calories: 420,
      image:
        "https://images.unsplash.com/photo-1676471970358-1cff04452e7b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicmVha2Zhc3QlMjBhdm9jYWRvJTIwdG9hc3R8ZW58MXx8fHwxNzY2MzAyMzE3fDA&ixlib=rb-4.1.0&q=80&w=1080",
    },
    {
      id: 2,
      name: "Mediterranean Pasta",
      type: "Lunch",
      calories: 580,
      image:
        "https://images.unsplash.com/photo-1573821201069-dbf297ca410a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXN0YSUyMGx1bmNoJTIwZm9vZHxlbnwxfHx8fDE3NjYzNDQwMDB8MA&ixlib=rb-4.1.0&q=80&w=1080",
    },
    {
      id: 3,
      name: "Grilled Salmon",
      type: "Dinner",
      calories: 650,
      image:
        "https://images.unsplash.com/photo-1580959375944-abd7e991f971?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmlsbGVkJTIwc2FsbW9uJTIwZGlubmVyfGVufDF8fHx8MTc2NjMwMjc3N3ww&ixlib=rb-4.1.0&q=80&w=1080",
    },
  ],
  Tue: [
    {
      id: 4,
      name: "Protein Bowl",
      type: "Breakfast",
      calories: 390,
      image:
        "https://images.unsplash.com/photo-1676300186673-615bcc8d5d68?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwbWVhbCUyMGJvd2wlMjBmcmVzaHxlbnwxfHx8fDE3NjYzNDM5OTl8MA&ixlib=rb-4.1.0&q=80&w=1080",
    },
    {
      id: 5,
      name: "Veggie Wrap",
      type: "Lunch",
      calories: 450,
      image:
        "https://images.unsplash.com/photo-1573821201069-dbf297ca410a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXN0YSUyMGx1bmNoJTIwZm9vZHxlbnwxfHx8fDE3NjYzNDQwMDB8MA&ixlib=rb-4.1.0&q=80&w=1080",
    },
    {
      id: 6,
      name: "Chicken Stir-Fry",
      type: "Dinner",
      calories: 620,
      image:
        "https://images.unsplash.com/photo-1580959375944-abd7e991f971?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmlsbGVkJTIwc2FsbW9uJTIwZGlubmVyfGVufDF8fHx8MTc2NjMwMjc3N3ww&ixlib=rb-4.1.0&q=80&w=1080",
    },
  ],
  Wed: [],
  Thu: [],
  Fri: [],
  Sat: [],
  Sun: [],
};