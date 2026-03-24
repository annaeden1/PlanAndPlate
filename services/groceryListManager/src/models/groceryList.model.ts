import mongoose, { Document, Schema } from 'mongoose';
import { Category, CATEGORIES } from '../config/categories';

// ─── Item sub-document ───────────────────────────────────────────────────────
export interface IGroceryItem {
  name: string;
  quantity: number;
  unit: string;
  category: Category;
}

// ─── Grocery List document ───────────────────────────────────────────────────
export interface IGroceryList extends Document {
  userId: string;
  mealPlanId?: string;
  items: IGroceryItem[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schemas ─────────────────────────────────────────────────────────────────
const GroceryItemSchema = new Schema<IGroceryItem>(
  {
    name: { type: String, required: true, trim: true, lowercase: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true, lowercase: true },
    category: { type: String, required: true, enum: CATEGORIES, default: 'Other' },
  },
  { _id: false }, // embedded subdoc, no separate _id
);

const GroceryListSchema = new Schema<IGroceryList>(
  {
    userId: { type: String, required: true, index: true },
    mealPlanId: { type: String, default: null },
    items: { type: [GroceryItemSchema], default: [] },
  },
  { timestamps: true },
);

// One grocery list per user (upsert when saving)
GroceryListSchema.index({ userId: 1 }, { unique: true });

export const GroceryList = mongoose.model<IGroceryList>('GroceryList', GroceryListSchema);
