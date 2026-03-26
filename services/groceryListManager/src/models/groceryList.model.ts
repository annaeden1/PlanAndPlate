import mongoose, { Document, Schema } from 'mongoose';
import { CATEGORIES } from '../types/categories';
import { GroceryItem } from '../types/groceryList.types';

export interface IGroceryList extends Document {
  userId: string;
  mealPlanId?: string;
  items: GroceryItem[];
  createdAt: Date;
  updatedAt: Date;
}

const GroceryItemSchema = new Schema<GroceryItem>(
  {
    name: { type: String, required: true, trim: true, lowercase: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true, lowercase: true },
    category: { type: String, required: true, enum: CATEGORIES, default: 'Other' },
  },
  { _id: false },
);

const GroceryListSchema = new Schema<IGroceryList>(
  {
    userId: { type: String, required: true },
    mealPlanId: { type: String, default: null },
    items: { type: [GroceryItemSchema], default: [] },
  },
  { timestamps: true },
);

GroceryListSchema.index({ userId: 1 }, { unique: true });

export const GroceryList = mongoose.model<IGroceryList>('GroceryList', GroceryListSchema);
