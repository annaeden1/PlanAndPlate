# Recipe Suggestions ("Suggested for you") — Design Spec

**Date:** 2026-05-29
**Owner:** Li-am Hemo
**Status:** Draft for review

## Goal

On the recipe page, let a user who doesn't want the current recipe get personalized
alternatives based on what they liked before (taste affinity) plus their profile
(diet, allergies, health goal). Two actions share one suggestion engine:

1. **Replace** — swap the current recipe for a chosen suggestion in its meal-plan slot.
2. **Add** — append a chosen suggestion as an extra meal that day (4th, 5th meal...).

Example: a user who liked Pad Thai, gyoza, ramen, noodles is offered Asian-leaning
dishes that still fit their diet/allergies/goal.

## Scope decisions (locked)

- **Interaction:** show a list of alternatives; the user picks one (not auto-replace).
- **Engine:** hybrid — Spoonacular `complexSearch` fetches candidates, then re-rank against
  the user's liked-taste profile.
- **Re-rank mechanism:** embeddings + cosine (core RAG), with an optional LLM "why this fits
  you" line on the final shortlist.
- **Vector store:** in-app cosine — embedding arrays stored on the `Recipe` document, cosine
  computed in Node. No Atlas vector index required.
- **AI provider:** provider-agnostic behind a small interface; concrete key (Gemini/OpenAI)
  wired at implementation time.
- **Cold start:** blend the current recipe's traits with the user's preferences/likes.
- **Meal-type aware:** suggestions respect the slot (replacing dinner suggests main courses).
- **Placement:** new module inside the existing `mealPlanner` service (Approach A) — reuse the
  Spoonacular client, `UserFavorites`, `Recipe` cache, and auth.
- **Sequencing:** ship **Replace** first; **Add** (variable meals per day) is a later phase
  with its own spec, because it requires changing the meal-plan model from fixed
  breakfast/lunch/dinner slots to a flexible meals array.

## Existing foundation (reused, not rebuilt)

- `UserFavorites { userId, likedRecipeIds[] }` — the preference signal. `PATCH /recipes/:recipeId/like` already toggles it.
- User preferences (userManagement): `diet[]`, `allergies[]`, `healthGoal`, `weeklyBudget`.
- Spoonacular client `spoonacularService.service.ts` — currently `mealplanner/generate`,
  `recipes/{id}/information`, `informationBulk`. We add `complexSearch`.
- `Recipe` cache (Mongo) — stores `name, image, macros, servings, readyInMinutes, diets, instructions`.
  Does **not** yet store `cuisines`, `dishTypes`, or `embedding` — added here.
- `MealPlan.days[]` — each day has fixed `breakfast`/`lunch`/`dinner` = `{recipeId, name, calories}`.
  Replacing = swapping the `recipeId` in a slot. There is **no** replace/regenerate endpoint today.
- Auth: JWT middleware sets `(req as any).user._id`. Client stores token in `localStorage['access-token']`.

## Architecture (Approach A)

New code inside `services/mealPlanner/src/`:

```
recommendation/
  recommendationController.ts   // HTTP layer
  recommendationService.ts      // orchestration: profile -> candidates -> rank -> enrich
  tasteProfile.ts               // build centroid from liked recipes (+ cold start)
  candidateSearch.ts            // Spoonacular complexSearch wrapper
  ranker.ts                     // cosine + optional LLM "why"
  embeddingText.ts              // pure: recipe -> embedding input string
ai/
  aiProvider.ts                 // interface: embed(texts[]) : number[][]; rank?(profile, candidates)
  geminiProvider.ts             // wired later
  openaiProvider.ts             // wired later
```

### Schema additions to `Recipe`

- `cuisines: string[]`
- `dishTypes: string[]`
- `embedding: number[]`

Backfilled lazily: whenever a recipe passes through the suggestion engine, we capture its
cuisines/dishTypes (from Spoonacular) and compute+cache its embedding.

## Data flow — suggestions

```
Client (RecipeDetail "Suggested for you")
  -> GET /mealplanner/users/:userId/recipes/:recipeId/suggestions?mealType=dinner&limit=6
       1. load UserFavorites.likedRecipeIds + user preferences
       2. ensureEmbeddings(liked)            // embed+cache any missing
       3. profile = centroid(liked)  OR  coldStart(currentRecipe + prefs)
       4. inferredCuisines = topK cuisines across liked recipes (or currentRecipe's)
       5. candidates = Spoonacular complexSearch(cuisines, diet, intolerances=allergies, type=mealType)
       6. ensureEmbeddings(candidates) -> cosine vs profile.centroid -> sort desc -> take limit
       7. (optional) gemini.why(profile, top5) -> attach `why`
       8. exclude already-liked ids and the current recipe id
  -> returns [{ originRecipeId, name, image, calories, readyInMinutes, score, why? }]
Client shows alternatives list -> user picks
  -> Replace: PATCH .../meal-plans/day/meal  (swap slot recipeId)
  -> Add:     phase 2 (variable meals)
```

Candidates that get enriched are written into the existing `Recipe` cache, so picking one means
it is already cached for `getRecipeDetails`.

## Taste profile + ranking detail

```
buildProfile(userId, currentRecipe, prefs):
  liked = UserFavorites.likedRecipeIds
  if liked.length >= MIN_LIKES (3):
     vecs     = ensureEmbeddings(liked)
     centroid = mean(vecs)
     cuisines = topK(count of cuisines across liked)
  else:                                  // cold start = "both combined"
     seedText = embeddingText(currentRecipe) + " " + prefsText(diet, healthGoal)
     centroid = embed(seedText)
     cuisines = currentRecipe.cuisines
  return { centroid, cuisines, diet, intolerances: allergies }

rank(candidates, centroid, limit):
  vecs   = ensureEmbeddings(candidates)
  scored = candidates.map(c => ({ c, score: cosine(vec(c), centroid) }))
  return scored.sort(desc).slice(0, limit)
```

- `embeddingText(recipe)` = `name + cuisines + dishTypes + diets + first ~8 ingredient names`.
- `ensureEmbeddings(ids)` lazily backfills `Recipe.embedding`; first call is slower, then cached.
- `cosine(a, b)` = dot(a,b) / (norm(a) * norm(b)). Pure function.
- Exclude already-liked recipes and the current recipe from results.

## API contract

### Suggestions (new)

```
GET /mealplanner/users/:userId/recipes/:recipeId/suggestions?mealType=dinner&limit=6
auth required
200 -> [{ originRecipeId, name, image, calories, readyInMinutes, score, why? }]
200 -> []        // no candidates found
401 -> unauthorized
500 -> engine error
```

- `:recipeId` is the recipe being replaced/seeded (cold-start trait source).
- `mealType` in {breakfast, lunch, dinner} maps to Spoonacular `type` (breakfast / main course / ...).

### Replace slot (new — phase 1 of "both")

```
PATCH /mealplanner/users/:userId/meal-plans/day/meal
body { date, mealType, newRecipeId }
flow: ensure Recipe cached (getRecipeDetails) -> set MealPlan.days[date][mealType] = {recipeId, name, calories}
      -> recompute that day + nutritionSummary delta
200 -> updated day
400 -> bad input
404 -> plan/day not found
500 -> server error
```

### Add extra meal (deferred — phase 5)

Requires the meals-array model decision (fixed slots -> flexible `day.meals[]`). Separate spec.

### Unchanged

`PATCH /recipes/:recipeId/like` stays as-is; it is the preference signal.

## Client UI

`client/src/pages/RecipeDetail.tsx`:

- Add a **"Suggested for you"** button near the like/cart actions.
- Opens a MUI Dialog/Drawer (pattern already used in the app).
- Drawer fetches suggestions and shows cards: image, name, calories, ready-in, optional `why` line.
- Each card has **"Use this"** -> calls the replace endpoint -> on success navigate to the new
  recipe + success snackbar.
- States: loading skeletons; empty ("No matches yet — like a few more recipes"); error snackbar
  (matches the existing snackbar pattern in the page).

New API methods in `client/src/features/mealPlanner/api/mealPlanner.ts`:

- `getSuggestions(recipeId, mealType, token)`
- `replaceMeal(userId, { date, mealType, newRecipeId }, token)`

**Context needed:** RecipeDetail currently knows only `recipeId` from the URL. Replace needs
`date` + `mealType`. Phase-1 fix: pass `date` and `mealType` as query/route params when navigating
from the planner to the recipe page. Minor planner-navigation tweak.

## Error handling

- Spoonacular failure -> 5xx; drawer shows a retry action.
- AI provider key missing -> skip embeddings, fall back to cuisine-filtered `complexSearch` ordering
  (graceful degrade — feature still returns useful results).
- Replace on a missing plan/day -> 404.

## Testing

- **Unit (pure, no API):** `cosine`, `mean`/centroid, `embeddingText` builder, cold-start branch
  of `buildProfile`.
- **Integration:** suggestions endpoint with mocked Spoonacular + AI provider; replace endpoint
  with in-memory Mongo (verify slot swap + nutrition recompute).
- **Manual:** drawer flow in the browser (golden path + empty + error states).

## Phasing

1. Schema add (`cuisines`, `dishTypes`, `embedding`) + `aiProvider` interface + `complexSearch` wrapper.
2. Suggestion engine (embeddings cosine) + suggestions endpoint + unit/integration tests.
3. Replace endpoint + client drawer + planner-nav context. **<- first usable slice.**
4. LLM "why this fits you" line.
5. Add-extra-meal + variable-meals model (separate spec).

## Out of scope (this spec)

- Variable meals-per-day model and the Add action (phase 5, own spec).
- Disliked-recipes / view-history / rating signals.
- Budget-aware ranking (preferences exist but not used for ranking here).
```
