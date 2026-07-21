# Cache-First Weekly Meal Plan Generation — Design

**Date:** 2026-07-12
**Scope:** `services/mealPlanner` only. No client changes. No changes to `dayPlanBuilder.ts` logic.

## Problem

`createWeeklyPlan` calls Spoonacular `complexSearch` 3 times (one per meal slot) on every
weekly plan generation, unconditionally (~6.7 quota points per generation). The local
`Recipe` collection already caches every recipe ever fetched, but is never consulted
before calling the API. Additionally, users should not receive the same meals across
consecutive weeks.

## Goals

1. Serve meal-slot searches from the local `Recipe` pool when possible (0 quota points).
2. Preserve healthGoal-driven targeting: per-slot `minProtein` / `minCalories` /
   `maxCalories` (from `calcTargets` + `splitDailyTargets`) and `diet` filtering.
3. Allergy safety: a user must never be served a cached recipe that was not fetched
   under an exclusion filter covering all of that user's allergies.
4. No-repeat window: a user must not receive a recipe that appeared in any of their
   last 3 weekly plans.
5. Minimal footprint: one new schema field, one new module, one changed call site.

## Non-Goals

- The recommendation/suggestions flow (`recommendationService`) is unchanged.
- `getRecipeDetails` single-recipe caching is unchanged.
- No migration of existing `Recipe` documents.

## Design

### 1. New module: `services/mealPlanner/src/services/cachedRecipeSearch.ts`

Exports `makeCachedSearch(userContext)` returning a function with the existing
`SearchRecipesFn` signature, so it drops into `buildWeek`'s dependency injection
unchanged.

```
makeCachedSearch({ recentRecipeIds: string[], userAllergies: string[] })
  → (params: ComplexSearchParams) => Promise<ComplexSearchRecipe[]>
```

Per call:

1. **Local query** (Mongo aggregate):
   ```js
   Recipe.aggregate([
     { $match: {
         source: "spoonacular",
         calories: { $gte: params.minCalories, $lte: params.maxCalories },
         protein:  { $gte: params.minProtein },
         ...(params.diet && { diets: params.diet }),
         ...(userAllergies.length > 0 && {
           fetchedWithExclusions: { $all: userAllergies },
         }),
         originRecipeId: { $nin: recentRecipeIds },
     }},
     { $sample: { size: params.number ?? 7 } },
   ])
   ```
2. **Hit** (results ≥ `params.number`): map docs to `ComplexSearchRecipe` shape and
   return. Zero API calls.
3. **Miss** (fewer than `params.number`): call the real `searchRecipesByNutrition`
   with the same params plus a random `offset` (0–30) so repeat misses fetch new
   pages instead of re-downloading already-cached recipes. Filter the API results
   against `recentRecipeIds` as well (Spoonacular does not know the user's history),
   then return them (fallback protein-floor retry logic in `findMealsForSlotType`
   is unaffected; a slot pool smaller than 7 is already handled by the existing
   modulo cycling).

Doc → `ComplexSearchRecipe` mapping: rebuild the minimal
`nutrition.nutrients` array (`Calories`, `Protein`, `Fat`, `Carbohydrates`) from the
stored scalar fields; `id = Number(originRecipeId)`, `title = name`, `image = image`.

### 2. Schema: one new field on `recipeSchema`

```js
fetchedWithExclusions: [{ type: String }]
```

Semantics: the normalized list of excluded ingredients (user allergies) that was in
effect on the Spoonacular search that returned this recipe. Empty array / missing
field = fetched with no exclusions, therefore never eligible for any allergy user.
Existing documents need no migration — missing field simply fails the `$all` match.

Normalization: lowercase, trimmed, sorted; the same normalization applied to
user allergies at query time.

### 3. Write path: `createWeeklyPlan` insertMany gains two fields

The existing cache-write in `mealPlannerService.createWeeklyPlan` additionally stores:

- `diets: r.diets ?? []` — requires adding `diets?: string[]` to the
  `ComplexSearchRecipe` type (Spoonacular already returns it with
  `addRecipeNutrition=true`; currently dropped).
- `fetchedWithExclusions` — the normalized allergy list used for this generation
  (`[]` when the user has none).

### 4. Call-site change in `createWeeklyPlan`

```js
const recentRecipeIds = await getRecentRecipeIds(userId, 3); // last 3 MealPlans
const search = makeCachedSearch({
  recentRecipeIds,
  userAllergies: normalizeAllergies(userPreferences.allergies),
});
const week = await buildWeek({ ...targets }, search);
```

`getRecentRecipeIds(userId, n)`: query the user's `MealPlan` documents (most recent
`n`), flatten `days[].breakfast/lunch/dinner.recipeId`, drop `"0"`/empty. No schema
change — MealPlan already stores this history.

### 5. HealthGoal interaction (unchanged, for the record)

healthGoal → `calcTargets` (Mifflin-St Jeor × goal modifiers) →
`splitDailyTargets` (30/40/30) → per-slot `minProtein`/`minCalories`/`maxCalories`.
These arrive in `params` and are applied identically to the local query and the API
call, so goal targeting is preserved on both paths.

## Behavior matrix

| User | Cache eligible? | Result |
|---|---|---|
| No allergies, pool has ≥7 unseen matches | yes | 0 API points |
| No allergies, pool short | partially | API call (~2.2 pts), pool grows by ~7 |
| Allergies = [nuts], recipe fetched with exclusions ⊇ [nuts] | yes | served from cache |
| Allergies = [nuts], recipe fetched with no/other exclusions | no | filtered out; API top-up |
| Recipe appeared in user's last 3 plans | no | filtered out (`$nin`) |

## Error handling

- Local query failure: log and fall through to the API path (never fail a plan
  generation because of a cache error).
- API failure on miss: propagates as today (no behavior change).
- `originRecipeId` values that are not numeric (manual recipes) are excluded by the
  `source: "spoonacular"` match.

## Quota model (per weekly generation, number=7 per slot)

| Scenario | Cost |
|---|---|
| Cold (empty pool) | ~6.7 pts (same as today; seeds pool) |
| Partial (1 slot misses) | ~2.2 pts |
| Warm (all 3 slots cache-served) | 0 pts |

Random `offset` on misses ensures each API call contributes ~7 *new* recipes, so
niches cannot stall on re-fetching the same first page.

## Testing

Unit tests for `cachedRecipeSearch` (mocked `Recipe.aggregate` + mocked API fn):

1. Hit path: ≥7 local matches → API fn never called; result mapped to
   `ComplexSearchRecipe` shape correctly.
2. Miss path: <7 local → API fn called once with same params + `offset` in [0,30].
3. Allergy filter: query includes `$all` clause iff `userAllergies` non-empty.
4. No-repeat: query includes `$nin` with provided `recentRecipeIds`.
5. Local query throws → falls back to API fn.

Integration expectations: existing `mealPlanner.service.test.ts` suite stays green;
`createWeeklyPlan` test extended to assert `insertMany` payload includes `diets` and
`fetchedWithExclusions`.
