import type { NutritionItem, ProductData } from '../shared';

export const DAILY_VALUES = {
  calories: 2000,
  protein: 50,
  carbs: 300,
  fat: 70,
  sugar: 50,
};

export const mapNutritionFacts = (data: ProductData): NutritionItem[] => {
  const n = data?.nutritionData?.nutriments || {};

  const nutritionItems: (NutritionItem | null)[] = [
    n['energy-kcal_100g']
      ? {
          label: 'Calories',
          value: `${n['energy-kcal_100g']} kcal`,
          percent: Math.round(
            (n['energy-kcal_100g'] / DAILY_VALUES.calories) * 100,
          ),
        }
      : null,
    n['proteins_100g']
      ? {
          label: 'Protein',
          value: `${n['proteins_100g']}g`,
          percent: Math.round(
            (n['proteins_100g'] / DAILY_VALUES.protein) * 100,
          ),
        }
      : null,
    n['carbohydrates_100g']
      ? {
          label: 'Carbs',
          value: `${n['carbohydrates_100g']}g`,
          percent: Math.round(
            (n['carbohydrates_100g'] / DAILY_VALUES.carbs) * 100,
          ),
        }
      : null,
    n['fat_100g']
      ? {
          label: 'Fat',
          value: `${n['fat_100g']}g`,
          percent: Math.round((n['fat_100g'] / DAILY_VALUES.fat) * 100),
        }
      : null,
    n['sugars_100g']
      ? {
          label: 'Sugar',
          value: `${n['sugars_100g']}g`,
          percent: Math.round((n['sugars_100g'] / DAILY_VALUES.sugar) * 100),
        }
      : null,
  ];

  return nutritionItems.filter((item): item is NutritionItem => item !== null);
};

export const formatTags = (tags: string[]): string[] =>
  tags.map((tag) => tag.replace('en:', '').replace(/-/g, ' '));
