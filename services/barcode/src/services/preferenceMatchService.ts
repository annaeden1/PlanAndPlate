import { ProductNutrition } from '../utils/types/product.js';
import {
  type MatchStatus,
  type ProductMatchContext,
  type PreferenceMatch,
  type SupportedDiet,
  type UserPreferences,
  type VegetarianVariant,
} from '../utils/types/preferences.js';

const ALLERGY_KEYWORDS: Record<string, string[]> = {
  nuts: [
    'nuts',
    'nut',
    'peanut',
    'almond',
    'walnut',
    'hazelnut',
    'pistachio',
    'cashew',
    'pecan',
    'macadamia',
  ],
  dairy: ['dairy', 'milk', 'cheese', 'lactose', 'butter', 'cream', 'yogurt'],
  gluten: ['gluten', 'wheat', 'barley', 'rye', 'spelt', 'farro', 'kamut'],
  shellfish: [
    'shellfish',
    'shrimp',
    'prawn',
    'crab',
    'lobster',
    'oyster',
    'mussel',
  ],
  eggs: ['egg', 'eggs', 'albumin'],
  soy: ['soy', 'soya', 'soybean', 'soybeans'],
};

const NON_VEGETARIAN_KEYWORDS = [
  'meat',
  'beef',
  'chicken',
  'fish',
  'pork',
  'lamb',
  'gelatin',
  'anchovy',
  'sardine',
  'tuna',
  'salmon',
  'ham',
];

const VEGAN_EXTRA_KEYWORDS = [
  'milk',
  'cheese',
  'egg',
  'eggs',
  'honey',
  'lactose',
  'butter',
  'cream',
  'whey',
  'casein',
];

const DIET_LABELS: Record<SupportedDiet, string> = {
  vegan: 'Vegan Compatible',
  vegetarian: 'Vegetarian Compatible',
  pescatarian: 'Pescatarian Compatible',
  glutenFree: 'Gluten Free Compatible',
  lactoVegetarian: 'Lacto-Vegetarian Compatible',
  ovoVegetarian: 'Ovo-Vegetarian Compatible',
};

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
  const dietPreference = preferences.diet?.[0];
  if (isSupportedDiet(dietPreference)) {
    const dietStatus = checkDietCompatibility(product, dietPreference);
    matches.push({
      label: DIET_LABELS[dietPreference],
      status: dietStatus,
    });
  }

  return matches;
};

const checkAllergyInProduct = (
  product: ProductNutrition,
  allergy: string,
): MatchStatus => {
  const normalizedAllergy = allergy.toLowerCase();
  const allergyKeywords = ALLERGY_KEYWORDS[normalizedAllergy] ?? [
    normalizedAllergy,
  ];
  const productContext = buildProductContext(product);

  // If there is no ingredient/allergen/label evidence, do not claim a safe match.
  if (!hasSafetyEvidence(productContext)) {
    return 'unknown';
  }

  const hasConfirmedAllergenMatch = allergyKeywords.some((keyword) =>
    hasPositiveKeywordMention(productContext.confirmedAllergenText, keyword),
  );

  if (hasConfirmedAllergenMatch) {
    return 'mismatch';
  }

  const hasFreeAllergenTag = hasFreeAllergenTagMatch(
    productContext.tags,
    normalizedAllergy,
  );

  const hasPotentialAllergenRiskMatch = allergyKeywords.some((keyword) =>
    hasPositiveKeywordMention(
      productContext.potentialAllergenRiskText,
      keyword,
    ),
  );

  if (hasPotentialAllergenRiskMatch) {
    return 'mismatch';
  }

  // When there is no direct conflict, only mark as match when we have an explicit free-from claim.
  return hasFreeAllergenTag ? 'match' : 'unknown';
};

const checkDietCompatibility = (
  product: ProductNutrition,
  diet: SupportedDiet,
): MatchStatus => {
  const productContext = buildProductContext(product);

  if (!hasSafetyEvidence(productContext)) {
    return 'unknown';
  }

  const checker = DIET_COMPATIBILITY_CHECKERS[diet];
  return checker ? checker(product, productContext) : 'unknown';
};

const isSupportedDiet = (value: string | undefined): value is SupportedDiet => {
  return Boolean(value && value in DIET_LABELS);
};

const DIET_COMPATIBILITY_CHECKERS: Record<
  SupportedDiet,
  (
    product: ProductNutrition,
    productContext: ProductMatchContext,
  ) => MatchStatus
> = {
  glutenFree: (product) => checkAllergyInProduct(product, 'gluten'),
  vegan: (_product, productContext) => checkVeganDiet(productContext),
  vegetarian: (_product, productContext) =>
    checkVegetarianVariantDiet(productContext, 'vegetarian'),
  lactoVegetarian: (_product, productContext) =>
    checkVegetarianVariantDiet(productContext, 'lactoVegetarian'),
  ovoVegetarian: (_product, productContext) =>
    checkVegetarianVariantDiet(productContext, 'ovoVegetarian'),
  pescatarian: (_product, productContext) =>
    checkPescatarianDiet(productContext),
};

const checkVeganDiet = (productContext: ProductMatchContext): MatchStatus => {
  if (hasTagFragment(productContext.tags, ['non-vegan'])) {
    return 'mismatch';
  }

  if (
    hasAnySubstring(productContext.text, [
      ...NON_VEGETARIAN_KEYWORDS,
      ...VEGAN_EXTRA_KEYWORDS,
    ])
  ) {
    return 'mismatch';
  }

  if (hasTagFragment(productContext.tags, ['vegan'])) {
    return 'match';
  }

  return 'unknown';
};

const checkVegetarianVariantDiet = (
  productContext: ProductMatchContext,
  diet: VegetarianVariant,
): MatchStatus => {
  if (hasTagFragment(productContext.tags, ['non-vegetarian'])) {
    return 'mismatch';
  }

  if (hasAnySubstring(productContext.text, NON_VEGETARIAN_KEYWORDS)) {
    return 'mismatch';
  }

  if (
    diet === 'lactoVegetarian' &&
    hasAnySubstring(productContext.text, ['egg', 'eggs'])
  ) {
    return 'mismatch';
  }

  if (
    diet === 'ovoVegetarian' &&
    hasAnySubstring(productContext.text, ALLERGY_KEYWORDS.dairy)
  ) {
    return 'mismatch';
  }

  if (hasTagFragment(productContext.tags, ['vegetarian'])) {
    return 'match';
  }

  return 'unknown';
};

const checkPescatarianDiet = (
  productContext: ProductMatchContext,
): MatchStatus => {
  if (
    hasAnySubstring(productContext.text, [
      'beef',
      'chicken',
      'pork',
      'lamb',
      'ham',
      'gelatin',
    ])
  ) {
    return 'mismatch';
  }

  return 'unknown';
};

const hasAnySubstring = (text: string, keywords: string[]): boolean => {
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
};

const normalizeTag = (value: string): string => {
  const normalized = value.toLowerCase();
  const separatorIndex = normalized.indexOf(':');

  if (separatorIndex === -1) {
    return normalized;
  }

  return normalized.slice(separatorIndex + 1);
};

const hasTagFragment = (
  normalizedTags: string[],
  tagFragments: string[],
): boolean => {
  return tagFragments.some((fragment) =>
    normalizedTags.some((tag) => tag.includes(fragment.toLowerCase())),
  );
};

const hasFreeAllergenTagMatch = (
  normalizedTags: string[],
  allergy: string,
): boolean => {
  if (allergy === 'gluten') {
    return hasTagFragment(normalizedTags, [
      'no-gluten',
      'gluten-free',
      'sans-gluten',
      'without-gluten',
    ]);
  }

  if (allergy === 'dairy') {
    return hasTagFragment(normalizedTags, [
      'dairy-free',
      'milk-free',
      'without-milk',
    ]);
  }

  if (allergy === 'eggs') {
    return hasTagFragment(normalizedTags, ['egg-free', 'without-egg']);
  }

  if (allergy === 'nuts') {
    return hasTagFragment(normalizedTags, ['nut-free', 'without-nuts']);
  }

  if (allergy === 'soy') {
    return hasTagFragment(normalizedTags, [
      'soy-free',
      'soya-free',
      'without-soy',
    ]);
  }

  return false;
};

const buildProductContext = (
  product: ProductNutrition,
): ProductMatchContext => {
  const ingredientsText = (product.ingredients_text || '').toLowerCase();
  const allergenText = (product.allergens || '').toLowerCase();
  const categoriesText = (product.categories || '').toLowerCase();
  const labelsText = (product.labels || '').toLowerCase();
  const allergenTags = (product.allergens_tags || []).map(normalizeTag);
  const tracesTags = (product.traces_tags || []).map(normalizeTag);
  const ingredientAnalysisTags = (product.ingredients_analysis_tags || []).map(
    normalizeTag,
  );
  const labelsTags = (product.labels_tags || []).map(normalizeTag);

  const tags = [
    ...allergenTags,
    ...tracesTags,
    ...ingredientAnalysisTags,
    ...labelsTags,
  ];

  const confirmedAllergenText = [
    allergenText,
    allergenTags.join(' '),
    tracesTags.join(' '),
  ]
    .join(' ')
    .toLowerCase();

  const potentialAllergenRiskText = [ingredientsText, categoriesText]
    .join(' ')
    .toLowerCase();

  const text = [
    ingredientsText,
    allergenText,
    categoriesText,
    labelsText,
    tags.join(' '),
  ]
    .join(' ')
    .toLowerCase();

  return {
    text,
    confirmedAllergenText,
    potentialAllergenRiskText,
    tags,
  };
};

const hasSafetyEvidence = (productContext: ProductMatchContext): boolean => {
  return productContext.text.trim().length > 0;
};

const hasPositiveKeywordMention = (text: string, keyword: string): boolean => {
  const normalizedKeyword = keyword.toLowerCase();
  const cleanedText = removeNegatedKeywords(
    text.toLowerCase(),
    normalizedKeyword,
  );
  return matchesWord(cleanedText, normalizedKeyword);
};

const removeNegatedKeywords = (text: string, keyword: string): string => {
  const escapedKeyword = escapeRegex(keyword);
  const negatedPatterns = [
    new RegExp(`\\bno\\s+${escapedKeyword}\\b`, 'gi'),
    new RegExp(`\\bwithout\\s+${escapedKeyword}\\b`, 'gi'),
    new RegExp(`\\bsans\\s+${escapedKeyword}\\b`, 'gi'),
    new RegExp(`\\bfree\\s+of\\s+${escapedKeyword}\\b`, 'gi'),
    new RegExp(`\\b${escapedKeyword}\\s*[- ]?free\\b`, 'gi'),
    new RegExp(`\\bwithout[- ]${escapedKeyword}\\b`, 'gi'),
  ];

  return negatedPatterns.reduce(
    (accumulator, pattern) => accumulator.replace(pattern, ' '),
    text,
  );
};

const matchesWord = (text: string, keyword: string): boolean => {
  const escapedKeyword = escapeRegex(keyword);
  const pattern = new RegExp(`\\b${escapedKeyword}\\b`, 'i');
  return pattern.test(text);
};

const escapeRegex = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
};
