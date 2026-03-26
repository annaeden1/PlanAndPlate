import mongoose from "mongoose";    

const recipeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String },
  calories: { type: Number },
  protein: { type: Number },
  fat: { type: Number },
  carbs: { type: Number },
  isLiked: { type: Boolean, default: false },
  instructions: { steps: [{ type: String }] , ingredients: [{ id: String, name: String, image: String, amount: String, unit: String }] },
});

export const Recipe = mongoose.model("Recipe", recipeSchema);