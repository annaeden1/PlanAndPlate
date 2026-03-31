import { GroceryList } from "../models/groceryList.model";
import { Recipe } from "../models/recipe.model";
import { Category, normalizeAisle } from "../types/categories";
import { GroceryItem, GroceryItemGroup } from "../types/groceryList.types";

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
    } else {
      map.set(key, {
        name: normalizedName,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        inventoryQuantity: item.inventoryQuantity ?? 0,
        checked: item.checked ?? false,
      });
    }
  }

  return Array.from(map.values());
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
  const recipeItems = await importFromRecipeDB(recipeId);
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
