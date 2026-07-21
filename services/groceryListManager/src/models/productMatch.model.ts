import { Schema, model } from 'mongoose';

// Cache of a resolved grocery item -> chain product mapping. It stores the
// match (code/barcode + name + confidence), never a price — prices are always
// fetched live from the chain, only the expensive LLM resolution is cached.
export interface ProductMatchDoc {
  itemName: string;
  chainId: string;
  hebrewQuery: string;
  code: string | null;
  matchedName: string | null;
  confidence: number;
  resolvedAt: Date;
}

const ProductMatchSchema = new Schema<ProductMatchDoc>({
  itemName: { type: String, required: true, trim: true, lowercase: true },
  chainId: { type: String, required: true },
  hebrewQuery: { type: String, required: true },
  code: { type: String, default: null },
  matchedName: { type: String, default: null },
  confidence: { type: Number, required: true, min: 0, max: 1 },
  resolvedAt: { type: Date, required: true, default: Date.now },
});

ProductMatchSchema.index({ itemName: 1, chainId: 1 }, { unique: true });

export const ProductMatch = model<ProductMatchDoc>('ProductMatch', ProductMatchSchema);
