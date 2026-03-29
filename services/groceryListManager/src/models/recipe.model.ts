import mongoose, { Schema, Document } from 'mongoose';

interface RecipeIngredient {
  id: string;
  image: string;
  name: string;
  amount: number;
  unit: string;
  aisle: string;
}

export interface IRecipe extends Document {
  name: string;
  image: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  servings: number;
  readyInMinutes: number;
  diets: string[];
  isLiked: boolean;
  instructions: {
    steps: string[];
    ingredients: RecipeIngredient[];
  };
}

const RecipeIngredientSchema = new Schema<RecipeIngredient>(
  {
    id: { type: String },
    image: { type: String },
    name: { type: String, required: true },
    amount: { type: Number },
    unit: { type: String },
    aisle: { type: String },
  },
  { _id: false },
);

const RecipeSchema = new Schema<IRecipe>(
  {
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
      ingredients: [RecipeIngredientSchema],
    },
  },
  { collection: 'recipes' },
);

export const Recipe = mongoose.model<IRecipe>('Recipe', RecipeSchema);
