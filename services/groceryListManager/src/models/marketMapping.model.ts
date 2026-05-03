import mongoose, { Document, Schema } from 'mongoose';

export interface IMarketMapping extends Document {
  name: string;
  unit: string;
  marketUnit: string | null;
  marketQuantity: number | null;
  marketSize: string | null;
  marketSizeInRecipeUnits: number | null;
  promptVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const MarketMappingSchema = new Schema<IMarketMapping>(
  {
    name: { type: String, required: true, trim: true, lowercase: true },
    unit: { type: String, required: true, trim: true, lowercase: true },
    marketUnit: { type: String, default: null, trim: true, lowercase: true },
    marketQuantity: { type: Number, default: null, min: 0 },
    marketSize: { type: String, default: null, trim: true },
    marketSizeInRecipeUnits: { type: Number, default: null, min: 0 },
    promptVersion: { type: Number, required: true, default: 1 },
  },
  { timestamps: true },
);

MarketMappingSchema.index({ name: 1, unit: 1, promptVersion: 1 }, { unique: true });

export const MarketMapping = mongoose.model<IMarketMapping>(
  'MarketMapping',
  MarketMappingSchema,
);
