import axios from 'axios';
import { GroceryList, IGroceryItem } from '../models/groceryList.model';
import { Category, normalizeAisle } from '../config/categories';

// ─── Unit normalization ───────────────────────────────────────────────────────
// Maps Spoonacular unit strings to canonical forms
const UNIT_ALIASES: Record<string, string> = {
  // Weight
  g: 'g', gram: 'g', grams: 'g',
  kg: 'kg', kilogram: 'kg', kilograms: 'kg',
  oz: 'oz', ounce: 'oz', ounces: 'oz',
  lb: 'lb', lbs: 'lb', pound: 'lb', pounds: 'lb',

  // Volume
  ml: 'ml', milliliter: 'ml', milliliters: 'ml',
  l: 'l', liter: 'l', liters: 'l',
  cup: 'cup', cups: 'cup',
  tablespoon: 'tbsp', tablespoons: 'tbsp', tbsp: 'tbsp', Tbsp: 'tbsp',
  teaspoon: 'tsp', teaspoons: 'tsp', tsp: 'tsp',
  'fluid ounce': 'fl oz', 'fl oz': 'fl oz',
  quart: 'quart', quarts: 'quart',
  gallon: 'gallon', gallons: 'gallon',
  pint: 'pint', pints: 'pint',

  // Small measures
  pinch: 'pinch', dash: 'dash', drop: 'drop',
  splash: 'splash', spoonful: 'spoonful', glug: 'glug',

  // Discrete
  piece: 'piece', pieces: 'piece', unit: 'piece', whole: 'piece',
  head: 'head', bunch: 'bunch', bunches: 'bunch',
  clove: 'clove', cloves: 'clove',
  stalk: 'stalk', sprig: 'sprig', stem: 'stem',
  leaf: 'leaf', leave: 'leaf',
  slice: 'slice', slices: 'slice',
  strip: 'strip', wedge: 'wedge', floret: 'floret',
  ear: 'ear', cob: 'cob', pod: 'pod',
  bulb: 'bulb', root: 'root', knob: 'knob',
  shoot: 'shoot', handful: 'handful',

  // Protein cuts
  breast: 'breast', fillet: 'fillet', filet: 'fillet',
  thigh: 'thigh', wing: 'wing', leg: 'leg',
  steak: 'steak', chop: 'chop', rack: 'rack',
  rib: 'rib', roast: 'roast',
  patty: 'patty', pattie: 'patty',
  link: 'link', serving: 'serving',

  // Packaging
  can: 'can', tin: 'can',
  package: 'package', pack: 'package',
  bag: 'bag', box: 'box', bottle: 'bottle',
  jar: 'jar', container: 'container', tub: 'container',
  carton: 'carton', envelope: 'envelope',
  packet: 'packet', sachet: 'packet',
  tube: 'tube', roll: 'roll', pouch: 'pouch',
  scoop: 'scoop', shot: 'shot',
  loaf: 'loaf', block: 'block', stick: 'stick',
  bar: 'bar', sheet: 'sheet', ball: 'ball',
  cube: 'cube', square: 'square', round: 'round',
  bundle: 'bundle', tray: 'tray',

  // Default
  '': 'piece',
};

const normalizeUnit = (unit: string): string =>
  UNIT_ALIASES[unit.trim()] ?? unit.toLowerCase().trim();

// ─── Grouped response type (for the UI) ──────────────────────────────────────
export interface GroceryItemGroup {
  category: Category;
  count: number;
  items: IGroceryItem[];
}

/**
 * Groups a flat list of grocery items by category.
 * Returns an array of groups sorted by category name.
 * This is the format used by the frontend to render the
 * "Produce (4)", "Dairy (2)" sections shown in the UI.
 */
export const groupByCategory = (items: IGroceryItem[]): GroceryItemGroup[] => {
  const map = new Map<Category, IGroceryItem[]>();

  for (const item of items) {
    const cat = item.category as Category;
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(item);
  }

  return Array.from(map.entries())
    .map(([category, groupItems]) => ({
      category,
      count: groupItems.length,
      items: groupItems,
    }))
    .sort((a, b) => a.category.localeCompare(b.category));
};

// ─── Merge logic ─────────────────────────────────────────────────────────────
/**
 * Merges a list of grocery items.
 * Items with the same name AND unit are summed.
 * Items with different units remain separate.
 */
export const mergeIngredients = (items: IGroceryItem[]): IGroceryItem[] => {
  const map = new Map<string, IGroceryItem>();

  for (const item of items) {
    const normalizedName = item.name.toLowerCase().trim();
    const normalizedUnit = normalizeUnit(item.unit);
    const key = `${normalizedName}::${normalizedUnit}`;

    if (map.has(key)) {
      map.get(key)!.quantity += item.quantity;
    } else {
      map.set(key, {
        name: normalizedName,
        quantity: item.quantity,
        unit: normalizedUnit,
        category: item.category,
      });
    }
  }

  return Array.from(map.values());
};

// ─── Spoonacular import ───────────────────────────────────────────────────────
interface SpoonacularIngredient {
  name: string;
  amount: number;
  unit: string;
  aisle: string;    // e.g. "Produce", "Dairy", "Canned and Jarred"
}

interface SpoonacularRecipe {
  extendedIngredients: SpoonacularIngredient[];
}

/**
 * Fetches recipe ingredients from Spoonacular.
 * Uses Spoonacular's own `aisle` field to assign each item's category.
 */
export const importFromSpoonacular = async (recipeId: string): Promise<IGroceryItem[]> => {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) throw new Error('SPOONACULAR_API_KEY is not set');

  const url = `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${apiKey}`;
  const response = await axios.get<SpoonacularRecipe>(url);

  return response.data.extendedIngredients.map((ing) => ({
    name: ing.name.toLowerCase().trim(),
    quantity: ing.amount,
    unit: normalizeUnit(ing.unit),
    category: normalizeAisle(ing.aisle ?? ''),
  }));
};

// ─── Database operations ──────────────────────────────────────────────────────

/** Returns the user's grocery list grouped by category (for the UI) */
export const getGroceryList = async (userId: string): Promise<GroceryItemGroup[]> => {
  const list = await GroceryList.findOne({ userId });
  if (!list) return [];
  return groupByCategory(list.items);
};

/** Searches for products by name (case-insensitive partial match) */
export const searchProducts = async (userId: string, productName?: string): Promise<IGroceryItem[]> => {
  const list = await GroceryList.findOne({ userId });
  if (!list) return [];
  if (!productName) return list.items;

  const query = productName.toLowerCase().trim();
  return list.items.filter((item) => item.name.includes(query));
};

/** Returns a single product by exact name */
export const getProduct = async (userId: string, productName: string): Promise<IGroceryItem | null> => {
  const list = await GroceryList.findOne({ userId });
  if (!list) return null;
  return list.items.find((item) => item.name === productName.toLowerCase().trim()) ?? null;
};

/** Adds one or more items to the user's grocery list, merging duplicates */
export const addProducts = async (userId: string, newItems: IGroceryItem[]): Promise<GroceryItemGroup[]> => {
  let list = await GroceryList.findOne({ userId });

  const existing: IGroceryItem[] = list ? list.items : [];
  const merged = mergeIngredients([...existing, ...newItems]);

  list = await GroceryList.findOneAndUpdate(
    { userId },
    { $set: { items: merged } },
    { upsert: true, new: true },
  );

  return groupByCategory(list!.items);
};

/** Imports all ingredients from a Spoonacular recipe into the user's list */
export const importRecipeIngredients = async (
  userId: string,
  recipeId: string,
  mealPlanId?: string,
): Promise<GroceryItemGroup[]> => {
  const recipeItems = await importFromSpoonacular(recipeId);
  let list = await GroceryList.findOne({ userId });

  const existing: IGroceryItem[] = list ? list.items : [];
  const merged = mergeIngredients([...existing, ...recipeItems]);

  list = await GroceryList.findOneAndUpdate(
    { userId },
    { $set: { items: merged, ...(mealPlanId ? { mealPlanId } : {}) } },
    { upsert: true, new: true },
  );

  return groupByCategory(list!.items);
};

/** Removes a single product by name */
export const removeProduct = async (userId: string, productName: string): Promise<GroceryItemGroup[]> => {
  const normalizedName = productName.toLowerCase().trim();
  const list = await GroceryList.findOneAndUpdate(
    { userId },
    { $pull: { items: { name: normalizedName } } },
    { new: true },
  );
  return list ? groupByCategory(list.items) : [];
};

/** Clears the entire grocery list for a user */
export const clearGroceryList = async (userId: string): Promise<void> => {
  await GroceryList.findOneAndUpdate({ userId }, { $set: { items: [] } });
};
