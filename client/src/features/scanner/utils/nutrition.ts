import type { NutritionItem, ProductData } from '../../shared';

export const DAILY_VALUES = {
  calories: 2000,
  protein: 50,
  carbs: 300,
  fat: 70,
  sugar: 50,
};

export const mapNutritionFacts = (data: ProductData): NutritionItem[] => {
  const nutriments = data?.nutritionData?.nutriments || {};

  const nutritionItems: (NutritionItem | null)[] = [
    nutriments['energy-kcal_100g']
      ? {
          label: 'Calories',
          value: `${nutriments['energy-kcal_100g']} kcal`,
          percent: Math.round(
            (nutriments['energy-kcal_100g'] / DAILY_VALUES.calories) * 100,
          ),
        }
      : null,
    nutriments['proteins_100g']
      ? {
          label: 'Protein',
          value: `${nutriments['proteins_100g']}g`,
          percent: Math.round(
            (nutriments['proteins_100g'] / DAILY_VALUES.protein) * 100,
          ),
        }
      : null,
    nutriments['carbohydrates_100g']
      ? {
          label: 'Carbs',
          value: `${nutriments['carbohydrates_100g']}g`,
          percent: Math.round(
            (nutriments['carbohydrates_100g'] / DAILY_VALUES.carbs) * 100,
          ),
        }
      : null,
    nutriments['fat_100g']
      ? {
          label: 'Fat',
          value: `${nutriments['fat_100g']}g`,
          percent: Math.round(
            (nutriments['fat_100g'] / DAILY_VALUES.fat) * 100,
          ),
        }
      : null,
    nutriments['sugars_100g']
      ? {
          label: 'Sugar',
          value: `${nutriments['sugars_100g']}g`,
          percent: Math.round(
            (nutriments['sugars_100g'] / DAILY_VALUES.sugar) * 100,
          ),
        }
      : null,
  ];

  return nutritionItems.filter((item): item is NutritionItem => item !== null);
};

export const formatTags = (tags: string[]): string[] =>
  tags.map((tag) => tag.replace('en:', '').replace(/-/g, ' '));
