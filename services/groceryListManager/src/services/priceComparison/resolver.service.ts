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

// Pseudo-chain id under which the chain-neutral canonical match is cached,
// separate from the real per-chain fallback matches.
const CANONICAL = '__canonical__';

// A "not found here" (negative) cache goes stale so newly-stocked products are
// re-checked. Positive matches never expire — prices are always fetched live,
// only the product identity is cached.
const NEGATIVE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** A canonical product identity resolved once, then priced across chains by barcode. */
export interface CanonicalMatch {
  barcode: string;
  matchedName: string;
  // The reference chain's product, present only on a fresh resolution. Lets the
  // reference chain reuse it instead of searching a second time.
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

/** A cached negative result is only usable while still fresh. */
const isCacheUsable = (doc: {
  code: string | null;
  resolvedAt?: Date;
}): boolean => {
  if (doc.code !== null) return true; // positive match — always usable
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
  product?: ChainProduct; // present only on a fresh (non-cached) resolution
}

/**
 * Shared resolution skeleton: cache -> search -> LLM pick -> validate -> cache.
 * `selectStoredCode` decides what identity is cached/returned (a chain's own
 * code for the fallback path, the EAN barcode for the canonical path). Returns
 * null when the item can't be resolved.
 */
const resolveMatch = async (
  item: GroceryItem,
  chainId: string,
  search: (query: string) => Promise<ChainProduct[]>,
  hebrewQuery: string,
  selectStoredCode: (p: ChainProduct) => string | null,
): Promise<ResolvedRow | null> => {
  const itemName = item.name.toLowerCase().trim();

  // 1. cache (positive always, negative only while fresh)
  const cached = await PriceMatch.findOne({ itemName, chainId });
  if (cached && isCacheUsable(cached)) {
    if (!cached.code) return null; // fresh negative cache
    return {
      storedCode: cached.code,
      matchedName: cached.matchedName ?? '',
      confidence: cached.confidence,
    };
  }

  // 2. search the catalog
  const candidates = (await search(hebrewQuery)).slice(0, MAX_CANDIDATES);
  if (candidates.length === 0) {
    await saveMatch(itemName, chainId, hebrewQuery, null, null, 0);
    return null;
  }

  // 3. LLM picks the best candidate
  const pick = parseJson<{ code?: string | null; confidence?: number }>(
    await generateJson(
      getPickProductPrompt(itemName, item.quantity, item.unit, candidates),
    ),
  );
  if (!pick) return null; // transient failure: no caching
  if (!pick.code) {
    await saveMatch(itemName, chainId, hebrewQuery, null, null, 0); // LLM: none
    return null;
  }

  // 4. the pick must be a real candidate and yield a storable identity
  const chosen = candidates.find((c) => c.code === pick.code);
  if (!chosen) return null;
  const storedCode = selectStoredCode(chosen);
  if (!storedCode) return null; // e.g. canonical needs a barcode and there is none

  const confidence = Math.min(Math.max(pick.confidence ?? 0, 0), 1);
  await saveMatch(itemName, chainId, hebrewQuery, storedCode, chosen.name, confidence);

  return { storedCode, matchedName: chosen.name, confidence, product: chosen };
};

/**
 * Translates an English grocery item name to a Hebrew search term.
 * Reuses a previous translation cached for any chain before calling Gemini.
 * Returns null on transient LLM failure (retryable, never cached).
 */
export const getHebrewQuery = async (itemName: string): Promise<string | null> => {
  const existing = await PriceMatch.findOne({ itemName }).select({ hebrewQuery: 1 });
  if (existing?.hebrewQuery) return existing.hebrewQuery;

  const queryJson = parseJson<{ query?: string }>(
    await generateJson(getHebrewQueryPrompt(itemName)),
  );
  return queryJson?.query?.trim() || null;
};

/**
 * Resolves a grocery item to ONE canonical product (with a barcode) using a
 * single reference chain. The barcode is then reused to price every other
 * chain with no further LLM calls. Returns null when the reference chain has
 * no barcoded match.
 */
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

/**
 * Resolves a grocery item to a product at one chain, using the chain's own
 * catalog code. The per-chain fallback used when canonical barcode reuse misses.
 */
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
