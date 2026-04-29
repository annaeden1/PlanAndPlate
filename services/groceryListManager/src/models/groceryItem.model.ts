import { Schema } from 'mongoose';
import { CATEGORIES } from '../types/categories';
import { GroceryItem } from '../types/groceryList.types';

export const GroceryItemSchema = new Schema<GroceryItem>(
  {
    name: { type: String, required: true, trim: true, lowercase: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true, lowercase: true },
    inventoryQuantity: { type: Number, required: true, min: 0, default: 0 },
    category: { type: String, required: true, enum: CATEGORIES, default: 'Other' },
    checked: { type: Boolean, required: true, default: false },
    marketUnit: { type: String, trim: true, lowercase: true },
    marketQuantity: { type: Number, min: 0 },
    marketSize: { type: String, trim: true },
    marketSizeInRecipeUnits: { type: Number, min: 0 },
  },
  { _id: false },
);
