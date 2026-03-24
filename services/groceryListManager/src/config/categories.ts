/**
 * Spoonacular returns an `aisle` field per ingredient
 * (e.g. "Produce", "Dairy", "Meat", "Canned and Jarred", etc.)
 * Sometimes multiple aisles are returned separated by ";"
 *
 * This file normalizes Spoonacular's aisle strings into our fixed category taxonomy.
 */

export const CATEGORIES = [
  'Produce',
  'Dairy',
  'Meat',
  'Poultry',
  'Seafood',
  'Bakery',
  'Pasta and Rice',
  'Canned and Jarred',
  'Frozen',
  'Beverages',
  'Baking',
  'Spices and Seasonings',
  'Oil, Vinegar, Salad Dressing',
  'Condiments',
  'Snacks',
  'Cereal',
  'Health Foods',
  'Other',
] as const;

export type Category = (typeof CATEGORIES)[number];

// Maps Spoonacular raw aisle strings → our canonical Category
// Spoonacular aisle values are not strictly standardized, so we normalize them
const AISLE_MAP: Record<string, Category> = {
  produce: 'Produce',
  'fresh vegetables and fruit': 'Produce',
  vegetables: 'Produce',
  fruits: 'Produce',
  dairy: 'Dairy',
  'cheese': 'Dairy',
  'milk, eggs, other dairy': 'Dairy',
  'eggs': 'Dairy',
  meat: 'Meat',
  'meat counter': 'Meat',
  'red meats': 'Meat',
  poultry: 'Poultry',
  'poultry counter': 'Poultry',
  seafood: 'Seafood',
  'fish counter': 'Seafood',
  bakery: 'Bakery',
  'bakery/bread': 'Bakery',
  bread: 'Bakery',
  'pasta and rice': 'Pasta and Rice',
  'pasta': 'Pasta and Rice',
  rice: 'Pasta and Rice',
  'dry goods pasta': 'Pasta and Rice',
  'canned and jarred': 'Canned and Jarred',
  'canned goods': 'Canned and Jarred',
  canned: 'Canned and Jarred',
  frozen: 'Frozen',
  'frozen meals': 'Frozen',
  'frozen foods': 'Frozen',
  beverages: 'Beverages',
  drinks: 'Beverages',
  'beer, wine & spirits': 'Beverages',
  alcohol: 'Beverages',
  'baking': 'Baking',
  'baking ingredients': 'Baking',
  'gluten free baking': 'Baking',
  'spices and seasonings': 'Spices and Seasonings',
  spices: 'Spices and Seasonings',
  seasoning: 'Spices and Seasonings',
  'oil, vinegar, salad dressing': 'Oil, Vinegar, Salad Dressing',
  'oils': 'Oil, Vinegar, Salad Dressing',
  vinegar: 'Oil, Vinegar, Salad Dressing',
  condiments: 'Condiments',
  'sauce': 'Condiments',
  'sauces': 'Condiments',
  'ketchup, mustard, sauces/oils': 'Condiments',
  snacks: 'Snacks',
  'chips, pretzels, snacks': 'Snacks',
  'cookies': 'Snacks',
  nuts: 'Snacks',
  candy: 'Snacks',
  cereal: 'Cereal',
  'breakfast foods': 'Cereal',
  'health foods': 'Health Foods',
  'natural foods': 'Health Foods',
  'dried fruits': 'Health Foods',
  'ethnic foods': 'Other',
  'international cuisine': 'Other',
  'asian foods': 'Other',
};

/**
 * Normalizes a Spoonacular `aisle` string to our Category type.
 *
 * Spoonacular sometimes returns multiple aisles: "Produce;Dairy"
 * We take the first one.
 */
export const normalizeAisle = (aisle: string): Category => {
  // Take first aisle if multiple are separated by ";"
  const primary = aisle.split(';')[0].trim().toLowerCase();
  return AISLE_MAP[primary] ?? 'Other';
};
