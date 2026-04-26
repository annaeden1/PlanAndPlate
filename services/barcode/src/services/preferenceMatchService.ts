import { ProductNutrition } from '../utils/types/product.js';

export interface UserPreferences {
  diet?: string[];
  allergies?: string[];
}

export interface PreferenceMatch {
  label: string;
  status: 'match' | 'mismatch' | 'unknown';
}

const ALLERGY_KEYWORDS: { [key: string]: string[] } = {
  nuts: ['nut', 'peanut', 'almond', 'walnut', 'hazelnut', 'pistachio'],
  dairy: ['milk', 'cheese', 'lactose', 'butter', 'cream', 'yogurt'],
  gluten: ['gluten', 'wheat', 'barley', 'rye'],
  shellfish: ['shellfish', 'shrimp', 'crab', 'lobster', 'oyster', 'mussel'],
  eggs: ['egg', 'albumin'],
  soy: ['soy', 'soybean'],
};

const VEGETARIAN_KEYWORDS = ['meat', 'beef', 'chicken', 'fish', 'pork', 'lamb'];
const VEGAN_KEYWORDS = [
  ...VEGETARIAN_KEYWORDS,
  'milk',
  'cheese',
  'egg',
  'honey',
];

export const checkPreferenceMatches = (
  product: ProductNutrition,
  preferences: UserPreferences,
): PreferenceMatch[] => {
  const matches: PreferenceMatch[] = [];

  // Check allergies
  const allergies = preferences.allergies || [];
  for (const allergy of allergies) {
    const allergyStatus = checkAllergyInProduct(product, allergy);
    matches.push({
      label: `${allergy} free`,
      status: allergyStatus,
    });
  }

  // Check diet
  const diet = preferences.diet?.[0];
  if (diet === 'vegetarian' || diet === 'vegan' || diet === 'pescatarian') {
    const dietStatus = checkVegetarianConflict(product, diet);
    matches.push({
      label: `${capitalize(diet)} Compatible`,
      status: dietStatus,
    });
  }

  return matches;
};

const checkAllergyInProduct = (
  product: ProductNutrition,
  allergy: string,
): 'match' | 'mismatch' | 'unknown' => {
  const allergenTags = product.allergens_tags || [];
  const traceTags = product.traces_tags || [];
  const categories = product.categories || '';

  // If no allergen data is available, return unknown
  if (allergenTags.length === 0 && traceTags.length === 0 && !categories) {
    return 'unknown';
  }

  const keywords = ALLERGY_KEYWORDS[allergy.toLowerCase()] || [allergy];
  const allText =
    `${allergenTags.join(' ')} ${traceTags.join(' ')} ${categories}`.toLowerCase();

  console.log(allText);
  console.log('1', keywords);
  const foundAllergen = keywords.some((keyword) =>
    allText.includes(keyword.toLowerCase()),
  );

  // If allergen is found, it's a mismatch (bad). If not found, it's a match (good)
  return foundAllergen ? 'mismatch' : 'match';
};

const checkVegetarianConflict = (
  product: ProductNutrition,
  diet: string,
): 'match' | 'mismatch' | 'unknown' => {
  const ingredientText = (product.ingredients_text || '').toLowerCase();
  const ingredientTags = (product.ingredients_analysis_tags || [])
    .join(' ')
    .toLowerCase();

  // If no ingredient data is available, return unknown
  if (!ingredientText && ingredientTags.length === 0) {
    return 'unknown';
  }

  const allText = `${ingredientText} ${ingredientTags}`;
  const keywordsToCheck =
    diet === 'vegan' ? VEGAN_KEYWORDS : VEGETARIAN_KEYWORDS;

  const hasConflict = keywordsToCheck.some((keyword) =>
    allText.includes(keyword.toLowerCase()),
  );

  // If conflict found, it's a mismatch (bad). If no conflict, it's a match (good)
  return hasConflict ? 'mismatch' : 'match';
};

const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
