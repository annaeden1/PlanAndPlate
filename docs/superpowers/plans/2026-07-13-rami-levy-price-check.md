# Rami Levy Price Check Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `GET /grocerylist/users/{userId}/price-comparison` to groceryListManager — prices the user's grocery list at Rami Levy's online store and returns an estimated total.

**Architecture:** New `priceComparison` module inside `services/groceryListManager`. Flow: load grocery list → for each unchecked item, resolve English item name → canonical Rami Levy product (Gemini translates to Hebrew query, Rami Levy catalog API searches, Gemini picks the best candidate; result cached in MongoDB) → price by barcode → sum + delivery fee → return totals with missing items and estimate disclaimer. See `docs/price-comparison-design.md` for the full multi-chain design; this plan is the single-chain vertical slice.

**Tech Stack:** Node.js / Express 5 / TypeScript (CommonJS), Mongoose, axios, `@google/generative-ai` (Gemini 2.5 Flash), Jest + ts-jest + supertest.

## Global Constraints

- All new code lives in `services/groceryListManager` (user decision — no new microservice).
- Grocery item names are **English lowercase** (Spoonacular origin, e.g. `"onion"`); Rami Levy catalog is **Hebrew**. Translation happens inside the resolver via Gemini.
- v1 simplification: **1 package per grocery item** (`packagesAssumed: 1`). Package-quantity math is deferred (design doc §2 QUANTIFY) — totals are estimates and the response must say so.
- Every response carries `disclaimer: "המחירים הם הערכה בלבד ועשויים להשתנות באתר הרשת. מבצעים ומחירי מועדון אינם כלולים."` (design doc honesty rule 0).
- Missing items are listed, never silently dropped (honesty rule 2 adapted to single chain).
- Rami Levy endpoint facts (verified 2026-07-13, design doc §8): `POST https://www.rami-levy.co.il/api/catalog`, body `{"q": "<term|barcode>", "store": "331", "from": 0, "aggs": 1}`, no auth. Barcode query returns exact hit. Prices uniform across stores.
- `GEMINI_API_KEY` comes from `process.env` (same convention as the barcode service).
- Follow existing file conventions: functional exported services (not classes except providers), `jest.mock` for models/axios in unit tests, swagger JSDoc on routes.
- Never commit unless the user explicitly asks (repo owner preference — plan's commit steps are checkpoints to run **only with user approval**; otherwise skip them).

---

### Task 1: Rami Levy adapter

**Files:**
- Create: `services/groceryListManager/src/types/priceComparison.types.ts`
- Create: `services/groceryListManager/src/services/priceComparison/ramiLevy.adapter.ts`
- Test: `services/groceryListManager/src/tests/unit/ramiLevy.adapter.test.ts`

**Interfaces:**
- Consumes: nothing (leaf module).
- Produces: `searchCatalog(query: string): Promise<ChainProduct[]>`, `getByBarcode(barcode: string): Promise<ChainProduct | null>`, type `ChainProduct { chainItemId: number; barcode: string; name: string; price: number }`.

- [ ] **Step 1: Create the shared types file**

```ts
// services/groceryListManager/src/types/priceComparison.types.ts

/** A product as returned by a supermarket chain's catalog. */
export interface ChainProduct {
  chainItemId: number;
  barcode: string; // keep as string — join key, never do arithmetic on it
  name: string;
  price: number; // ILS
}

/** A grocery-list item resolved to a canonical chain product. */
export interface ResolvedMatch {
  barcode: string;
  matchedName: string;
  confidence: number; // 0..1 from the LLM pick
}

export interface ComparedItem {
  itemName: string; // original grocery-list name (English)
  matchedProductName: string; // Hebrew product name at the chain
  barcode: string;
  unitPrice: number;
  packagesAssumed: number; // always 1 in v1
  lineTotal: number;
}

export interface PriceComparisonResult {
  chain: 'rami-levy';
  currency: 'ILS';
  items: ComparedItem[];
  missing: string[]; // grocery item names we could not price
  subtotal: number;
  estimatedDelivery: number;
  total: number;
  pricesAsOf: string; // ISO timestamp
  disclaimer: string;
}
```

- [ ] **Step 2: Write the failing adapter test**

```ts
// services/groceryListManager/src/tests/unit/ramiLevy.adapter.test.ts
import axios from 'axios';
import {
  searchCatalog,
  getByBarcode,
} from '../../services/priceComparison/ramiLevy.adapter';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const catalogResponse = (products: unknown[]) => ({
  data: { status: 200, total: products.length, data: products },
});

const rawMilk = {
  id: 419939,
  barcode: 7290001794852,
  name: 'חלב טרי 3% 1 ליטר רמי לוי',
  price: { price: 7.2 },
};

describe('ramiLevy.adapter', () => {
  beforeEach(() => jest.resetAllMocks());

  describe('searchCatalog', () => {
    it('POSTs the query to the catalog endpoint and maps products', async () => {
      mockedAxios.post.mockResolvedValue(catalogResponse([rawMilk]));

      const results = await searchCatalog('חלב');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://www.rami-levy.co.il/api/catalog',
        { q: 'חלב', store: '331', from: 0, aggs: 1 },
        expect.objectContaining({ timeout: expect.any(Number) }),
      );
      expect(results).toEqual([
        {
          chainItemId: 419939,
          barcode: '7290001794852', // string, not number
          name: 'חלב טרי 3% 1 ליטר רמי לוי',
          price: 7.2,
        },
      ]);
    });

    it('returns [] when the response has no data array', async () => {
      mockedAxios.post.mockResolvedValue({ data: { status: 200, total: 0 } });
      expect(await searchCatalog('xyz')).toEqual([]);
    });

    it('skips products without a valid price', async () => {
      mockedAxios.post.mockResolvedValue(
        catalogResponse([{ ...rawMilk, price: {} }]),
      );
      expect(await searchCatalog('חלב')).toEqual([]);
    });
  });

  describe('getByBarcode', () => {
    it('returns the exact barcode match', async () => {
      mockedAxios.post.mockResolvedValue(catalogResponse([rawMilk]));
      const product = await getByBarcode('7290001794852');
      expect(product?.barcode).toBe('7290001794852');
      expect(product?.price).toBe(7.2);
    });

    it('returns null when nothing matches the barcode exactly', async () => {
      mockedAxios.post.mockResolvedValue(catalogResponse([rawMilk]));
      expect(await getByBarcode('0000000000000')).toBeNull();
    });
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run (from `services/groceryListManager`): `npx jest src/tests/unit/ramiLevy.adapter.test.ts`
Expected: FAIL — `Cannot find module '../../services/priceComparison/ramiLevy.adapter'`

- [ ] **Step 4: Write the adapter**

```ts
// services/groceryListManager/src/services/priceComparison/ramiLevy.adapter.ts
import axios from 'axios';
import { ChainProduct } from '../../types/priceComparison.types';

const CATALOG_URL = 'https://www.rami-levy.co.il/api/catalog';
const ONLINE_STORE_ID = '331'; // online store; prices are uniform across stores
const REQUEST_TIMEOUT_MS = 10_000;

interface RawCatalogProduct {
  id: number;
  barcode: number;
  name?: string;
  price?: { price?: number };
  gs?: { internal_product_description?: string };
}

interface CatalogResponse {
  status: number;
  total: number;
  data?: RawCatalogProduct[];
}

const toChainProduct = (raw: RawCatalogProduct): ChainProduct | null => {
  const price = raw.price?.price;
  if (typeof price !== 'number' || !raw.barcode) return null;
  return {
    chainItemId: raw.id,
    barcode: String(raw.barcode),
    name: raw.name ?? raw.gs?.internal_product_description ?? '',
    price,
  };
};

export const searchCatalog = async (
  query: string,
): Promise<ChainProduct[]> => {
  const res = await axios.post<CatalogResponse>(
    CATALOG_URL,
    { q: query, store: ONLINE_STORE_ID, from: 0, aggs: 1 },
    { timeout: REQUEST_TIMEOUT_MS },
  );

  return (res.data.data ?? [])
    .map(toChainProduct)
    .filter((p): p is ChainProduct => p !== null);
};

export const getByBarcode = async (
  barcode: string,
): Promise<ChainProduct | null> => {
  const results = await searchCatalog(barcode);
  return results.find((p) => p.barcode === barcode) ?? null;
};
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest src/tests/unit/ramiLevy.adapter.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 6: Checkpoint — ask user before committing**

```bash
git add services/groceryListManager/src/types/priceComparison.types.ts services/groceryListManager/src/services/priceComparison/ramiLevy.adapter.ts services/groceryListManager/src/tests/unit/ramiLevy.adapter.test.ts
git commit -m "feat(grocerylist): add Rami Levy catalog adapter"
```

---

### Task 2: Match-cache model

**Files:**
- Create: `services/groceryListManager/src/models/priceMatch.model.ts`
- Test: `services/groceryListManager/src/tests/unit/priceMatch.model.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: Mongoose model `PriceMatch` with document shape `{ itemName: string (unique, lowercase), hebrewQuery: string, barcode: string | null, matchedName: string | null, confidence: number, resolvedAt: Date }`. `barcode: null` caches a *negative* result (item known unresolvable) so we don't re-pay Gemini for it.

- [ ] **Step 1: Write the failing model test**

```ts
// services/groceryListManager/src/tests/unit/priceMatch.model.test.ts
import { PriceMatch } from '../../models/priceMatch.model';

describe('PriceMatch model', () => {
  it('lowercases and trims itemName', () => {
    const doc = new PriceMatch({
      itemName: '  Onion ',
      hebrewQuery: 'בצל',
      barcode: '7290000000001',
      matchedName: 'בצל יבש',
      confidence: 0.9,
    });
    expect(doc.itemName).toBe('onion');
  });

  it('allows null barcode (negative cache)', () => {
    const doc = new PriceMatch({
      itemName: 'unicorn dust',
      hebrewQuery: 'אבקת חד קרן',
      barcode: null,
      matchedName: null,
      confidence: 0,
    });
    const err = doc.validateSync();
    expect(err).toBeUndefined();
  });

  it('defaults resolvedAt to now', () => {
    const doc = new PriceMatch({
      itemName: 'onion',
      hebrewQuery: 'בצל',
      barcode: '7290000000001',
      matchedName: 'בצל',
      confidence: 1,
    });
    expect(doc.resolvedAt).toBeInstanceOf(Date);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/tests/unit/priceMatch.model.test.ts`
Expected: FAIL — `Cannot find module '../../models/priceMatch.model'`

- [ ] **Step 3: Write the model**

```ts
// services/groceryListManager/src/models/priceMatch.model.ts
import { Schema, model } from 'mongoose';

export interface PriceMatchDoc {
  itemName: string; // normalized English grocery item name — cache key
  hebrewQuery: string; // Gemini's Hebrew search term (kept for debugging)
  barcode: string | null; // null = negative cache (known unresolvable)
  matchedName: string | null;
  confidence: number;
  resolvedAt: Date;
}

const PriceMatchSchema = new Schema<PriceMatchDoc>({
  itemName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  hebrewQuery: { type: String, required: true },
  barcode: { type: String, default: null },
  matchedName: { type: String, default: null },
  confidence: { type: Number, required: true, min: 0, max: 1 },
  resolvedAt: { type: Date, required: true, default: Date.now },
});

export const PriceMatch = model<PriceMatchDoc>('PriceMatch', PriceMatchSchema);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/tests/unit/priceMatch.model.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Checkpoint — ask user before committing**

```bash
git add services/groceryListManager/src/models/priceMatch.model.ts services/groceryListManager/src/tests/unit/priceMatch.model.test.ts
git commit -m "feat(grocerylist): add PriceMatch cache model"
```

---

### Task 3: Gemini client + prompts

**Files:**
- Create: `services/groceryListManager/src/services/priceComparison/gemini.client.ts`
- Create: `services/groceryListManager/src/utils/priceComparison.prompts.ts`
- Test: `services/groceryListManager/src/tests/unit/priceComparison.prompts.test.ts`
- Modify: `services/groceryListManager/package.json` (add dependency)

**Interfaces:**
- Consumes: `ChainProduct` from Task 1.
- Produces:
  - `generateJson(prompt: string): Promise<string | null>` (thin Gemini wrapper, returns raw JSON text or null on failure — mirrors `services/barcode/src/ai/geminiProvider.ts`).
  - `getHebrewQueryPrompt(itemName: string): string`
  - `getPickProductPrompt(itemName: string, quantity: number, unit: string, candidates: ChainProduct[]): string`
- Expected LLM outputs (documented contract): Hebrew-query prompt → `{"query": "<hebrew term>"}`; pick prompt → `{"barcode": "<string>" | null, "confidence": <0..1>}`.

- [ ] **Step 1: Install the Gemini SDK**

Run (from `services/groceryListManager`): `npm install @google/generative-ai`
Expected: dependency added to `package.json`, install succeeds.

- [ ] **Step 2: Write the failing prompts test**

```ts
// services/groceryListManager/src/tests/unit/priceComparison.prompts.test.ts
import {
  getHebrewQueryPrompt,
  getPickProductPrompt,
} from '../../utils/priceComparison.prompts';

describe('priceComparison prompts', () => {
  it('hebrew query prompt embeds the item name and demands JSON', () => {
    const prompt = getHebrewQueryPrompt('whole milk');
    expect(prompt).toContain('whole milk');
    expect(prompt).toContain('"query"');
  });

  it('pick prompt embeds item, quantity/unit and every candidate', () => {
    const prompt = getPickProductPrompt('whole milk', 2, 'liter', [
      { chainItemId: 1, barcode: '111', name: 'חלב טרי 3% 1 ליטר', price: 7.2 },
      { chainItemId: 2, barcode: '222', name: 'חלב עמיד 1%', price: 5.9 },
    ]);
    expect(prompt).toContain('whole milk');
    expect(prompt).toContain('2 liter');
    expect(prompt).toContain('111');
    expect(prompt).toContain('חלב עמיד 1%');
    expect(prompt).toContain('"barcode"');
    expect(prompt).toContain('"confidence"');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx jest src/tests/unit/priceComparison.prompts.test.ts`
Expected: FAIL — `Cannot find module '../../utils/priceComparison.prompts'`

- [ ] **Step 4: Write the prompts**

```ts
// services/groceryListManager/src/utils/priceComparison.prompts.ts
import { ChainProduct } from '../types/priceComparison.types';

export const getHebrewQueryPrompt = (itemName: string): string => `
You translate grocery items into Hebrew supermarket search queries.

Grocery item (English): "${itemName}"

Return the shortest Hebrew search term an Israeli shopper would type to find
this product in an online supermarket. Prefer the generic product name, no
brand, no quantity.

Respond with JSON only, exactly: {"query": "<hebrew search term>"}
`;

export const getPickProductPrompt = (
  itemName: string,
  quantity: number,
  unit: string,
  candidates: ChainProduct[],
): string => `
You match a recipe ingredient to the correct supermarket product.

Ingredient: "${itemName}", needed amount: ${quantity} ${unit}.

Candidate products (JSON array):
${JSON.stringify(
  candidates.map((c) => ({ barcode: c.barcode, name: c.name, price: c.price })),
  null,
  2,
)}

Pick the single candidate that best matches the ingredient: right product
type first, then the most standard package size for the needed amount.
If NO candidate is actually this ingredient, return null.

Respond with JSON only, exactly:
{"barcode": "<barcode of best candidate or null>", "confidence": <number 0 to 1>}
`;
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest src/tests/unit/priceComparison.prompts.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 6: Write the Gemini client (no unit test — thin I/O wrapper, mocked everywhere else)**

```ts
// services/groceryListManager/src/services/priceComparison/gemini.client.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_MODEL = 'gemini-2.5-flash';

let client: GoogleGenerativeAI | null = null;

const getClient = (): GoogleGenerativeAI => {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
    client = new GoogleGenerativeAI(apiKey);
  }
  return client;
};

/** Sends a prompt, expects a JSON response. Returns raw text or null on failure. */
export const generateJson = async (prompt: string): Promise<string | null> => {
  try {
    const model = getClient().getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: { responseMimeType: 'application/json' },
    });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    return text || null;
  } catch (error) {
    console.error('Gemini price-comparison call failed:', error);
    return null;
  }
};
```

- [ ] **Step 7: Verify the whole suite still passes**

Run: `npx jest src/tests/unit`
Expected: PASS, no regressions.

- [ ] **Step 8: Checkpoint — ask user before committing**

```bash
git add services/groceryListManager/package.json services/groceryListManager/package-lock.json services/groceryListManager/src/services/priceComparison/gemini.client.ts services/groceryListManager/src/utils/priceComparison.prompts.ts services/groceryListManager/src/tests/unit/priceComparison.prompts.test.ts
git commit -m "feat(grocerylist): add Gemini client and matching prompts"
```

---

### Task 4: Resolver service

**Files:**
- Create: `services/groceryListManager/src/services/priceComparison/resolver.service.ts`
- Test: `services/groceryListManager/src/tests/unit/resolver.service.test.ts`

**Interfaces:**
- Consumes: `PriceMatch` (Task 2), `searchCatalog` (Task 1), `generateJson` + prompts (Task 3), `GroceryItem` from `../../types/groceryList.types`.
- Produces: `resolveItem(item: GroceryItem): Promise<ResolvedMatch | null>` — null means "cannot price this item" (goes to `missing`).

**Resolution algorithm (cache → translate → search → pick → cache):**
1. `PriceMatch.findOne({ itemName })` — hit with barcode → return it; hit with `barcode: null` → return null (negative cache).
2. Gemini: English name → Hebrew query. Parse `{"query"}`; failure → null (do NOT cache — transient LLM failure must be retryable).
3. `searchCatalog(hebrewQuery)`, take top 10. Empty → cache negative, return null.
4. Gemini pick: parse `{"barcode","confidence"}`. `barcode: null` from LLM → cache negative, return null. Parse failure → null, no cache.
5. Barcode must exist in the candidate list (guard against LLM hallucinating a barcode). Save positive cache, return match.

- [ ] **Step 1: Write the failing resolver test**

```ts
// services/groceryListManager/src/tests/unit/resolver.service.test.ts
import { resolveItem } from '../../services/priceComparison/resolver.service';
import { PriceMatch } from '../../models/priceMatch.model';
import * as adapter from '../../services/priceComparison/ramiLevy.adapter';
import * as gemini from '../../services/priceComparison/gemini.client';
import { GroceryItem } from '../../types/groceryList.types';

jest.mock('../../models/priceMatch.model');
jest.mock('../../services/priceComparison/ramiLevy.adapter');
jest.mock('../../services/priceComparison/gemini.client');

const mockedPriceMatch = PriceMatch as jest.Mocked<typeof PriceMatch>;
const mockedAdapter = adapter as jest.Mocked<typeof adapter>;
const mockedGemini = gemini as jest.Mocked<typeof gemini>;

const item: GroceryItem = {
  name: 'whole milk',
  quantity: 1,
  unit: 'liter',
  category: 'Dairy' as GroceryItem['category'],
  inventoryQuantity: 0,
  checked: false,
  recipeCount: 1,
};

const milkProduct = {
  chainItemId: 419939,
  barcode: '7290001794852',
  name: 'חלב טרי 3% 1 ליטר רמי לוי',
  price: 7.2,
};

describe('resolveItem', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (mockedPriceMatch.create as jest.Mock).mockResolvedValue({});
  });

  it('returns cached match without calling Gemini', async () => {
    (mockedPriceMatch.findOne as jest.Mock).mockResolvedValue({
      itemName: 'whole milk',
      barcode: '7290001794852',
      matchedName: 'חלב טרי 3% 1 ליטר רמי לוי',
      confidence: 0.95,
    });

    const result = await resolveItem(item);

    expect(result).toEqual({
      barcode: '7290001794852',
      matchedName: 'חלב טרי 3% 1 ליטר רמי לוי',
      confidence: 0.95,
    });
    expect(mockedGemini.generateJson).not.toHaveBeenCalled();
  });

  it('returns null on cached negative match without calling Gemini', async () => {
    (mockedPriceMatch.findOne as jest.Mock).mockResolvedValue({
      itemName: 'whole milk',
      barcode: null,
      matchedName: null,
      confidence: 0,
    });

    expect(await resolveItem(item)).toBeNull();
    expect(mockedGemini.generateJson).not.toHaveBeenCalled();
  });

  it('translates, searches, picks and caches on cache miss', async () => {
    (mockedPriceMatch.findOne as jest.Mock).mockResolvedValue(null);
    mockedGemini.generateJson
      .mockResolvedValueOnce('{"query": "חלב"}')
      .mockResolvedValueOnce('{"barcode": "7290001794852", "confidence": 0.9}');
    mockedAdapter.searchCatalog.mockResolvedValue([milkProduct]);

    const result = await resolveItem(item);

    expect(mockedAdapter.searchCatalog).toHaveBeenCalledWith('חלב');
    expect(result).toEqual({
      barcode: '7290001794852',
      matchedName: 'חלב טרי 3% 1 ליטר רמי לוי',
      confidence: 0.9,
    });
    expect(mockedPriceMatch.create).toHaveBeenCalledWith(
      expect.objectContaining({
        itemName: 'whole milk',
        hebrewQuery: 'חלב',
        barcode: '7290001794852',
        confidence: 0.9,
      }),
    );
  });

  it('rejects a barcode the LLM invented (not in candidates)', async () => {
    (mockedPriceMatch.findOne as jest.Mock).mockResolvedValue(null);
    mockedGemini.generateJson
      .mockResolvedValueOnce('{"query": "חלב"}')
      .mockResolvedValueOnce('{"barcode": "9999999999999", "confidence": 0.9}');
    mockedAdapter.searchCatalog.mockResolvedValue([milkProduct]);

    expect(await resolveItem(item)).toBeNull();
    expect(mockedPriceMatch.create).not.toHaveBeenCalled();
  });

  it('caches a negative result when search returns nothing', async () => {
    (mockedPriceMatch.findOne as jest.Mock).mockResolvedValue(null);
    mockedGemini.generateJson.mockResolvedValueOnce('{"query": "אבקת חד קרן"}');
    mockedAdapter.searchCatalog.mockResolvedValue([]);

    expect(await resolveItem(item)).toBeNull();
    expect(mockedPriceMatch.create).toHaveBeenCalledWith(
      expect.objectContaining({ itemName: 'whole milk', barcode: null }),
    );
  });

  it('returns null without caching when Gemini fails (transient)', async () => {
    (mockedPriceMatch.findOne as jest.Mock).mockResolvedValue(null);
    mockedGemini.generateJson.mockResolvedValue(null);

    expect(await resolveItem(item)).toBeNull();
    expect(mockedPriceMatch.create).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/tests/unit/resolver.service.test.ts`
Expected: FAIL — `Cannot find module '../../services/priceComparison/resolver.service'`

- [ ] **Step 3: Write the resolver**

```ts
// services/groceryListManager/src/services/priceComparison/resolver.service.ts
import { PriceMatch } from '../../models/priceMatch.model';
import { GroceryItem } from '../../types/groceryList.types';
import { ResolvedMatch } from '../../types/priceComparison.types';
import {
  getHebrewQueryPrompt,
  getPickProductPrompt,
} from '../../utils/priceComparison.prompts';
import { generateJson } from './gemini.client';
import { searchCatalog } from './ramiLevy.adapter';

const MAX_CANDIDATES = 10;

const parseJson = <T>(text: string | null): T | null => {
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
};

const cacheNegative = async (itemName: string, hebrewQuery: string) => {
  await PriceMatch.create({
    itemName,
    hebrewQuery,
    barcode: null,
    matchedName: null,
    confidence: 0,
  });
};

export const resolveItem = async (
  item: GroceryItem,
): Promise<ResolvedMatch | null> => {
  const itemName = item.name.toLowerCase().trim();

  // 1. cache
  const cached = await PriceMatch.findOne({ itemName });
  if (cached) {
    if (!cached.barcode) return null; // negative cache
    return {
      barcode: cached.barcode,
      matchedName: cached.matchedName ?? '',
      confidence: cached.confidence,
    };
  }

  // 2. English name -> Hebrew search query (transient failure: no caching)
  const queryJson = parseJson<{ query?: string }>(
    await generateJson(getHebrewQueryPrompt(itemName)),
  );
  const hebrewQuery = queryJson?.query?.trim();
  if (!hebrewQuery) return null;

  // 3. search the chain catalog
  const candidates = (await searchCatalog(hebrewQuery)).slice(0, MAX_CANDIDATES);
  if (candidates.length === 0) {
    await cacheNegative(itemName, hebrewQuery);
    return null;
  }

  // 4. LLM picks the best candidate
  const pick = parseJson<{ barcode?: string | null; confidence?: number }>(
    await generateJson(
      getPickProductPrompt(itemName, item.quantity, item.unit, candidates),
    ),
  );
  if (!pick) return null; // transient failure: no caching
  if (!pick.barcode) {
    await cacheNegative(itemName, hebrewQuery); // LLM says: none of these
    return null;
  }

  // 5. guard: the barcode must come from the candidate list
  const chosen = candidates.find((c) => c.barcode === pick.barcode);
  if (!chosen) return null;

  const confidence = Math.min(Math.max(pick.confidence ?? 0, 0), 1);
  await PriceMatch.create({
    itemName,
    hebrewQuery,
    barcode: chosen.barcode,
    matchedName: chosen.name,
    confidence,
  });

  return { barcode: chosen.barcode, matchedName: chosen.name, confidence };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/tests/unit/resolver.service.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Checkpoint — ask user before committing**

```bash
git add services/groceryListManager/src/services/priceComparison/resolver.service.ts services/groceryListManager/src/tests/unit/resolver.service.test.ts
git commit -m "feat(grocerylist): add item-to-product resolver with match cache"
```

---

### Task 5: Price-comparison service

**Files:**
- Create: `services/groceryListManager/src/services/priceComparison/priceComparison.service.ts`
- Test: `services/groceryListManager/src/tests/unit/priceComparison.service.test.ts`

**Interfaces:**
- Consumes: `GroceryList` model, `resolveItem` (Task 4), `getByBarcode` (Task 1), `NotFoundError` from `../../types/errors`, result types (Task 1).
- Produces: `comparePrices(userId: string): Promise<PriceComparisonResult>`.

**Rules:**
- Only unchecked items are priced (checked = already in pantry).
- Item resolves but `getByBarcode` returns null (delisted product) → item goes to `missing` (v1; re-resolution is a later improvement).
- Delivery constant: `ESTIMATED_DELIVERY_ILS = 30`. **Before merging, open rami-levy.co.il checkout and update this number to the current fee** — it is a data fact, not a code decision.
- Money math: round each line and the totals to 2 decimals (`round2` helper) — floating point ILS.

- [ ] **Step 1: Write the failing service test**

```ts
// services/groceryListManager/src/tests/unit/priceComparison.service.test.ts
import { comparePrices } from '../../services/priceComparison/priceComparison.service';
import { GroceryList } from '../../models/groceryList.model';
import * as resolver from '../../services/priceComparison/resolver.service';
import * as adapter from '../../services/priceComparison/ramiLevy.adapter';
import { NotFoundError } from '../../types/errors';

jest.mock('../../models/groceryList.model');
jest.mock('../../services/priceComparison/resolver.service');
jest.mock('../../services/priceComparison/ramiLevy.adapter');

const mockedList = GroceryList as jest.Mocked<typeof GroceryList>;
const mockedResolver = resolver as jest.Mocked<typeof resolver>;
const mockedAdapter = adapter as jest.Mocked<typeof adapter>;

const listWith = (items: unknown[]) =>
  (mockedList.findOne as jest.Mock).mockResolvedValue({ items });

const groceryItem = (name: string, checked = false) => ({
  name,
  quantity: 1,
  unit: 'piece',
  category: 'Other',
  inventoryQuantity: 0,
  checked,
  recipeCount: 1,
});

describe('comparePrices', () => {
  beforeEach(() => jest.resetAllMocks());

  it('throws NotFoundError when the list is empty or absent', async () => {
    (mockedList.findOne as jest.Mock).mockResolvedValue(null);
    await expect(comparePrices('u1')).rejects.toThrow(NotFoundError);
  });

  it('prices resolved items and totals with delivery', async () => {
    listWith([groceryItem('milk'), groceryItem('bread')]);
    mockedResolver.resolveItem
      .mockResolvedValueOnce({ barcode: '111', matchedName: 'חלב', confidence: 0.9 })
      .mockResolvedValueOnce({ barcode: '222', matchedName: 'לחם', confidence: 0.8 });
    mockedAdapter.getByBarcode
      .mockResolvedValueOnce({ chainItemId: 1, barcode: '111', name: 'חלב', price: 7.2 })
      .mockResolvedValueOnce({ chainItemId: 2, barcode: '222', name: 'לחם', price: 8.9 });

    const result = await comparePrices('u1');

    expect(result.chain).toBe('rami-levy');
    expect(result.items).toHaveLength(2);
    expect(result.subtotal).toBe(16.1);
    expect(result.estimatedDelivery).toBe(30);
    expect(result.total).toBe(46.1);
    expect(result.missing).toEqual([]);
    expect(result.disclaimer).toContain('הערכה');
    expect(new Date(result.pricesAsOf).getTime()).not.toBeNaN();
  });

  it('puts unresolved and unpriceable items into missing', async () => {
    listWith([groceryItem('milk'), groceryItem('unicorn dust')]);
    mockedResolver.resolveItem
      .mockResolvedValueOnce({ barcode: '111', matchedName: 'חלב', confidence: 0.9 })
      .mockResolvedValueOnce(null); // unresolvable
    mockedAdapter.getByBarcode.mockResolvedValueOnce(null); // delisted

    const result = await comparePrices('u1');

    expect(result.items).toHaveLength(0);
    expect(result.missing).toEqual(['milk', 'unicorn dust']);
    expect(result.subtotal).toBe(0);
  });

  it('skips checked items entirely', async () => {
    listWith([groceryItem('milk', true)]);

    const result = await comparePrices('u1');

    expect(mockedResolver.resolveItem).not.toHaveBeenCalled();
    expect(result.items).toEqual([]);
    expect(result.missing).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/tests/unit/priceComparison.service.test.ts`
Expected: FAIL — `Cannot find module '../../services/priceComparison/priceComparison.service'`

- [ ] **Step 3: Write the service**

```ts
// services/groceryListManager/src/services/priceComparison/priceComparison.service.ts
import { GroceryList } from '../../models/groceryList.model';
import { NotFoundError } from '../../types/errors';
import {
  ComparedItem,
  PriceComparisonResult,
} from '../../types/priceComparison.types';
import { getByBarcode } from './ramiLevy.adapter';
import { resolveItem } from './resolver.service';

// Verify against rami-levy.co.il checkout before release; update as needed.
const ESTIMATED_DELIVERY_ILS = 30;

const DISCLAIMER =
  'המחירים הם הערכה בלבד ועשויים להשתנות באתר הרשת. מבצעים ומחירי מועדון אינם כלולים.';

const round2 = (n: number): number => Math.round(n * 100) / 100;

export const comparePrices = async (
  userId: string,
): Promise<PriceComparisonResult> => {
  const list = await GroceryList.findOne({ userId });
  if (!list || list.items.length === 0) {
    throw new NotFoundError('Grocery list is empty');
  }

  const toBuy = list.items.filter((item) => !item.checked);
  const compared: ComparedItem[] = [];
  const missing: string[] = [];

  for (const item of toBuy) {
    const match = await resolveItem(item);
    if (!match) {
      missing.push(item.name);
      continue;
    }

    const product = await getByBarcode(match.barcode);
    if (!product) {
      missing.push(item.name); // resolved but delisted at the chain
      continue;
    }

    const packagesAssumed = 1; // v1 simplification — see design doc §2 QUANTIFY
    compared.push({
      itemName: item.name,
      matchedProductName: product.name,
      barcode: product.barcode,
      unitPrice: product.price,
      packagesAssumed,
      lineTotal: round2(product.price * packagesAssumed),
    });
  }

  const subtotal = round2(
    compared.reduce((sum, line) => sum + line.lineTotal, 0),
  );

  return {
    chain: 'rami-levy',
    currency: 'ILS',
    items: compared,
    missing,
    subtotal,
    estimatedDelivery: ESTIMATED_DELIVERY_ILS,
    total: round2(subtotal + ESTIMATED_DELIVERY_ILS),
    pricesAsOf: new Date().toISOString(),
    disclaimer: DISCLAIMER,
  };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/tests/unit/priceComparison.service.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Verify the delivery fee**

Open `https://www.rami-levy.co.il` checkout/FAQ, find the current online delivery fee, and update `ESTIMATED_DELIVERY_ILS` if it is not 30. Record the date in a comment.

- [ ] **Step 6: Checkpoint — ask user before committing**

```bash
git add services/groceryListManager/src/services/priceComparison/priceComparison.service.ts services/groceryListManager/src/tests/unit/priceComparison.service.test.ts
git commit -m "feat(grocerylist): add Rami Levy price comparison service"
```

---

### Task 6: Controller, route, swagger + integration test

**Files:**
- Create: `services/groceryListManager/src/controllers/priceComparison.controller.ts`
- Modify: `services/groceryListManager/src/routes/groceryList.routes.ts` (add route before the `export default router` line, after the last existing route)
- Test: `services/groceryListManager/src/tests/integration/priceComparison.routes.test.ts`

**Interfaces:**
- Consumes: `comparePrices(userId)` (Task 5), `NotFoundError`, existing `authMiddleware` (already applied router-wide via `router.use(authMiddleware)`).
- Produces: `GET /grocerylist/users/{userId}/price-comparison` → 200 `PriceComparisonResult` | 404 `{ error }` | 502 `{ error }`.

- [ ] **Step 1: Read the existing integration test setup**

Read `services/groceryListManager/src/tests/integration/groceryList.routes.test.ts` and copy its app/auth/mocking setup exactly (how it builds the express app, how it satisfies `authMiddleware`). The test below shows intent; align its scaffolding with what that file actually does.

- [ ] **Step 2: Write the failing integration test**

```ts
// services/groceryListManager/src/tests/integration/priceComparison.routes.test.ts
// NOTE: mirror the app + auth setup used in groceryList.routes.test.ts
import request from 'supertest';
import * as priceComparisonService from '../../services/priceComparison/priceComparison.service';
import { NotFoundError } from '../../types/errors';

jest.mock('../../services/priceComparison/priceComparison.service');
// + the same auth/app mocks groceryList.routes.test.ts uses

const mockedService = priceComparisonService as jest.Mocked<
  typeof priceComparisonService
>;

// `app` obtained the same way groceryList.routes.test.ts obtains it
declare const app: unknown;

describe('GET /grocerylist/users/:userId/price-comparison', () => {
  beforeEach(() => jest.resetAllMocks());

  it('returns 200 with the comparison result', async () => {
    mockedService.comparePrices.mockResolvedValue({
      chain: 'rami-levy',
      currency: 'ILS',
      items: [],
      missing: ['milk'],
      subtotal: 0,
      estimatedDelivery: 30,
      total: 30,
      pricesAsOf: '2026-07-13T00:00:00.000Z',
      disclaimer: 'המחירים הם הערכה בלבד',
    });

    const res = await request(app as never)
      .get('/grocerylist/users/u1/price-comparison')
      .set('Authorization', 'Bearer test'); // match existing test auth

    expect(res.status).toBe(200);
    expect(res.body.chain).toBe('rami-levy');
    expect(mockedService.comparePrices).toHaveBeenCalledWith('u1');
  });

  it('returns 404 when the grocery list is empty', async () => {
    mockedService.comparePrices.mockRejectedValue(
      new NotFoundError('Grocery list is empty'),
    );

    const res = await request(app as never)
      .get('/grocerylist/users/u1/price-comparison')
      .set('Authorization', 'Bearer test');

    expect(res.status).toBe(404);
  });

  it('returns 502 on upstream failure', async () => {
    mockedService.comparePrices.mockRejectedValue(new Error('catalog down'));

    const res = await request(app as never)
      .get('/grocerylist/users/u1/price-comparison')
      .set('Authorization', 'Bearer test');

    expect(res.status).toBe(502);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx jest src/tests/integration/priceComparison.routes.test.ts`
Expected: FAIL — route does not exist (404) / controller module missing.

- [ ] **Step 4: Write the controller**

```ts
// services/groceryListManager/src/controllers/priceComparison.controller.ts
import { Request, Response } from 'express';
import { comparePrices } from '../services/priceComparison/priceComparison.service';
import { NotFoundError } from '../types/errors';

export const getPriceComparison = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { userId } = req.params;
    const result = await comparePrices(userId);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    console.error('Price comparison failed:', error);
    res.status(502).json({ error: 'Price comparison is unavailable right now' });
  }
};
```

(If the existing controllers use a different error-handling convention — e.g. a shared error middleware via `next(error)` — follow that convention instead; the response codes stay 200/404/502.)

- [ ] **Step 5: Add the route with swagger docs**

Add to `services/groceryListManager/src/routes/groceryList.routes.ts`, after the last route, before the default export. Add the import at the top with the other imports:

```ts
import * as PriceComparisonController from '../controllers/priceComparison.controller';
```

```ts
/**
 * @swagger
 * /grocerylist/users/{userId}/price-comparison:
 *   get:
 *     summary: Estimate the grocery list total at Rami Levy's online store
 *     description: >
 *       Resolves each unchecked grocery item to a Rami Levy product and sums
 *       current online prices. Totals are an estimate only (promotions and
 *       club prices are not included). Unmatched items are listed in `missing`.
 *     tags: [GroceryList]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Price comparison result (estimate)
 *       404:
 *         description: Grocery list is empty
 *       502:
 *         description: Supermarket catalog or AI matching unavailable
 */
router.get(
  '/users/:userId/price-comparison',
  PriceComparisonController.getPriceComparison,
);
```

- [ ] **Step 6: Run the integration test to verify it passes**

Run: `npx jest src/tests/integration/priceComparison.routes.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 7: Run the entire service test suite + lint**

Run (from `services/groceryListManager`): `npm test` then `npm run lint`
Expected: all tests pass, no lint errors.

- [ ] **Step 8: Live smoke test (manual, needs GEMINI_API_KEY in .env)**

Start the service (`npm run dev`), add a couple of items to a test user's list, then:
`GET /grocerylist/users/<testUserId>/price-comparison` (with a valid JWT).
Expected: 200 JSON with real Rami Levy prices, Hebrew `matchedProductName`s, `missing` for anything unmatched, and the disclaimer. Verify a second call is fast (cache hit — no Gemini calls in logs).

- [ ] **Step 9: Checkpoint — ask user before committing**

```bash
git add services/groceryListManager/src/controllers/priceComparison.controller.ts services/groceryListManager/src/routes/groceryList.routes.ts services/groceryListManager/src/tests/integration/priceComparison.routes.test.ts
git commit -m "feat(grocerylist): expose price-comparison endpoint"
```

---

## Out of scope for this plan (see design doc)

- Additional chains (Shufersal etc.) — adapter interface is in place.
- Transparency-feed ingest fallback.
- Package-quantity math (QUANTIFY) — v1 assumes 1 package per item.
- Promotions / club prices.
- Push-to-cart (Phase 2).
- Client UI for the compare screen.
