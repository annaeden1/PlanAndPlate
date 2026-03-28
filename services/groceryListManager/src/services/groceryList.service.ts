import axios from "axios";
import { GroceryList } from "../models/groceryList.model";
import { Category, normalizeAisle } from "../types/categories";
import { normalizeUnit } from "../types/units";
import { GroceryItem, GroceryItemGroup } from "../types/groceryList.types";

export const groupByCategory = (items: GroceryItem[]): GroceryItemGroup[] => {
  const map = new Map<Category, GroceryItem[]>();

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

export const mergeIngredients = (items: GroceryItem[]): GroceryItem[] => {
  const map = new Map<string, GroceryItem>();

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

interface SpoonacularIngredient {
  name: string;
  amount: number;
  unit: string;
  aisle: string;
}

interface SpoonacularRecipe {
  extendedIngredients: SpoonacularIngredient[];
}

export const importFromSpoonacular = async (
  recipeId: string,
): Promise<GroceryItem[]> => {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) throw new Error("SPOONACULAR_API_KEY is not set");

  const url = `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${apiKey}`;
  const response = await axios.get<SpoonacularRecipe>(url);

  return response.data.extendedIngredients.map((ing) => ({
    name: ing.name.toLowerCase().trim(),
    quantity: ing.amount,
    unit: normalizeUnit(ing.unit),
    category: normalizeAisle(ing.aisle ?? ""),
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
  const merged = mergeIngredients([...existing, ...newItems]);

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
  const recipeItems = await importFromSpoonacular(recipeId);
  let list = await GroceryList.findOne({ userId });

  const existing: GroceryItem[] = list ? list.items : [];
  const merged = mergeIngredients([...existing, ...recipeItems]);

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
