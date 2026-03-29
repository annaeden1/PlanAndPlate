import mongoose, { Document, Schema } from 'mongoose';
import { GroceryItem } from '../types/groceryList.types';
import { GroceryItemSchema } from './groceryItem.model';

export interface IGroceryList extends Document {
  userId: mongoose.Types.ObjectId;
  mealPlanId?: string;
  items: GroceryItem[];
  createdAt: Date;
  updatedAt: Date;
}

const GroceryListSchema = new Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    mealPlanId: { type: String, default: null },
    items: { type: [GroceryItemSchema], default: [] },
  },
  { timestamps: true },
);

GroceryListSchema.index({ userId: 1 }, { unique: true });

export const GroceryList = mongoose.model<IGroceryList>('GroceryList', GroceryListSchema);
