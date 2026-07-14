import { PriceMatch } from '../../models/priceMatch.model';
import { GroceryItem } from '../../types/groceryList.types';
import {
  ChainAdapter,
  ChainProduct,
  ResolvedMatch,
} from '../../types/priceComparison.types';
import {
  getHebrewQueryPrompt,
  getPickProductPrompt,
} from '../../utils/priceComparison.prompts';
import { generateJson } from './gemini.client';

const MAX_CANDIDATES = 10;

const CANONICAL = '__canonical__';

const NEGATIVE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface CanonicalMatch {
  barcode: string;
  matchedName: string;
  referenceProduct?: ChainProduct;
}

const parseJson = <T>(text: string | null): T | null => {
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
};

const isCacheUsable = (doc: {
  code: string | null;
  resolvedAt?: Date;
}): boolean => {
  if (doc.code !== null) return true;
  const at = doc.resolvedAt ? new Date(doc.resolvedAt).getTime() : 0;
  return Date.now() - at < NEGATIVE_TTL_MS;
};

const saveMatch = (
  itemName: string,
  chainId: string,
  hebrewQuery: string,
  code: string | null,
  matchedName: string | null,
  confidence: number,
) =>
  PriceMatch.findOneAndUpdate(
    { itemName, chainId },
    { $set: { hebrewQuery, code, matchedName, confidence, resolvedAt: new Date() } },
    { upsert: true },
  );

interface ResolvedRow {
  storedCode: string;
  matchedName: string;
  confidence: number;
  product?: ChainProduct;
}

const resolveMatch = async (
  item: GroceryItem,
  chainId: string,
  search: (query: string) => Promise<ChainProduct[]>,
  hebrewQuery: string,
  selectStoredCode: (p: ChainProduct) => string | null,
): Promise<ResolvedRow | null> => {
  const itemName = item.name.toLowerCase().trim();

  const cached = await PriceMatch.findOne({ itemName, chainId });
  if (cached && isCacheUsable(cached)) {
    if (!cached.code) return null;
    return {
      storedCode: cached.code,
      matchedName: cached.matchedName ?? '',
      confidence: cached.confidence,
    };
  }

  const candidates = (await search(hebrewQuery)).slice(0, MAX_CANDIDATES);
  if (candidates.length === 0) {
    await saveMatch(itemName, chainId, hebrewQuery, null, null, 0);
    return null;
  }

  const pick = parseJson<{ code?: string | null; confidence?: number }>(
    await generateJson(
      getPickProductPrompt(itemName, item.quantity, item.unit, candidates),
    ),
  );
  if (!pick) return null;
  if (!pick.code) {
    await saveMatch(itemName, chainId, hebrewQuery, null, null, 0);
    return null;
  }

  const chosen = candidates.find((c) => c.code === pick.code);
  if (!chosen) return null;
  const storedCode = selectStoredCode(chosen);
  if (!storedCode) return null;

  const confidence = Math.min(Math.max(pick.confidence ?? 0, 0), 1);
  await saveMatch(itemName, chainId, hebrewQuery, storedCode, chosen.name, confidence);

  return { storedCode, matchedName: chosen.name, confidence, product: chosen };
};

export const getHebrewQuery = async (itemName: string): Promise<string | null> => {
  const existing = await PriceMatch.findOne({ itemName }).select({ hebrewQuery: 1 });
  if (existing?.hebrewQuery) return existing.hebrewQuery;

  const queryJson = parseJson<{ query?: string }>(
    await generateJson(getHebrewQueryPrompt(itemName)),
  );
  return queryJson?.query?.trim() || null;
};

export const resolveCanonical = async (
  item: GroceryItem,
  referenceChain: ChainAdapter,
  hebrewQuery: string,
): Promise<CanonicalMatch | null> => {
  const row = await resolveMatch(
    item,
    CANONICAL,
    referenceChain.search,
    hebrewQuery,
    (p) => p.barcode,
  );
  if (!row) return null;
  return {
    barcode: row.storedCode,
    matchedName: row.matchedName,
    referenceProduct: row.product,
  };
};

export const resolveItemForChain = async (
  item: GroceryItem,
  chain: ChainAdapter,
  hebrewQuery: string,
): Promise<ResolvedMatch | null> => {
  const row = await resolveMatch(
    item,
    chain.id,
    chain.search,
    hebrewQuery,
    (p) => p.code,
  );
  if (!row) return null;
  return {
    code: row.storedCode,
    matchedName: row.matchedName,
    confidence: row.confidence,
    ...(row.product ? { product: row.product } : {}),
  };
};
