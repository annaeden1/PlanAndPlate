import {
  ComplexSearchParams,
  ComplexSearchRecipe,
  DayResult,
  MealType,
  SearchRecipesFn,
  SlotName,
  SlotResult,
} from "./types/spoonacularTypes";

// Daily targets split 30 / 40 / 30 across breakfast / lunch / dinner.
export const SLOT_FRACTIONS = [0.3, 0.4, 0.3];

const SLOT_NAMES: SlotName[] = ["breakfast", "lunch", "dinner"];

// Calorie band tolerance around each slot's calorie share (±20%).
const CALORIE_TOLERANCE = 0.2;

export type SlotSpec = ComplexSearchParams & {
  slot: SlotName;
  type: MealType;
  minProtein: number;
  minCalories: number;
  maxCalories: number;
};

export const splitDailyTargets = (
  proteinGramsPerDay: number,
  targetCalories: number,
): SlotSpec[] =>
  SLOT_FRACTIONS.map((fraction, i) => {
    const slotCalories = targetCalories * fraction;
    return {
      slot: SLOT_NAMES[i],
      type: SLOT_NAMES[i] === "breakfast" ? "breakfast" : "main course",
      minProtein: proteinGramsPerDay * fraction,
      minCalories: slotCalories * (1 - CALORIE_TOLERANCE),
      maxCalories: slotCalories * (1 + CALORIE_TOLERANCE),
    };
  });

const nutrientAmount = (recipe: ComplexSearchRecipe, name: string): number =>
  recipe.nutrition?.nutrients?.find((n) => n.name === name)?.amount ?? 0;

const toSlotResult = (
  recipe: ComplexSearchRecipe,
  spec: SlotSpec,
): SlotResult => {
  const protein = nutrientAmount(recipe, "Protein");
  return {
    slot: spec.slot,
    recipe,
    protein,
    calories: nutrientAmount(recipe, "Calories"),
    proteinFloorMet: protein >= spec.minProtein,
  };
};

export const findMealsForSlotType = async (
  spec: SlotSpec,
  count: number,
  search: SearchRecipesFn,
): Promise<SlotResult[]> => {
  const base: ComplexSearchParams = {
    type: spec.type,
    minCalories: spec.minCalories,
    maxCalories: spec.maxCalories,
    diet: spec.diet,
    excludeIngredients: spec.excludeIngredients,
    number: count,
  };

  const proteinFloors = [spec.minProtein, spec.minProtein * 0.7, 0];

  for (const minProtein of proteinFloors) {
    const results = await search({ ...base, minProtein });
    if (results.length > 0) {
      const seen = new Set<number>();
      const unique = results.filter((r) =>
        seen.has(r.id) ? false : (seen.add(r.id), true),
      );
      return unique.map((r) => toSlotResult(r, spec));
    }
  }

  return [];
};

export type DietOpts = {
  diet?: string;
  excludeIngredients?: string;
};

const DAYS_PER_WEEK = 7;

const SLOT_QUERY_COUNT = 10;

export type WeekTargets = DietOpts & {
  proteinGramsPerDay: number;
  targetCalories: number;
};

export const buildWeek = async (
  targets: WeekTargets,
  search: SearchRecipesFn,
): Promise<DayResult[]> => {
  const { proteinGramsPerDay, targetCalories, ...diet } = targets;
  const specs = splitDailyTargets(proteinGramsPerDay, targetCalories).map(
    (spec) => ({ ...spec, ...diet }),
  );

  const poolsBySlot = await Promise.all(
    specs.map((spec) => findMealsForSlotType(spec, SLOT_QUERY_COUNT, search)),
  );

  const days: DayResult[] = [];
  for (let dayIdx = 0; dayIdx < DAYS_PER_WEEK; dayIdx++) {
    const slots: SlotResult[] = [];
    for (const pool of poolsBySlot) {
      if (pool.length === 0) continue; // slot-type yielded nothing — omit
      slots.push(pool[dayIdx % pool.length]); // distinct, cycle if pool < 7
    }
    const proteinTargetMet =
      slots.length === specs.length && slots.every((s) => s.proteinFloorMet);
    days.push({ slots, proteinTargetMet });
  }

  return days;
};
