import mongoose, { Schema, Document } from 'mongoose';

interface RecipeIngredient {
  id: number;
  image: string;
  name: string;
  amount: number;
  unit: string;
}

export interface IRecipe extends Document<number> {
  _id: number;
  name: string;
  image: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  isLiked: boolean;
  instructions: {
    steps: string[];
    ingredients: RecipeIngredient[];
  };
}

const RecipeIngredientSchema = new Schema<RecipeIngredient>(
  {
    id: { type: Number, required: true },
    image: { type: String },
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    unit: { type: String, required: true },
  },
  { _id: false },
);

const RecipeSchema = new Schema<IRecipe>(
  {
    _id: { type: Number },
    name: { type: String, required: true },
    image: { type: String },
    calories: { type: Number },
    protein: { type: Number },
    fat: { type: Number },
    carbs: { type: Number },
    isLiked: { type: Boolean, default: false },
    instructions: {
      steps: [{ type: String }],
      ingredients: [RecipeIngredientSchema],
    },
  },
  { collection: 'recipes' },
);

export const Recipe = mongoose.model<IRecipe>('Recipe', RecipeSchema);
