import axios from 'axios';
import { ProductNutrition } from '../utils/types/product';

export const fetchProductByBarcode = async (
  barcode: string,
): Promise<ProductNutrition | null> => {
  const fields = [
    'product_name',
    'brands',
    'quantity',
    'image_front_url',
    'nutriments.energy-kcal_100g',
    'nutriments.fat_100g',
    'nutriments.saturated-fat_100g',
    'nutriments.carbohydrates_100g',
    'nutriments.sugars_100g',
    'nutriments.proteins_100g',
    'nutriments.salt_100g',
    'ingredients_text',
    'allergens',
    'ingredients_analysis_tags',
    'traces',
    'categories',
    'labels',
    'nutriscore_grade',
  ].join(',');

  const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json?fields=${fields}`;

  const response = await axios.get(url);

  return response.data.status === 1 ? response.data.product : null;
};
