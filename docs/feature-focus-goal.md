# Branch: `feature/focus-goal`

Goal-driven nutrition for PlanAndPlate: turn a user's body stats + health goal into a
daily **calorie** target *and* a daily **protein** target, then generate weekly menus
that actually hit both.

Two pieces of work landed on this branch:

1. **Goal-driven calorie engine** — compute targets from stats + goal, surface them in the UI.
2. **Protein-aware meal generation** — make generated menus meet the protein target, not just calories.

---

## 1. Goal-driven calorie engine

### What it does

Given a user's `bodyStats` (weight, height, age, gender, activity level) and a
`healthGoal`, compute:

- **BMR** — Mifflin–St Jeor equation.
- **Maintenance** — BMR × activity multiplier.
- **Target calories** — maintenance × goal calorie factor, clamped to a safe floor
  (1500 kcal male / 1200 female).
- **Protein target** — `proteinPerKg × weightKg`, where `proteinPerKg` comes from the goal.

Goals and their modifiers:

| Goal | Calorie factor | Protein / kg |
|------|---------------|--------------|
| `gain_muscle` | 1.15 | 1.9 |
| `lose_weight` | 0.85 | 1.6 |
| `eat_healthier` | 1.0 | 1.2 |
| `maintain_weight` | 1.0 | 1.2 |

When `bodyStats` is incomplete, `calcTargets` returns `null` — the app degrades
gracefully to calorie-only behavior with no protein constraint.

### Where it lives

- **`services/mealPlanner/src/utils/calorieCalculator.ts`** — `calcTargets`, BMR,
  activity/goal tables, unit helpers (`lbToKg`, `ftInToCm`).
- **`client/src/shared/utils/calorieCalculator.ts`** — mirror used by the client.
- **`services/userManagement`** — `bodyStats` / `healthGoal` added to the user model,
  preferences types, and controller.

### Client UI

- `BodyStatsStep`, `ActivityStep`, `GoalSummary` in the preferences flow — collect stats
  and show the computed calorie + protein targets.
- `BodyGoalEditor` in the profile — edit stats/goal after onboarding.
- `Preferences.tsx` / `Profile.tsx` wired to the new steps and summary.

### Tests

- `services/mealPlanner/src/tests/calorieCalculator.test.ts` — locks BMR, maintenance,
  target calories, and protein for both genders and every goal, cross-checked against a
  reference calculator.

---

## 2. Protein-aware meal generation

### The problem it fixes

The calorie engine showed the user a protein target, but generated menus never honored
it. The old path called Spoonacular's `mealplanner/generate`, which only accepts
`targetCalories` — no protein parameter. A muscle-gain user saw a 133 g/day protein
goal and got a calorie-matched menu with whatever protein the recipes happened to have.

### How it works now

The calorie-only `mealplanner/generate` call is replaced with `recipes/complexSearch`,
which supports `minProtein`, `minCalories`/`maxCalories`, `diet`, `excludeIngredients`,
`type`, and `addRecipeNutrition`.

**Slot split.** Each day = breakfast / lunch / dinner, split **30 / 40 / 30**:
- slot protein floor = `proteinGramsPerDay × fraction`
- slot calorie band = `targetCalories × fraction` ± 20%

**Batched per slot-type (3 queries/week).** The daily target is identical across all 7
days, so each slot-type is queried **once** with `number=10`, and the returned recipes
are distributed one-per-day (distinct where possible, cycled if fewer than 7 come back).
This is **3 Spoonacular calls per weekly plan** instead of 21 — better variety (no
repeats) and the same protein adherence.

**Relax-retry (never fatal).** A hard protein floor + tight calorie band + diet/allergy
excludes can return nothing. Per slot-type:
1. full protein floor → 2. relax to 70% → 3. drop floor to 0 (calorie band only).

Whatever fills, fills. When a day's recipes don't all clear their full floor, that day is
flagged `proteinTargetMet: false` and logged — never an error.

### Where it lives

- **`services/mealPlanner/src/utils/dayPlanBuilder.ts`** (new) — pure, dependency-injected
  logic: `splitDailyTargets`, `findMealsForSlotType` (batched relax-retry → recipe pool),
  `buildWeek` (3 queries + per-day distribution + `proteinTargetMet`).
- **`services/mealPlanner/src/services/spoonacularService.service.ts`** — new
  `searchRecipesByNutrition` calling `recipes/complexSearch`. Old `generateMealPlan` /
  `getRecipeDetailsBulk` kept (unused by the new path; complexSearch returns nutrition
  inline, so no bulk-details call needed).
- **`services/mealPlanner/src/services/mealPlannerService.ts`** — `createWeeklyPlan` swaps
  `generateMealPlan` for `buildWeek`. Selected recipe nutrition is cached into the `Recipe`
  collection inline. Day/summary mapping and Mongo save unchanged.
- **`services/mealPlanner/src/models/mealPlanModel.ts`** — `proteinTargetMet?: boolean` per day.
- **`services/mealPlanner/src/utils/types/spoonacularTypes.ts`** — complexSearch + builder types.

### Tests

- `dayPlanBuilder.test.ts` — slot-split math; batched relax-retry; dedup; 3-calls-per-week;
  distinct distribution + cycling; per-day `proteinTargetMet`.
- `searchRecipesByNutrition.test.ts` — complexSearch URL params built correctly (mock axios).
- `createWeeklyPlan.test.ts` — integration with mocked Spoonacular + models: week has
  7 days × 3 meals; `proteinTargetMet` true when floors met, false otherwise.

### Design doc

Full design: [`docs/superpowers/specs/2026-06-19-protein-aware-meal-generation-design.md`](superpowers/specs/2026-06-19-protein-aware-meal-generation-design.md).

---

## Running the tests

From `services/mealPlanner`:

```bash
npm test
```

> **Node 25 note:** `jest-environment-node` trips on Node 25's experimental `localStorage`
> global. If you hit `SecurityError: Cannot initialize local storage`, run jest with
> `NODE_OPTIONS="--localstorage-file=$(mktemp)"`, or pin the service to an LTS Node.

## Out of scope (future work)

- Dashboard "protein consumed vs target" progress tracking (calorie-style).
- Cross-slot combinatorial optimization to hit the exact daily total.
- Per-meal-type tag tuning beyond breakfast / main-course.
