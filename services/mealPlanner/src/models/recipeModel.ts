import mongoose from "mongoose";

export interface IRecipeIngredient {
  id: number;
  name: string;
  image?: string;
  amount: number;
  unit?: string;
  aisle?: string;
}

export interface IRecipeInstructions {
  steps: string[];
  ingredients: IRecipeIngredient[];
}

export interface IRecipe {
  _id?: mongoose.Types.ObjectId;
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
  instructions?: IRecipeInstructions;
}

const recipeSchema = new mongoose.Schema({
  originRecipeId: { type: String, required: true }, // ID from Spoonacular or internal
  name: { type: String, required: true },
  image: { type: String },
  calories: { type: Number },
  protein: { type: Number },
  fat: { type: Number },
  carbs: { type: Number },
  servings: { type: Number },
  readyInMinutes: { type: Number },
  diets: [{ type: String }],
  isLiked: { type: Boolean, default: false },
  instructions: {
    steps: [{ type: String }],
    ingredients: [{
      id: Number,
      name: String,
      image: String,
      amount: Number,
      unit: String,
      aisle: String,
    }],
  },
});

export const Recipe = mongoose.model<IRecipe & mongoose.Document>("Recipe", recipeSchema);