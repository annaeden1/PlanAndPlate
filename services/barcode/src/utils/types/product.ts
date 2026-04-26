export interface ProductNutrition {
  product_name?: string;
  brands?: string;
  quantity?: string;
  image_front_url?: string;
  ingredients_text?: string;
  ingredients_analysis_tags?: string[];
  allergens?: string;
  allergens_tags?: string[];
  nutriments?: {
    'energy-kcal_100g'?: number;
    fat_100g?: number;
    'saturated-fat_100g'?: number;
    carbohydrates_100g?: number;
    sugars_100g?: number;
    proteins_100g?: number;
    salt_100g?: number;
  };
  nutriscore_grade?: string;
  categories?: string;
  labels?: string;
  labels_tags?: string[];
  traces?: string;
  traces_tags?: string[];
}
