import { Schema, model } from 'mongoose';

export interface PriceMatchDoc {
  itemName: string;
  chainId: string;
  hebrewQuery: string;
  code: string | null;
  matchedName: string | null;
  confidence: number;
  resolvedAt: Date;
}

const PriceMatchSchema = new Schema<PriceMatchDoc>({
  itemName: { type: String, required: true, trim: true, lowercase: true },
  chainId: { type: String, required: true },
  hebrewQuery: { type: String, required: true },
  code: { type: String, default: null },
  matchedName: { type: String, default: null },
  confidence: { type: Number, required: true, min: 0, max: 1 },
  resolvedAt: { type: Date, required: true, default: Date.now },
});

PriceMatchSchema.index({ itemName: 1, chainId: 1 }, { unique: true });

export const PriceMatch = model<PriceMatchDoc>('PriceMatch', PriceMatchSchema);
