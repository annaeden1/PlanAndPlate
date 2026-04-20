import mongoose from "mongoose";

const userFavoritesSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  likedRecipeIds: [{ type: String }],
});
  
export const UserFavorites = mongoose.model(
  "UserFavorites",
  userFavoritesSchema
);
