import { GroceryList } from "../models/groceryList.model";
import { Recipe } from "../models/recipe.model";
import { Category, normalizeAisle } from "../types/categories";
import { NotFoundError } from "../types/errors";
import { GroceryItem, GroceryItemGroup } from "../types/groceryList.types";
import { convertToMarketUnits, GeminiMarketResult } from './gemini.service';

export const groupByCategory = (items: GroceryItem[]): GroceryItemGroup[] => {
  const map = new Map<Category, GroceryItem[]>();

  for (const item of items) {
    const cat = item.category;
    if (!map.has(cat)) map.set(cat, []);
    (map.get(cat) as GroceryItem[]).push(item);
  }

  return Array.from(map.entries())
    .map(([category, groupItems]) => ({
      category,
      count: groupItems.length,
      items: groupItems,
    }))
    .sort((a, b) => a.category.localeCompare(b.category));
};

export const mergeIngredients = (items: GroceryItem[]): GroceryItem[] => {
  const map = new Map<string, GroceryItem>();

  for (const item of items) {
    const normalizedName = item.name.toLowerCase().trim();
    const key = `${normalizedName}::${item.unit}`;

    if (map.has(key)) {
      map.get(key)!.quantity += item.quantity;
      // Keep existing inventoryQuantity and market fields from first (existing) item
    } else {
      map.set(key, {
        name: normalizedName,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        inventoryQuantity: item.inventoryQuantity ?? 0,
        checked: item.checked ?? false,
        marketUnit: item.marketUnit,
        marketQuantity: item.marketQuantity,
        marketSize: item.marketSize,
        marketSizeInRecipeUnits: item.marketSizeInRecipeUnits,
      });
    }
  }

  return Array.from(map.values());
};

const applyMarketUnits = (
  items: GroceryItem[],
  results: GeminiMarketResult[],
): GroceryItem[] => {
  const resultByName = new Map<string, GeminiMarketResult>(
    results.map((r) => [r.name.toLowerCase().trim(), r]),
  );
  return items.map((item) => {
    const result = resultByName.get(item.name);
    if (!result || !result.marketUnit) return item;
    return {
      ...item,
      marketUnit: result.marketUnit,
      marketQuantity: result.marketQuantity ?? item.marketQuantity,
      marketSize: result.marketSize ?? item.marketSize,
      marketSizeInRecipeUnits: result.marketSizeInRecipeUnits ?? item.marketSizeInRecipeUnits,
    };
  });
};

export const importFromRecipeDB = async (
  recipeId: string,
): Promise<GroceryItem[]> => {
  const recipe = await Recipe.findById(recipeId);
  if (!recipe) throw new Error(`Recipe "${recipeId}" not found`);

  const ingredients = recipe.instructions?.ingredients;
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    throw new Error(`Recipe "${recipeId}" has no ingredients`);
  }

  return ingredients.map((ing) => ({
    name: ing.name.toLowerCase().trim(),
    quantity: ing.amount,
    unit: ing.unit,
    category: normalizeAisle(ing.aisle ?? ""),
    inventoryQuantity: 0,
    checked: false,
  }));
};

export const getGroceryList = async (
  userId: string,
): Promise<GroceryItemGroup[]> => {
  const list = await GroceryList.findOne({ userId });
  if (!list) return [];
  return groupByCategory(list.items);
};

export const searchProducts = async (
  userId: string,
  productName?: string,
): Promise<GroceryItem[]> => {
  const list = await GroceryList.findOne({ userId });
  if (!list) return [];
  if (!productName) return list.items;

  const query = productName.toLowerCase().trim();
  return list.items.filter((item) => item.name.includes(query));
};

export const getProduct = async (
  userId: string,
  productName: string,
): Promise<GroceryItem | null> => {
  const list = await GroceryList.findOne({ userId });
  if (!list) return null;
  return (
    list.items.find((item) => item.name === productName.toLowerCase().trim()) ??
    null
  );
};

export const addProducts = async (
  userId: string,
  newItems: GroceryItem[],
): Promise<GroceryItemGroup[]> => {
  let list = await GroceryList.findOne({ userId });
  const existing: GroceryItem[] = list ? list.items : [];
  let merged = mergeIngredients([...existing, ...newItems]);

  const needsConversion = merged.filter(
    (item) =>
      !item.marketUnit ||
      (item.marketQuantity != null &&
        item.marketSizeInRecipeUnits != null &&
        item.quantity > item.marketQuantity * item.marketSizeInRecipeUnits),
  );

  if (needsConversion.length > 0) {
    const results = await convertToMarketUnits(needsConversion);
    merged = applyMarketUnits(merged, results);
  }

  list = await GroceryList.findOneAndUpdate(
    { userId },
    { $set: { items: merged } },
    { upsert: true, new: true },
  );

  return groupByCategory(list!.items);
};

export const importRecipeIngredients = async (
  userId: string,
  recipeId: string,
  mealPlanId?: string,
): Promise<GroceryItemGroup[]> => {
  const recipeItems = await importFromRecipeDB(recipeId);
  let list = await GroceryList.findOne({ userId });
  const existing: GroceryItem[] = list ? list.items : [];
  let merged = mergeIngredients([...existing, ...recipeItems]);

  const needsConversion = merged.filter(
    (item) =>
      !item.marketUnit ||
      (item.marketQuantity != null &&
        item.marketSizeInRecipeUnits != null &&
        item.quantity > item.marketQuantity * item.marketSizeInRecipeUnits),
  );

  if (needsConversion.length > 0) {
    const results = await convertToMarketUnits(needsConversion);
    merged = applyMarketUnits(merged, results);
  }

  list = await GroceryList.findOneAndUpdate(
    { userId },
    { $set: { items: merged, ...(mealPlanId ? { mealPlanId } : {}) } },
    { upsert: true, new: true },
  );

  return groupByCategory(list!.items);
};

export const removeProduct = async (
  userId: string,
  productName: string,
): Promise<GroceryItemGroup[]> => {
  const normalizedName = productName.toLowerCase().trim();
  const list = await GroceryList.findOneAndUpdate(
    { userId },
    { $pull: { items: { name: normalizedName } } },
    { new: true },
  );
  return list ? groupByCategory(list.items) : [];
};

export const clearGroceryList = async (userId: string): Promise<void> => {
  await GroceryList.findOneAndUpdate({ userId }, { $set: { items: [] } });
};

export const removeBoughtItems = async (
  userId: string,
  names: string[],
): Promise<GroceryItemGroup[]> => {
  const normalizedNames = names.map((n) => n.toLowerCase().trim());
  const list = await GroceryList.findOneAndUpdate(
    { userId },
    { $pull: { items: { name: { $in: normalizedNames } } } },
    { new: true },
  );
  return list ? groupByCategory(list.items) : [];
};

export const toggleItem = async (
  userId: string,
  productName: string,
): Promise<GroceryItemGroup[]> => {
  const normalizedName = productName.toLowerCase().trim();
  const list = await GroceryList.findOne({ userId });
  if (!list) throw new Error('Grocery list not found');

  const item = list.items.find((i) => i.name === normalizedName);
  if (!item) throw new Error(`Product "${productName}" not found`);

  item.checked = !item.checked;
  await list.save();
  return groupByCategory(list.items);
};

export const updateInventoryQuantity = async (
  userId: string,
  productName: string,
  inventoryQuantity: number,
): Promise<GroceryItemGroup[]> => {
  const normalizedName = productName.toLowerCase().trim();
  const list = await GroceryList.findOne({ userId });
  if (!list) throw new NotFoundError('Grocery list not found');

  const item = list.items.find((i) => i.name === normalizedName);
  if (!item) throw new NotFoundError(`Product "${productName}" not found`);

  item.inventoryQuantity = inventoryQuantity;
  await list.save();
  return groupByCategory(list.items);
};

export const finishShopping = async (userId: string): Promise<GroceryItemGroup[]> => {
  const list = await GroceryList.findOne({ userId });
  if (!list) throw new NotFoundError('Grocery list not found');

  for (const item of list.items) {
    if (!item.checked) continue;

    if (item.marketQuantity != null && item.marketSizeInRecipeUnits != null) {
      item.inventoryQuantity = item.marketQuantity * item.marketSizeInRecipeUnits;
    } else {
      item.inventoryQuantity = item.quantity;
    }
    item.checked = false;
  }

  await list.save();
  return groupByCategory(list.items);
};
