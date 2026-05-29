# Recipe Suggestions ("Suggested for you") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On the recipe page, offer the user personalized alternative recipes based on what they liked before, then let them swap the current recipe in its meal-plan slot.

**Architecture:** A new `recommendation/` module inside the existing `mealPlanner` service. Spoonacular `complexSearch` fetches candidates filtered by inferred cuisines + diet + allergies + meal type; candidates are re-ranked by cosine similarity between their embedding and a "taste profile" centroid built from the user's liked recipes (cold start blends the current recipe + preferences). Embeddings are cached on the `Recipe` document and cosine is computed in Node. A provider-agnostic `AiProvider` interface supplies embeddings; if no AI key is configured the engine gracefully degrades to cuisine-filtered Spoonacular ordering.

**Tech Stack:** Node + TypeScript, Express 5, Mongoose 8, Axios, Jest + ts-jest + supertest (backend); React 19 + TypeScript + MUI 7 + Axios (client).

**Scope:** Phases 1–4 of the spec (schema, engine, suggestions endpoint, replace endpoint, client drawer, optional LLM "why"). The "Add extra meal / variable meals per day" feature (phase 5) is **out of scope** and will get its own spec.

**Reference spec:** `docs/superpowers/specs/2026-05-29-recipe-suggestions-design.md`

**Conventions to follow:**
- Backend layering: `routes → controllers → services`. Controllers read `(req as AuthRequest).user?._id` for the user id and pass it down.
- Tests live in `services/mealPlanner/src/tests/` (Jest `roots` is `<rootDir>/src/tests/`). Run with `npm test --prefix services/mealPlanner`.
- Env vars: `SPOONACULAR_API_KEY`, `USER_MANAGMENT_URL` (note the existing spelling), and new `AI_PROVIDER`, `GEMINI_API_KEY`.
- Commit messages must NOT mention any AI assistant or co-author.

---

## File Structure

**Create (backend):**
- `services/mealPlanner/src/recommendation/embeddingText.ts` — pure: a recipe-like object → embedding input string.
- `services/mealPlanner/src/recommendation/vectorMath.ts` — pure: `cosineSimilarity`, `meanVector`.
- `services/mealPlanner/src/recommendation/tasteProfile.ts` — build the taste profile (centroid + cuisines) with cold-start fallback.
- `services/mealPlanner/src/recommendation/ranker.ts` — rank candidates by cosine, apply exclusions.
- `services/mealPlanner/src/recommendation/recommendationService.ts` — orchestration.
- `services/mealPlanner/src/recommendation/recommendationController.ts` — HTTP layer for suggestions.
- `services/mealPlanner/src/ai/aiProvider.ts` — `AiProvider` interface + `NullAiProvider` + `getAiProvider()` factory.
- `services/mealPlanner/src/ai/geminiProvider.ts` — concrete Gemini embeddings provider.
- `services/mealPlanner/src/tests/vectorMath.test.ts`
- `services/mealPlanner/src/tests/embeddingText.test.ts`
- `services/mealPlanner/src/tests/tasteProfile.test.ts`
- `services/mealPlanner/src/tests/ranker.test.ts`
- `services/mealPlanner/src/tests/suggestions.endpoint.test.ts`
- `services/mealPlanner/src/tests/replaceMeal.endpoint.test.ts`

**Modify (backend):**
- `services/mealPlanner/src/models/recipeModel.ts` — add `cuisines`, `dishTypes`, `embedding`.
- `services/mealPlanner/src/services/spoonacularService.service.ts` — add `searchRecipes` (complexSearch).
- `services/mealPlanner/src/services/mealPlannerService.ts` — persist `cuisines`/`dishTypes` in `getRecipeDetails`; add `replaceMeal`.
- `services/mealPlanner/src/controllers/mealPlannerController.ts` — add `replaceMeal`.
- `services/mealPlanner/src/routes/mealPlannerRouter.ts` — add suggestions + replace routes.

**Create / Modify (client):**
- `client/src/features/mealPlanner/api/mealPlanner.ts` — add `getSuggestions`, `replaceMeal`.
- `client/src/features/mealPlanner/types/mealPlanner.ts` — add `RecipeSuggestion` type.
- `client/src/features/mealPlanner/components/SuggestionsDrawer.tsx` — **create**, the alternatives UI.
- `client/src/pages/RecipeDetail.tsx` — add the "Suggested for you" button + drawer + read `date`/`mealType` from query.
- `client/src/pages/MealPlanner.tsx` — thread `date` + `mealType` into the recipe navigation.

---

## Task 1: Add `cuisines`, `dishTypes`, `embedding` to the Recipe model

**Files:**
- Modify: `services/mealPlanner/src/models/recipeModel.ts`

- [ ] **Step 1: Extend the `IRecipe` interface and schema**

In `recipeModel.ts`, add three fields to the interface (after `diets?: string[];`):

```typescript
  diets?: string[];
  cuisines?: string[];
  dishTypes?: string[];
  embedding?: number[];
  isLiked?: boolean;
```

And to the schema (after `diets: [{ type: String }],`):

```typescript
  diets: [{ type: String }],
  cuisines: [{ type: String }],
  dishTypes: [{ type: String }],
  embedding: { type: [Number], default: undefined },
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --project services/mealPlanner/tsconfig.json`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add services/mealPlanner/src/models/recipeModel.ts
git commit -m "feat(mealPlanner): add cuisines, dishTypes, embedding to Recipe model"
```

---

## Task 2: Vector math (pure functions, TDD)

**Files:**
- Create: `services/mealPlanner/src/recommendation/vectorMath.ts`
- Test: `services/mealPlanner/src/tests/vectorMath.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// services/mealPlanner/src/tests/vectorMath.test.ts
import { cosineSimilarity, meanVector } from "../recommendation/vectorMath";

describe("cosineSimilarity", () => {
  it("returns 1 for identical direction", () => {
    expect(cosineSimilarity([1, 0], [2, 0])).toBeCloseTo(1);
  });

  it("returns 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it("returns 0 when either vector is empty or zero-length", () => {
    expect(cosineSimilarity([], [1, 2])).toBe(0);
    expect(cosineSimilarity([0, 0], [1, 2])).toBe(0);
  });

  it("returns 0 when lengths differ", () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2])).toBe(0);
  });
});

describe("meanVector", () => {
  it("averages component-wise", () => {
    expect(meanVector([[2, 4], [4, 8]])).toEqual([3, 6]);
  });

  it("returns [] for empty input", () => {
    expect(meanVector([])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test --prefix services/mealPlanner -- vectorMath`
Expected: FAIL — cannot find module `../recommendation/vectorMath`.

- [ ] **Step 3: Write the implementation**

```typescript
// services/mealPlanner/src/recommendation/vectorMath.ts
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function meanVector(vectors: number[][]): number[] {
  if (vectors.length === 0) return [];
  const dim = vectors[0].length;
  const sum = new Array(dim).fill(0);
  for (const v of vectors) {
    for (let i = 0; i < dim; i++) sum[i] += v[i];
  }
  return sum.map((x) => x / vectors.length);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test --prefix services/mealPlanner -- vectorMath`
Expected: PASS (6 assertions).

- [ ] **Step 5: Commit**

```bash
git add services/mealPlanner/src/recommendation/vectorMath.ts services/mealPlanner/src/tests/vectorMath.test.ts
git commit -m "feat(mealPlanner): add vector math helpers for recommendations"
```

---

## Task 3: Embedding text builder (pure, TDD)

**Files:**
- Create: `services/mealPlanner/src/recommendation/embeddingText.ts`
- Test: `services/mealPlanner/src/tests/embeddingText.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// services/mealPlanner/src/tests/embeddingText.test.ts
import { buildEmbeddingText, EmbeddingInput } from "../recommendation/embeddingText";

describe("buildEmbeddingText", () => {
  it("combines name, cuisines, dishTypes, diets and up to 8 ingredient names", () => {
    const input: EmbeddingInput = {
      name: "Pad Thai",
      cuisines: ["Thai", "Asian"],
      dishTypes: ["main course"],
      diets: ["dairy free"],
      ingredients: Array.from({ length: 10 }, (_, i) => ({ name: `ing${i}` })),
    };
    const text = buildEmbeddingText(input);
    expect(text).toContain("Pad Thai");
    expect(text).toContain("Thai");
    expect(text).toContain("main course");
    expect(text).toContain("dairy free");
    expect(text).toContain("ing0");
    expect(text).toContain("ing7");
    expect(text).not.toContain("ing8");
  });

  it("handles missing optional fields", () => {
    expect(buildEmbeddingText({ name: "Toast" })).toBe("Toast");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test --prefix services/mealPlanner -- embeddingText`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```typescript
// services/mealPlanner/src/recommendation/embeddingText.ts
export interface EmbeddingInput {
  name: string;
  cuisines?: string[];
  dishTypes?: string[];
  diets?: string[];
  ingredients?: { name: string }[];
}

export function buildEmbeddingText(input: EmbeddingInput): string {
  const parts: string[] = [input.name];
  if (input.cuisines?.length) parts.push(input.cuisines.join(" "));
  if (input.dishTypes?.length) parts.push(input.dishTypes.join(" "));
  if (input.diets?.length) parts.push(input.diets.join(" "));
  if (input.ingredients?.length) {
    parts.push(input.ingredients.slice(0, 8).map((i) => i.name).join(" "));
  }
  return parts.join(" ").trim();
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test --prefix services/mealPlanner -- embeddingText`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add services/mealPlanner/src/recommendation/embeddingText.ts services/mealPlanner/src/tests/embeddingText.test.ts
git commit -m "feat(mealPlanner): add embedding text builder"
```

---

## Task 4: AiProvider interface, NullAiProvider, factory, Gemini provider

**Files:**
- Create: `services/mealPlanner/src/ai/aiProvider.ts`
- Create: `services/mealPlanner/src/ai/geminiProvider.ts`

This task has no unit test (it is thin I/O + wiring; it is exercised via the engine tests in Task 6 with an injected mock).

- [ ] **Step 1: Write the interface, NullAiProvider, and factory**

```typescript
// services/mealPlanner/src/ai/aiProvider.ts
export interface AiProvider {
  // Returns one embedding vector per input text, in order.
  // Returns [] (per text) when embeddings are unavailable.
  embed(texts: string[]): Promise<number[][]>;
}

// Used when no AI key is configured. Produces no embeddings,
// which makes the engine fall back to Spoonacular's own ordering.
export class NullAiProvider implements AiProvider {
  async embed(texts: string[]): Promise<number[][]> {
    return texts.map(() => []);
  }
}

let cached: AiProvider | null = null;

export function getAiProvider(): AiProvider {
  if (cached) return cached;
  if (process.env.AI_PROVIDER === "gemini" && process.env.GEMINI_API_KEY) {
    // Lazy require so the SDK is only loaded when actually used.
    const { GeminiProvider } = require("./geminiProvider");
    cached = new GeminiProvider(process.env.GEMINI_API_KEY);
  } else {
    cached = new NullAiProvider();
  }
  return cached;
}

// Test seam: allows tests to inject a fake provider.
export function __setAiProvider(provider: AiProvider | null): void {
  cached = provider;
}
```

- [ ] **Step 2: Write the Gemini provider**

> Requires the dependency: `npm install @google/generative-ai --prefix services/mealPlanner`

```typescript
// services/mealPlanner/src/ai/geminiProvider.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AiProvider } from "./aiProvider";

export class GeminiProvider implements AiProvider {
  private model;

  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  }

  async embed(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    for (const text of texts) {
      try {
        const res = await this.model.embedContent(text);
        results.push(res.embedding.values);
      } catch (err) {
        console.error("Gemini embed failed for text:", err);
        results.push([]);
      }
    }
    return results;
  }
}
```

- [ ] **Step 3: Install the dependency and verify compilation**

Run:
```bash
npm install @google/generative-ai --prefix services/mealPlanner
npx tsc --noEmit --project services/mealPlanner/tsconfig.json
```
Expected: no type errors.

- [ ] **Step 4: Commit**

```bash
git add services/mealPlanner/src/ai/ services/mealPlanner/package.json services/mealPlanner/package-lock.json
git commit -m "feat(mealPlanner): add AI provider interface with Gemini embeddings"
```

---

## Task 5: Spoonacular `complexSearch` wrapper

**Files:**
- Modify: `services/mealPlanner/src/services/spoonacularService.service.ts`

- [ ] **Step 1: Add a typed `searchRecipes` function**

Append to `spoonacularService.service.ts`:

```typescript
export interface SpoonacularSearchParams {
  cuisines?: string[];
  diet?: string;
  intolerances?: string;
  type?: string; // breakfast | main course | ...
  number?: number;
}

export interface SpoonacularSearchResult {
  id: number;
  title: string;
  image?: string;
  readyInMinutes?: number;
  cuisines?: string[];
  dishTypes?: string[];
  diets?: string[];
  nutrition?: { nutrients: { name: string; amount: number }[] };
}

export const searchRecipes = async (
  params: SpoonacularSearchParams,
): Promise<SpoonacularSearchResult[]> => {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) throw new Error("SPOONACULAR_API_KEY is not set");

  const query = new URLSearchParams({
    apiKey,
    number: String(params.number ?? 12),
    addRecipeInformation: "true",
    addRecipeNutrition: "true",
    sort: "popularity",
  });
  if (params.cuisines?.length) query.set("cuisine", params.cuisines.join(","));
  if (params.diet) query.set("diet", params.diet);
  if (params.intolerances) query.set("intolerances", params.intolerances);
  if (params.type) query.set("type", params.type);

  const url = `https://api.spoonacular.com/recipes/complexSearch?${query.toString()}`;
  const response = await axios.get(url);
  return response.data.results ?? [];
};
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit --project services/mealPlanner/tsconfig.json`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add services/mealPlanner/src/services/spoonacularService.service.ts
git commit -m "feat(mealPlanner): add Spoonacular complexSearch wrapper"
```

---

## Task 6: Taste profile builder (TDD with injected provider + model)

**Files:**
- Create: `services/mealPlanner/src/recommendation/tasteProfile.ts`
- Test: `services/mealPlanner/src/tests/tasteProfile.test.ts`

`buildTasteProfile` takes its dependencies as arguments so it is unit-testable without a DB or network:
- `likedRecipes`: array of recipe-like objects already loaded by the caller (name, cuisines, dishTypes, diets, ingredients, embedding?).
- `currentRecipe`: the recipe being replaced (same shape).
- `prefs`: `{ diet?: string; healthGoal?: string }`.
- `provider`: `AiProvider`.

- [ ] **Step 1: Write the failing test**

```typescript
// services/mealPlanner/src/tests/tasteProfile.test.ts
import { buildTasteProfile, TasteRecipe } from "../recommendation/tasteProfile";
import { AiProvider } from "../ai/aiProvider";

const fakeProvider = (vec: number[]): AiProvider => ({
  embed: async (texts) => texts.map(() => vec),
});

const recipe = (over: Partial<TasteRecipe> = {}): TasteRecipe => ({
  name: "Pad Thai",
  cuisines: ["Thai"],
  dishTypes: ["main course"],
  diets: [],
  ingredients: [],
  ...over,
});

describe("buildTasteProfile", () => {
  it("uses liked recipes when there are at least MIN_LIKES (3)", async () => {
    const liked = [
      recipe({ cuisines: ["Thai"] }),
      recipe({ cuisines: ["Thai", "Asian"] }),
      recipe({ cuisines: ["Japanese"] }),
    ];
    const profile = await buildTasteProfile({
      likedRecipes: liked,
      currentRecipe: recipe({ cuisines: ["Italian"] }),
      prefs: { diet: "vegetarian" },
      provider: fakeProvider([1, 0, 0]),
    });
    expect(profile.centroid).toEqual([1, 0, 0]);
    expect(profile.cuisines[0]).toBe("Thai"); // most frequent across liked
    expect(profile.diet).toBe("vegetarian");
  });

  it("cold-starts from the current recipe + prefs when likes are sparse", async () => {
    const profile = await buildTasteProfile({
      likedRecipes: [recipe()],
      currentRecipe: recipe({ cuisines: ["Mexican"] }),
      prefs: { diet: "vegan", healthGoal: "weight_loss" },
      provider: fakeProvider([0, 1, 0]),
    });
    expect(profile.centroid).toEqual([0, 1, 0]);
    expect(profile.cuisines).toEqual(["Mexican"]);
  });

  it("returns an empty centroid when the provider yields no embeddings", async () => {
    const profile = await buildTasteProfile({
      likedRecipes: [recipe(), recipe(), recipe()],
      currentRecipe: recipe(),
      prefs: {},
      provider: { embed: async (t) => t.map(() => []) },
    });
    expect(profile.centroid).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test --prefix services/mealPlanner -- tasteProfile`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```typescript
// services/mealPlanner/src/recommendation/tasteProfile.ts
import { AiProvider } from "../ai/aiProvider";
import { buildEmbeddingText } from "./embeddingText";
import { meanVector } from "./vectorMath";

export const MIN_LIKES = 3;

export interface TasteRecipe {
  name: string;
  cuisines?: string[];
  dishTypes?: string[];
  diets?: string[];
  ingredients?: { name: string }[];
  embedding?: number[];
}

export interface TasteProfile {
  centroid: number[];
  cuisines: string[];
  diet?: string;
  healthGoal?: string;
}

interface BuildArgs {
  likedRecipes: TasteRecipe[];
  currentRecipe: TasteRecipe;
  prefs: { diet?: string; healthGoal?: string };
  provider: AiProvider;
}

function topCuisines(recipes: TasteRecipe[], limit = 3): string[] {
  const counts = new Map<string, number>();
  for (const r of recipes) {
    for (const c of r.cuisines ?? []) counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([c]) => c);
}

export async function buildTasteProfile(args: BuildArgs): Promise<TasteProfile> {
  const { likedRecipes, currentRecipe, prefs, provider } = args;

  if (likedRecipes.length >= MIN_LIKES) {
    const texts = likedRecipes.map(buildEmbeddingText);
    const vectors = (await provider.embed(texts)).filter((v) => v.length > 0);
    return {
      centroid: meanVector(vectors),
      cuisines: topCuisines(likedRecipes),
      diet: prefs.diet,
      healthGoal: prefs.healthGoal,
    };
  }

  // Cold start: blend current recipe traits + preferences.
  const prefsText = [prefs.diet, prefs.healthGoal].filter(Boolean).join(" ");
  const seedText = `${buildEmbeddingText(currentRecipe)} ${prefsText}`.trim();
  const [seedVec] = await provider.embed([seedText]);
  return {
    centroid: seedVec ?? [],
    cuisines: currentRecipe.cuisines ?? [],
    diet: prefs.diet,
    healthGoal: prefs.healthGoal,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test --prefix services/mealPlanner -- tasteProfile`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add services/mealPlanner/src/recommendation/tasteProfile.ts services/mealPlanner/src/tests/tasteProfile.test.ts
git commit -m "feat(mealPlanner): build taste profile from liked recipes with cold-start fallback"
```

---

## Task 7: Ranker (TDD)

**Files:**
- Create: `services/mealPlanner/src/recommendation/ranker.ts`
- Test: `services/mealPlanner/src/tests/ranker.test.ts`

The ranker takes candidates that already carry an `embedding`, scores them by cosine against the centroid, excludes ids, and returns the top N. When the centroid is empty (no embeddings available) it preserves the incoming order with `score: 0` — the graceful-degrade path.

- [ ] **Step 1: Write the failing test**

```typescript
// services/mealPlanner/src/tests/ranker.test.ts
import { rankCandidates, RankCandidate } from "../recommendation/ranker";

const cand = (id: string, embedding: number[]): RankCandidate => ({
  originRecipeId: id,
  name: `recipe ${id}`,
  embedding,
});

describe("rankCandidates", () => {
  it("orders by cosine similarity to the centroid, descending", () => {
    const result = rankCandidates({
      candidates: [cand("a", [0, 1]), cand("b", [1, 0]), cand("c", [0.9, 0.1])],
      centroid: [1, 0],
      excludeIds: [],
      limit: 3,
    });
    expect(result.map((r) => r.originRecipeId)).toEqual(["b", "c", "a"]);
    expect(result[0].score).toBeCloseTo(1);
  });

  it("excludes given ids and respects the limit", () => {
    const result = rankCandidates({
      candidates: [cand("a", [1, 0]), cand("b", [1, 0]), cand("c", [1, 0])],
      centroid: [1, 0],
      excludeIds: ["a"],
      limit: 1,
    });
    expect(result).toHaveLength(1);
    expect(result[0].originRecipeId).not.toBe("a");
  });

  it("preserves order with score 0 when the centroid is empty", () => {
    const result = rankCandidates({
      candidates: [cand("a", []), cand("b", [])],
      centroid: [],
      excludeIds: [],
      limit: 2,
    });
    expect(result.map((r) => r.originRecipeId)).toEqual(["a", "b"]);
    expect(result[0].score).toBe(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test --prefix services/mealPlanner -- ranker`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```typescript
// services/mealPlanner/src/recommendation/ranker.ts
import { cosineSimilarity } from "./vectorMath";

export interface RankCandidate {
  originRecipeId: string;
  name: string;
  image?: string;
  calories?: number;
  readyInMinutes?: number;
  embedding: number[];
}

export interface RankedSuggestion {
  originRecipeId: string;
  name: string;
  image?: string;
  calories?: number;
  readyInMinutes?: number;
  score: number;
}

interface RankArgs {
  candidates: RankCandidate[];
  centroid: number[];
  excludeIds: string[];
  limit: number;
}

export function rankCandidates(args: RankArgs): RankedSuggestion[] {
  const { candidates, centroid, excludeIds, limit } = args;
  const exclude = new Set(excludeIds);
  const filtered = candidates.filter((c) => !exclude.has(c.originRecipeId));

  const scored = filtered.map((c) => ({
    originRecipeId: c.originRecipeId,
    name: c.name,
    image: c.image,
    calories: c.calories,
    readyInMinutes: c.readyInMinutes,
    score: centroid.length ? cosineSimilarity(c.embedding, centroid) : 0,
  }));

  if (centroid.length) scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test --prefix services/mealPlanner -- ranker`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add services/mealPlanner/src/recommendation/ranker.ts services/mealPlanner/src/tests/ranker.test.ts
git commit -m "feat(mealPlanner): add candidate ranker with cosine scoring and exclusions"
```

---

## Task 8: Recommendation service (orchestration)

**Files:**
- Create: `services/mealPlanner/src/recommendation/recommendationService.ts`

This wires the pieces: load likes + current recipe + prefs, build the profile, search Spoonacular, embed candidates (caching to `Recipe`), rank, return. It has no unit test of its own (it is I/O orchestration); it is covered by the endpoint test in Task 9 with the service's collaborators mocked, plus the unit-tested pieces it composes.

- [ ] **Step 1: Map a meal type to a Spoonacular `type`**

Create the service file:

```typescript
// services/mealPlanner/src/recommendation/recommendationService.ts
import axios from "axios";
import { Recipe } from "../models/recipeModel";
import { UserFavorites } from "../models/userFavoritesModel";
import { getAiProvider } from "../ai/aiProvider";
import { searchRecipes, SpoonacularSearchResult } from "../services/spoonacularService.service";
import mealPlannerService from "../services/mealPlannerService";
import { buildTasteProfile, TasteRecipe } from "./tasteProfile";
import { buildEmbeddingText } from "./embeddingText";
import { rankCandidates, RankCandidate, RankedSuggestion } from "./ranker";

function mealTypeToSpoonacular(mealType?: string): string | undefined {
  switch ((mealType || "").toLowerCase()) {
    case "breakfast":
      return "breakfast";
    case "lunch":
    case "dinner":
      return "main course";
    default:
      return undefined;
  }
}

function caloriesOf(result: SpoonacularSearchResult): number {
  return result.nutrition?.nutrients?.find((n) => n.name === "Calories")?.amount ?? 0;
}

async function loadTasteRecipe(recipeId: string): Promise<TasteRecipe | null> {
  const doc = await Recipe.findOne({ originRecipeId: recipeId });
  if (!doc) return null;
  return {
    name: doc.name,
    cuisines: doc.cuisines,
    dishTypes: doc.dishTypes,
    diets: doc.diets,
    ingredients: doc.instructions?.ingredients?.map((i) => ({ name: i.name })) ?? [],
    embedding: doc.embedding,
  };
}

class RecommendationService {
  async getSuggestions(
    userId: string,
    recipeId: string,
    mealType: string | undefined,
    limit: number,
    token?: string,
  ): Promise<RankedSuggestion[]> {
    const provider = getAiProvider();

    // 1. Liked recipes (from cache; ones we have details for).
    const favs = await UserFavorites.findOne({ userId });
    const likedIds = favs?.likedRecipeIds ?? [];
    const likedRecipes = (
      await Promise.all(likedIds.map((id) => loadTasteRecipe(id)))
    ).filter((r): r is TasteRecipe => r !== null);

    // 2. Current recipe (ensure it is cached so we know its cuisines).
    await mealPlannerService.getRecipeDetails(recipeId, userId);
    const currentRecipe = (await loadTasteRecipe(recipeId)) ?? { name: "" };

    // 3. User preferences.
    let prefs: { diet?: string; healthGoal?: string } = {};
    try {
      const res = await axios.get(
        `${process.env.USER_MANAGMENT_URL}/userManagement/${userId}/preferences`,
        { headers: { Authorization: token } },
      );
      const p = res.data.userPreferences ?? {};
      prefs = {
        diet: Array.isArray(p.diet) ? p.diet[0] : p.diet,
        healthGoal: p.healthGoal,
      };
    } catch (err) {
      console.error("Failed to load user preferences for suggestions:", err);
    }

    const allergies = await this.loadAllergies(userId, token);

    // 4. Taste profile.
    const profile = await buildTasteProfile({
      likedRecipes,
      currentRecipe,
      prefs,
      provider,
    });

    // 5. Candidate search.
    const results = await searchRecipes({
      cuisines: profile.cuisines,
      diet: profile.diet,
      intolerances: allergies,
      type: mealTypeToSpoonacular(mealType),
      number: 12,
    });

    // 6. Embed candidates (cache to Recipe) and rank.
    const candidates = await this.embedCandidates(results, provider);
    return rankCandidates({
      candidates,
      centroid: profile.centroid,
      excludeIds: [recipeId, ...likedIds],
      limit,
    });
  }

  private async loadAllergies(userId: string, token?: string): Promise<string> {
    try {
      const res = await axios.get(
        `${process.env.USER_MANAGMENT_URL}/userManagement/${userId}/preferences`,
        { headers: { Authorization: token } },
      );
      const a = res.data.userPreferences?.allergies;
      return Array.isArray(a) ? a.join(",") : a || "";
    } catch {
      return "";
    }
  }

  private async embedCandidates(
    results: SpoonacularSearchResult[],
    provider: ReturnType<typeof getAiProvider>,
  ): Promise<RankCandidate[]> {
    const texts = results.map((r) =>
      buildEmbeddingText({
        name: r.title,
        cuisines: r.cuisines,
        dishTypes: r.dishTypes,
        diets: r.diets,
      }),
    );
    const vectors = await provider.embed(texts);

    return Promise.all(
      results.map(async (r, i) => {
        const embedding = vectors[i] ?? [];
        // Cache lightweight fields + embedding so future calls are cheaper.
        await Recipe.updateOne(
          { originRecipeId: String(r.id) },
          {
            $set: {
              name: r.title,
              image: r.image,
              readyInMinutes: r.readyInMinutes,
              cuisines: r.cuisines,
              dishTypes: r.dishTypes,
              diets: r.diets,
              calories: caloriesOf(r),
              ...(embedding.length ? { embedding } : {}),
            },
          },
          { upsert: true },
        );
        return {
          originRecipeId: String(r.id),
          name: r.title,
          image: r.image,
          calories: caloriesOf(r),
          readyInMinutes: r.readyInMinutes,
          embedding,
        };
      }),
    );
  }
}

export default new RecommendationService();
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit --project services/mealPlanner/tsconfig.json`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add services/mealPlanner/src/recommendation/recommendationService.ts
git commit -m "feat(mealPlanner): orchestrate recipe suggestions engine"
```

---

## Task 9: Suggestions controller + route (endpoint TDD with mocked service)

**Files:**
- Create: `services/mealPlanner/src/recommendation/recommendationController.ts`
- Modify: `services/mealPlanner/src/routes/mealPlannerRouter.ts`
- Test: `services/mealPlanner/src/tests/suggestions.endpoint.test.ts`

The endpoint test mounts the router on a bare Express app, mocks the auth middleware to inject a user, and mocks `recommendationService` so no DB/network is touched.

- [ ] **Step 1: Write the controller**

```typescript
// services/mealPlanner/src/recommendation/recommendationController.ts
import { Response } from "express";
import { AuthRequest } from "../utils/types/auth";
import recommendationService from "./recommendationService";

class RecommendationController {
  async getSuggestions(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?._id;
      const { recipeId } = req.params;
      const mealType = req.query.mealType as string | undefined;
      const limit = Math.min(Number(req.query.limit) || 6, 12);

      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      if (!recipeId || recipeId.trim() === "") {
        return res.status(400).json({ error: "Invalid recipe ID" });
      }

      const token = req.headers.authorization;
      const suggestions = await recommendationService.getSuggestions(
        userId,
        recipeId,
        mealType,
        limit,
        token,
      );
      res.json(suggestions);
    } catch (error) {
      console.error("Error getting suggestions:", error);
      res.status(500).json({ error: "Failed to get suggestions" });
    }
  }
}

export default new RecommendationController();
```

- [ ] **Step 2: Add the route**

In `mealPlannerRouter.ts`, add the import at the top:

```typescript
import RecommendationController from "../recommendation/recommendationController";
```

And register the route (after the `/recipes/:recipeId/like` route):

```typescript
mealPlannerRouter.get(
  "/users/:userId/recipes/:recipeId/suggestions",
  authMiddleware,
  RecommendationController.getSuggestions,
);
```

- [ ] **Step 3: Write the failing endpoint test**

```typescript
// services/mealPlanner/src/tests/suggestions.endpoint.test.ts
import express from "express";
import request from "supertest";

// Mock auth to inject a fixed user.
jest.mock("../middlewares/auth.middleware", () => ({
  __esModule: true,
  default: (req: any, _res: any, next: any) => {
    req.user = { _id: "user-1" };
    next();
  },
}));

// Mock the service so the route is tested in isolation.
jest.mock("../recommendation/recommendationService", () => ({
  __esModule: true,
  default: {
    getSuggestions: jest.fn(async () => [
      { originRecipeId: "111", name: "Ramen", calories: 500, score: 0.9 },
    ]),
  },
}));

import { mealPlannerRouter } from "../routes/mealPlannerRouter";
import recommendationService from "../recommendation/recommendationService";

const app = express();
app.use(express.json());
app.use("/mealPlanner", mealPlannerRouter);

describe("GET /mealPlanner/users/:userId/recipes/:recipeId/suggestions", () => {
  it("returns ranked suggestions and forwards params", async () => {
    const res = await request(app)
      .get("/mealPlanner/users/user-1/recipes/999/suggestions")
      .query({ mealType: "dinner", limit: "6" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { originRecipeId: "111", name: "Ramen", calories: 500, score: 0.9 },
    ]);
    expect(recommendationService.getSuggestions).toHaveBeenCalledWith(
      "user-1",
      "999",
      "dinner",
      6,
      undefined,
    );
  });
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test --prefix services/mealPlanner -- suggestions.endpoint`
Expected: PASS. (If the route/controller were missing it would 404; this verifies wiring.)

- [ ] **Step 5: Commit**

```bash
git add services/mealPlanner/src/recommendation/recommendationController.ts services/mealPlanner/src/routes/mealPlannerRouter.ts services/mealPlanner/src/tests/suggestions.endpoint.test.ts
git commit -m "feat(mealPlanner): add recipe suggestions endpoint"
```

---

## Task 10: Persist cuisines/dishTypes + add `replaceMeal`

**Files:**
- Modify: `services/mealPlanner/src/services/mealPlannerService.ts`
- Modify: `services/mealPlanner/src/controllers/mealPlannerController.ts`
- Modify: `services/mealPlanner/src/routes/mealPlannerRouter.ts`
- Test: `services/mealPlanner/src/tests/replaceMeal.endpoint.test.ts`

- [ ] **Step 1: Persist cuisines/dishTypes when caching a recipe**

In `mealPlannerService.ts`, inside `getRecipeDetails`, where the new `Recipe({...})` is built, add two fields next to `diets: recipeDetails.diets,`:

```typescript
        diets: recipeDetails.diets,
        cuisines: recipeDetails.cuisines,
        dishTypes: recipeDetails.dishTypes,
```

- [ ] **Step 2: Add the `replaceMeal` service method**

Add this method to the `MealPlannerService` class (after `getDailyPlan`):

```typescript
  async replaceMeal(
    userId: string,
    date: string,
    mealType: "breakfast" | "lunch" | "dinner",
    newRecipeId: string,
  ): Promise<IMealPlanDay | null> {
    const recipe = await this.getRecipeDetails(newRecipeId, userId);
    if (!recipe) return null;

    const day = new Date(date);
    const dayStart = new Date(day);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayStart.getUTCDate() + 1);

    const plan = await MealPlan.findOne({
      userId,
      "days.date": { $gte: dayStart, $lt: dayEnd },
    });
    if (!plan) return null;

    const targetDay = plan.days.find((d) => {
      const dd = new Date(d.date);
      return dd >= dayStart && dd < dayEnd;
    });
    if (!targetDay) return null;

    targetDay[mealType] = {
      recipeId: String(newRecipeId),
      name: recipe.name,
      calories: recipe.calories ?? 0,
    };

    plan.nutritionSummary.calories = plan.days.reduce(
      (sum, d) =>
        sum +
        (d.breakfast?.calories || 0) +
        (d.lunch?.calories || 0) +
        (d.dinner?.calories || 0),
      0,
    );

    await plan.save();
    return targetDay;
  }
```

Add `IMealPlanDay` to the existing model import at the top of the file:

```typescript
import { MealPlan, IMealPlan, IMealPlanDay } from "../models/mealPlanModel";
```

- [ ] **Step 3: Add the controller method**

In `mealPlannerController.ts`, add to the `MealPlannerController` class:

```typescript
  async replaceMeal(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { date, mealType, newRecipeId } = req.body;

      if (!userId || !date || !mealType || !newRecipeId) {
        return res
          .status(400)
          .json({ error: "userId, date, mealType and newRecipeId are required" });
      }
      if (!["breakfast", "lunch", "dinner"].includes(mealType)) {
        return res.status(400).json({ error: "Invalid mealType" });
      }

      const updatedDay = await mealPlannerService.replaceMeal(
        userId,
        date,
        mealType,
        String(newRecipeId),
      );
      if (!updatedDay) {
        return res.status(404).json({ error: "Meal plan or day not found" });
      }
      res.json(updatedDay);
    } catch (error) {
      console.error("Error replacing meal:", error);
      res.status(500).json({ error: "Failed to replace meal" });
    }
  }
```

- [ ] **Step 4: Add the route**

In `mealPlannerRouter.ts`, after the suggestions route:

```typescript
mealPlannerRouter.patch(
  "/users/:userId/meal-plans/day/meal",
  authMiddleware,
  MealPlannerController.replaceMeal,
);
```

- [ ] **Step 5: Write the failing endpoint test**

```typescript
// services/mealPlanner/src/tests/replaceMeal.endpoint.test.ts
import express from "express";
import request from "supertest";

jest.mock("../middlewares/auth.middleware", () => ({
  __esModule: true,
  default: (req: any, _res: any, next: any) => {
    req.user = { _id: "user-1" };
    next();
  },
}));

jest.mock("../services/mealPlannerService", () => ({
  __esModule: true,
  default: {
    replaceMeal: jest.fn(async (_u: string, _d: string, mealType: string) =>
      mealType === "dinner"
        ? { date: "2026-05-31", dinner: { recipeId: "222", name: "Gyoza", calories: 400 } }
        : null,
    ),
  },
}));

import { mealPlannerRouter } from "../routes/mealPlannerRouter";
import mealPlannerService from "../services/mealPlannerService";

const app = express();
app.use(express.json());
app.use("/mealPlanner", mealPlannerRouter);

describe("PATCH /mealPlanner/users/:userId/meal-plans/day/meal", () => {
  it("replaces the slot and returns the updated day", async () => {
    const res = await request(app)
      .patch("/mealPlanner/users/user-1/meal-plans/day/meal")
      .send({ date: "2026-05-31", mealType: "dinner", newRecipeId: "222" });

    expect(res.status).toBe(200);
    expect(res.body.dinner.recipeId).toBe("222");
    expect(mealPlannerService.replaceMeal).toHaveBeenCalledWith(
      "user-1",
      "2026-05-31",
      "dinner",
      "222",
    );
  });

  it("rejects an invalid mealType with 400", async () => {
    const res = await request(app)
      .patch("/mealPlanner/users/user-1/meal-plans/day/meal")
      .send({ date: "2026-05-31", mealType: "brunch", newRecipeId: "222" });
    expect(res.status).toBe(400);
  });

  it("returns 404 when the plan/day is missing", async () => {
    const res = await request(app)
      .patch("/mealPlanner/users/user-1/meal-plans/day/meal")
      .send({ date: "2026-05-31", mealType: "lunch", newRecipeId: "222" });
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm test --prefix services/mealPlanner -- replaceMeal.endpoint`
Expected: PASS (3 tests).

- [ ] **Step 7: Commit**

```bash
git add services/mealPlanner/src/services/mealPlannerService.ts services/mealPlanner/src/controllers/mealPlannerController.ts services/mealPlanner/src/routes/mealPlannerRouter.ts services/mealPlanner/src/tests/replaceMeal.endpoint.test.ts
git commit -m "feat(mealPlanner): add replaceMeal endpoint and persist cuisines/dishTypes"
```

---

## Task 11: Client API methods + suggestion type

**Files:**
- Modify: `client/src/features/mealPlanner/types/mealPlanner.ts`
- Modify: `client/src/features/mealPlanner/api/mealPlanner.ts`

- [ ] **Step 1: Add the `RecipeSuggestion` type**

Append to `types/mealPlanner.ts`:

```typescript
export interface RecipeSuggestion {
  originRecipeId: string;
  name: string;
  image?: string;
  calories?: number;
  readyInMinutes?: number;
  score: number;
  why?: string;
}
```

- [ ] **Step 2: Add the API methods**

In `api/mealPlanner.ts`, update the import line and add two methods to the `mealPlannerApi` object:

```typescript
import type { ApiMealPlan, ApiMealPlanDay, ApiRecipe, RecipeSuggestion } from '@/features/mealPlanner/types/mealPlanner';
```

```typescript
  getSuggestions: (
    userId: string,
    recipeId: string,
    mealType: string,
    token: string | null,
    limit = 6,
  ) =>
    api
      .get<RecipeSuggestion[]>(`/users/${userId}/recipes/${recipeId}/suggestions`, {
        params: { mealType, limit },
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => r.data),

  replaceMeal: (
    userId: string,
    body: { date: string; mealType: string; newRecipeId: string },
    token: string | null,
  ) =>
    api
      .patch<ApiMealPlanDay>(`/users/${userId}/meal-plans/day/meal`, body, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => r.data),
```

- [ ] **Step 3: Verify the client type-checks**

Run: `npm run build --prefix client` (or `npx tsc --noEmit` inside `client`)
Expected: no type errors from these files.

- [ ] **Step 4: Commit**

```bash
git add client/src/features/mealPlanner/api/mealPlanner.ts client/src/features/mealPlanner/types/mealPlanner.ts
git commit -m "feat(client): add suggestions and replaceMeal API methods"
```

---

## Task 12: Suggestions drawer + recipe page button + planner nav context

**Files:**
- Create: `client/src/features/mealPlanner/components/SuggestionsDrawer.tsx`
- Modify: `client/src/pages/RecipeDetail.tsx`
- Modify: `client/src/pages/MealPlanner.tsx`

- [ ] **Step 1: Create the drawer component**

```tsx
// client/src/features/mealPlanner/components/SuggestionsDrawer.tsx
import {
  Drawer, Box, Typography, Card, CardMedia, CardContent, Button, CircularProgress,
} from '@mui/material';
import type { RecipeSuggestion } from '@/features/mealPlanner/types/mealPlanner';

interface SuggestionsDrawerProps {
  open: boolean;
  loading: boolean;
  suggestions: RecipeSuggestion[];
  onClose: () => void;
  onUse: (s: RecipeSuggestion) => void;
}

export function SuggestionsDrawer({
  open, loading, suggestions, onClose, onUse,
}: SuggestionsDrawerProps) {
  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: { xs: '100vw', sm: 420 }, p: '1.5rem' }}>
        <Typography variant="h6" sx={{ mb: '1rem' }}>
          Suggested for you
        </Typography>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: '2rem' }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && suggestions.length === 0 && (
          <Typography color="text.secondary">
            No matches yet — like a few more recipes and try again.
          </Typography>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {suggestions.map((s) => (
            <Card key={s.originRecipeId} sx={{ display: 'flex' }}>
              {s.image && (
                <CardMedia component="img" image={s.image} sx={{ width: 96 }} />
              )}
              <CardContent sx={{ flex: 1 }}>
                <Typography variant="subtitle1">{s.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(s.calories ?? 0)} kcal
                  {s.readyInMinutes ? ` · ${s.readyInMinutes} min` : ''}
                </Typography>
                {s.why && (
                  <Typography variant="caption" color="primary">{s.why}</Typography>
                )}
                <Button size="small" sx={{ mt: '0.5rem' }} onClick={() => onUse(s)}>
                  Use this
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    </Drawer>
  );
}
```

- [ ] **Step 2: Wire the button + drawer into `RecipeDetail.tsx`**

Add imports:

```typescript
import { useSearchParams } from 'react-router-dom';
import { SuggestionsDrawer } from '@/features/mealPlanner/components/SuggestionsDrawer';
import type { RecipeSuggestion } from '@/features/mealPlanner/types/mealPlanner';
import { getUserId } from '@/shared/utils/userId';
```

Add state + handlers inside the component (after the existing `snackbar` state):

```typescript
  const [searchParams] = useSearchParams();
  const date = searchParams.get('date');
  const mealType = searchParams.get('mealType') ?? 'dinner';

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([]);

  const handleOpenSuggestions = async () => {
    setDrawerOpen(true);
    setSuggestionsLoading(true);
    try {
      const token = localStorage.getItem('access-token');
      const userId = getUserId() ?? '';
      const id = recipe?.originRecipeId || recipeId || '';
      const data = await mealPlannerApi.getSuggestions(userId, id, mealType, token);
      setSuggestions(data);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
      setSnackbar({ open: true, message: 'Failed to load suggestions.', severity: 'error' });
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleUseSuggestion = async (s: RecipeSuggestion) => {
    const token = localStorage.getItem('access-token');
    const userId = getUserId() ?? '';
    try {
      if (date) {
        await mealPlannerApi.replaceMeal(
          userId,
          { date, mealType, newRecipeId: s.originRecipeId },
          token,
        );
      }
      setDrawerOpen(false);
      navigate(`/recipe/${s.originRecipeId}${date ? `?date=${date}&mealType=${mealType}` : ''}`);
    } catch (err) {
      console.error('Failed to replace meal:', err);
      setSnackbar({ open: true, message: 'Failed to replace meal.', severity: 'error' });
    }
  };
```

Add the button inside the right-hand action column, just below the existing "Add Ingredients to Cart" button:

```tsx
                <Button
                  variant="outlined"
                  sx={{ height: '3rem', borderRadius: '0.625rem' }}
                  onClick={handleOpenSuggestions}
                >
                  Suggested for you
                </Button>
```

And render the drawer just before the closing `</Box>` that wraps the page (next to the `<Snackbar>`):

```tsx
      <SuggestionsDrawer
        open={drawerOpen}
        loading={suggestionsLoading}
        suggestions={suggestions}
        onClose={() => setDrawerOpen(false)}
        onUse={handleUseSuggestion}
      />
```

- [ ] **Step 3: Thread `date` + `mealType` from the planner**

In `MealPlanner.tsx`, the `PlannedMealCard` is rendered with `onViewRecipe={(meal) => navigate(`/recipe/${meal.id}`)}`. The selected day and meal type are known in scope. Change the navigation to include them.

Find where `selectedMeals` are built and the `dayRecord` is available; capture the date. Then update the card render:

```tsx
              {selectedMeals.map((meal) => (
                <PlannedMealCard
                  key={`${selectedDay}-${meal.type}`}
                  meal={meal}
                  onViewRecipe={(meal) =>
                    navigate(
                      `/recipe/${meal.id}?date=${
                        mealPlan?.days.find((d) => formatDayKey(d.date) === selectedDay)?.date ?? ''
                      }&mealType=${meal.type.toLowerCase()}`,
                    )
                  }
                  onAddToList={handleAddToList}
                />
              ))}
```

- [ ] **Step 4: Manual verification in the browser**

Run the app: `npm run dev` (from project root). Then:
1. Open the Weekly Planner, click a meal to open its recipe page (URL now has `?date=...&mealType=...`).
2. Click **"Suggested for you"** → drawer opens, shows alternatives (or the empty message).
3. Click **"Use this"** on a card → it swaps that slot, navigates to the new recipe, and the planner reflects the change on return.
4. Confirm graceful behavior with no `AI_PROVIDER` set: suggestions still return (cuisine-filtered order), no crash.

Expected: all four behave as described.

- [ ] **Step 5: Commit**

```bash
git add client/src/features/mealPlanner/components/SuggestionsDrawer.tsx client/src/pages/RecipeDetail.tsx client/src/pages/MealPlanner.tsx
git commit -m "feat(client): add 'Suggested for you' drawer and replace flow"
```

---

## Task 13 (optional, phase 4): LLM "why this fits you" line

**Files:**
- Modify: `services/mealPlanner/src/ai/aiProvider.ts` (extend interface)
- Modify: `services/mealPlanner/src/ai/geminiProvider.ts` (implement `rank`)
- Modify: `services/mealPlanner/src/recommendation/recommendationService.ts` (call it on the top shortlist)

- [ ] **Step 1: Extend the `AiProvider` interface**

```typescript
export interface AiProvider {
  embed(texts: string[]): Promise<number[][]>;
  explain?(
    profileCuisines: string[],
    candidates: { originRecipeId: string; name: string }[],
  ): Promise<Record<string, string>>; // originRecipeId -> one-line reason
}
```

- [ ] **Step 2: Implement `explain` in `GeminiProvider`**

```typescript
  async explain(
    profileCuisines: string[],
    candidates: { originRecipeId: string; name: string }[],
  ): Promise<Record<string, string>> {
    const genAI = (this as any).genAI as import("@google/generative-ai").GoogleGenerativeAI;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt =
      `A user enjoys ${profileCuisines.join(", ") || "varied"} food. ` +
      `For each recipe below, write a short (max 12 words) reason it fits them. ` +
      `Return JSON object mapping id to reason.\n` +
      candidates.map((c) => `${c.originRecipeId}: ${c.name}`).join("\n");
    try {
      const res = await model.generateContent(prompt);
      const text = res.response.text().replace(/```json|```/g, "").trim();
      return JSON.parse(text);
    } catch (err) {
      console.error("Gemini explain failed:", err);
      return {};
    }
  }
```

> Note: keep a reference to `genAI` on the instance. In the constructor, add `(this as any).genAI = genAI;`.

- [ ] **Step 3: Attach `why` on the top shortlist in `recommendationService`**

After `rankCandidates(...)` in `getSuggestions`, before returning:

```typescript
    const ranked = rankCandidates({ /* existing args */ });
    if (provider.explain && ranked.length) {
      const top = ranked.slice(0, 5);
      const reasons = await provider.explain(
        profile.cuisines,
        top.map((r) => ({ originRecipeId: r.originRecipeId, name: r.name })),
      );
      for (const r of ranked) {
        (r as any).why = reasons[r.originRecipeId];
      }
    }
    return ranked;
```

- [ ] **Step 4: Verify compilation and manual check**

Run: `npx tsc --noEmit --project services/mealPlanner/tsconfig.json`
With `AI_PROVIDER=gemini` and a key set, open the drawer and confirm a short reason appears under each top card.

- [ ] **Step 5: Commit**

```bash
git add services/mealPlanner/src/ai/ services/mealPlanner/src/recommendation/recommendationService.ts
git commit -m "feat(mealPlanner): add LLM 'why this fits you' reasons to suggestions"
```

---

## Self-Review (completed by plan author)

- **Spec coverage:** suggestion engine (Tasks 2–8), cosine in-app (Task 2/7), taste profile + cold start (Task 6), meal-type filter (Task 8), suggestions endpoint (Task 9), replace endpoint + cuisines/dishTypes persistence (Task 10), schema additions (Task 1), client drawer + nav context (Tasks 11–12), graceful degrade without AI key (NullAiProvider in Task 4, score-0 path in Task 7), optional LLM why (Task 13). Add-extra-meal is explicitly out of scope.
- **Placeholder scan:** every code step contains full code; no TBD/TODO.
- **Type consistency:** `AiProvider.embed`, `TasteRecipe`, `RankCandidate`/`RankedSuggestion`, `RecipeSuggestion`, and the suggestions/replace endpoint shapes are consistent across backend tasks and the client.

## Out of scope (separate spec)

- Variable meals per day + the "Add extra meal" action (spec phase 5).
- Disliked recipes / view history / ratings.
- Budget-aware ranking.
```
