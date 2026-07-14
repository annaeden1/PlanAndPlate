import { Schema, model } from 'mongoose';

/** A catalog snapshot row ingested from a transparency-law price feed. */
export interface ChainCatalogItemDoc {
  chainId: string;
  code: string; // ItemCode (EAN barcode)
  name: string; // Hebrew product name
  price: number; // ILS
  updatedAt: Date;
}

const ChainCatalogItemSchema = new Schema<ChainCatalogItemDoc>({
  chainId: { type: String, required: true },
  code: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  updatedAt: { type: Date, required: true, default: Date.now },
});

ChainCatalogItemSchema.index({ chainId: 1, code: 1 }, { unique: true });
ChainCatalogItemSchema.index({ chainId: 1, name: 1 });

export const ChainCatalogItem = model<ChainCatalogItemDoc>(
  'ChainCatalogItem',
  ChainCatalogItemSchema,
);
