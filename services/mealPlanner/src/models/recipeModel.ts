import mongoose from "mongoose";    

const recipeSchema = new mongoose.Schema({
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
      id: String, 
      name: String, 
      image: String, 
      amount: String, 
      unit: String, 
      aisle: String 
    }] 
  },
});

export const Recipe = mongoose.model("Recipe", recipeSchema);