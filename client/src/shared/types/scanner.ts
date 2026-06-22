export interface NutritionItem {
  label: string;
  value: string;
  percent: number;
}

export interface PreferenceMatch {
  label: string;
  status: 'match' | 'mismatch' | 'unknown';
}

export interface ProductAlternative {
  productName: string;
  brand: string;
  reason: string;
  source: 'openfoodfacts' | 'ai';
  verified: boolean;
  productData?: {
    image_front_url?: string;
    product_name?: string;
    brands?: string;
    quantity?: string;
  };
}

export interface ProductData {
  id: string;
  code: string;
  product_name?: string;
  brands?: string;
  quantity?: string;
  preferenceMatches?: PreferenceMatch[];
  alternatives?: ProductAlternative[];
  nutritionData?: {
    image_front_url?: string;
    product_name?: string;
    brands?: string;
    quantity?: string;
    ingredients_analysis_tags?: string[];
    allergens_tags?: string[];
    traces_tags?: string[];
    labels_tags?: string[];
    nutriscore_grade?: 'a' | 'b' | 'c' | 'd' | 'e' | 'unknown';
    nutriments?: {
      'energy-kcal_100g'?: number;
      proteins_100g?: number;
      carbohydrates_100g?: number;
      fat_100g?: number;
      sugars_100g?: number;
      [key: string]: number | undefined;
    };
  };
}
