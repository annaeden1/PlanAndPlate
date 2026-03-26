import mongoose from "mongoose";

const mealPlanSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  days: [{
    date: { type: Date, required: true },
    meals: [{
      breakfast: { recipeId: String, name: String, calories: Number},
      lunch: { recipeId: String, name: String, calories: Number},
      dinner: { recipeId: String, name: String, calories: Number},
    }],
  }],
  nutritionSummary: {
    calories: Number,
    protein: Number,
    fat: Number,
    carbs: Number,
  },
});

export const MealPlan = mongoose.model("MealPlan", mealPlanSchema);