import { MarketMapping } from '../models/marketMapping.model';
import { MarketPackage } from '../types/smartShoppingList.types';
import {
  convertToMarketUnits,
  GeminiIngredient,
  GeminiMarketResult,
} from './gemini.service';

export const PROMPT_VERSION = 1;

const cacheKey = (name: string, unit: string): { name: string; unit: string } => ({
  name: name.toLowerCase().trim(),
  unit: unit.toLowerCase().trim(),
});

const fromDoc = (doc: {
  name: string;
  marketUnit: string | null;
  marketQuantity: number | null;
  marketSize: string | null;
  marketSizeInRecipeUnits: number | null;
}): MarketPackage => ({
  name: doc.name,
  marketUnit: doc.marketUnit,
  marketQuantity: doc.marketQuantity,
  marketSize: doc.marketSize,
  marketSizeInRecipeUnits: doc.marketSizeInRecipeUnits,
});

export const lookupCachedMappings = async (
  ingredients: GeminiIngredient[],
): Promise<Map<string, MarketPackage>> => {
  if (ingredients.length === 0) return new Map();

  const keys = ingredients.map((i) => cacheKey(i.name, i.unit));
  const docs = await MarketMapping.find({
    promptVersion: PROMPT_VERSION,
    $or: keys.map((k) => ({ name: k.name, unit: k.unit })),
  }).lean();

  const map = new Map<string, MarketPackage>();
  for (const d of docs) {
    map.set(`${d.name}::${d.unit}`, fromDoc(d));
  }
  return map;
};

export const persistMappings = async (
  ingredients: GeminiIngredient[],
  results: GeminiMarketResult[],
): Promise<void> => {
  const ops = results.map((r, idx) => {
    const k = cacheKey(r.name, ingredients[idx].unit);
    return {
      updateOne: {
        filter: { name: k.name, unit: k.unit, promptVersion: PROMPT_VERSION },
        update: {
          $set: {
            marketUnit: r.marketUnit,
            marketQuantity: r.marketQuantity,
            marketSize: r.marketSize,
            marketSizeInRecipeUnits: r.marketSizeInRecipeUnits,
          },
        },
        upsert: true,
      },
    };
  });
  if (ops.length > 0) await MarketMapping.bulkWrite(ops);
};

export const resolveMarketPackages = async (
  ingredients: GeminiIngredient[],
): Promise<Map<string, MarketPackage>> => {
  const cached = await lookupCachedMappings(ingredients);

  const misses = ingredients.filter(
    (i) => !cached.has(`${i.name.toLowerCase().trim()}::${i.unit.toLowerCase().trim()}`),
  );

  if (misses.length === 0) return cached;

  const fresh = await convertToMarketUnits(misses);
  await persistMappings(misses, fresh);

  for (let idx = 0; idx < misses.length; idx++) {
    const k = cacheKey(misses[idx].name, misses[idx].unit);
    cached.set(`${k.name}::${k.unit}`, fromDoc(fresh[idx]));
  }
  return cached;
};
