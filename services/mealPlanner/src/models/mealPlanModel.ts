import mongoose from 'mongoose';

export interface IMealPlanMeal {
  recipeId: string;
  name: string;
  calories: number;
  image?: string;
}

export interface IMealPlanDay {
  date: Date;
  breakfast: IMealPlanMeal;
  lunch: IMealPlanMeal;
  dinner: IMealPlanMeal;
}

export interface INutritionSummary {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface IMealPlan {
  _id?: mongoose.Types.ObjectId;
  userId: string;
  days: IMealPlanDay[];
  nutritionSummary: INutritionSummary;
}

const mealPlanSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  days: [
    {
      date: { type: Date, required: true },
      breakfast: {
        recipeId: String,
        name: String,
        calories: Number,
        image: String,
      },
      lunch: {
        recipeId: String,
        name: String,
        calories: Number,
        image: String,
      },
      dinner: {
        recipeId: String,
        name: String,
        calories: Number,
        image: String,
      },
      proteinTargetMet: Boolean,
    },
  ],
  nutritionSummary: {
    calories: Number,
    protein: Number,
    fat: Number,
    carbs: Number,
  },
});

export const MealPlan = mongoose.model<IMealPlan & mongoose.Document>(
  'MealPlan',
  mealPlanSchema,
);
