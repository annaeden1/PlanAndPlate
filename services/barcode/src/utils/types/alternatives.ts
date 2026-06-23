import { type ProductNutrition } from './product';

export type SuggestedAlternative = {
  productName: string;
  brand: string;
  reason: string;
};

export type ProductAlternative = {
  productName: string;
  brand: string;
  reason: string;
  source: 'openfoodfacts' | 'ai';
  verified: boolean;
  productData?: ProductNutrition;
};
