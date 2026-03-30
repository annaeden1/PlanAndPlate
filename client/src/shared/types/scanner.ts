export interface NutritionItem {
  label: string;
  value: string;
  percent: number;
}

export interface PreferenceMatch {
  label: string;
  match: boolean;
}

export interface ProductData {
  id: string;
  code: string;
  product_name?: string;
  brands?: string;
  quantity?: string;
  matchesPreferences?: boolean;
  nutritionData?: {
    image_front_url?: string;
    product_name?: string;
    brands?: string;
    quantity?: string;
    ingredients_analysis_tags?: string[];
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
