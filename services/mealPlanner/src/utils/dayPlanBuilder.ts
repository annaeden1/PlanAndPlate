import {
  ComplexSearchParams,
  ComplexSearchRecipe,
  DayResult,
  SearchRecipesFn,
  SlotName,
  SlotResult,
  SlotSpec,
  WeekTargets,
} from "./types/spoonacularTypes";

// Daily targets split 30 / 40 / 30 across breakfast / lunch / dinner.
export const SLOT_FRACTIONS = [0.3, 0.4, 0.3];

const SLOT_NAMES: SlotName[] = ["breakfast", "lunch", "dinner"];

// Calorie band tolerance around each slot's calorie share (±20%).
const CALORIE_TOLERANCE = 0.2;

export const BREAKFAST_CALORIE_CAP = 600;

const slotCalorieShares = (targetCalories: number): number[] => {
  const [breakfastFraction, lunchFraction, dinnerFraction] = SLOT_FRACTIONS;
  const breakfast = Math.min(
    targetCalories * breakfastFraction,
    BREAKFAST_CALORIE_CAP,
  );
  const remainder = targetCalories - breakfast;
  const mainShare = lunchFraction + dinnerFraction;
  return [
    breakfast,
    remainder * (lunchFraction / mainShare),
    remainder * (dinnerFraction / mainShare),
  ];
};

export const splitDailyTargets = (
  proteinGramsPerDay: number,
  targetCalories: number,
): SlotSpec[] =>
  slotCalorieShares(targetCalories).map((slotCalories, i) => ({
    slot: SLOT_NAMES[i],
    type: SLOT_NAMES[i] === "breakfast" ? "breakfast" : "main course",
    minProtein:
      targetCalories > 0
        ? proteinGramsPerDay * (slotCalories / targetCalories)
        : 0,
    minCalories: slotCalories * (1 - CALORIE_TOLERANCE),
    maxCalories: slotCalories * (1 + CALORIE_TOLERANCE),
  }));

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

const RELAX_STEPS: { calorieTolerance: number | null; proteinFactor: number }[] =
  [
    { calorieTolerance: CALORIE_TOLERANCE, proteinFactor: 1 },
    { calorieTolerance: CALORIE_TOLERANCE, proteinFactor: 0.7 },
    { calorieTolerance: CALORIE_TOLERANCE, proteinFactor: 0 },
    { calorieTolerance: 0.5, proteinFactor: 0.7 },
    { calorieTolerance: 0.5, proteinFactor: 0 },
    { calorieTolerance: null, proteinFactor: 0 },
  ];

export const findMealsForSlotType = async (
  spec: SlotSpec,
  count: number,
  search: SearchRecipesFn,
): Promise<SlotResult[]> => {
  const slotCalories = (spec.minCalories + spec.maxCalories) / 2;
  const base: ComplexSearchParams = {
    type: spec.type,
    diet: spec.diet,
    excludeIngredients: spec.excludeIngredients,
    number: count,
  };

  for (const step of RELAX_STEPS) {
    const results = await search({
      ...base,
      minProtein: spec.minProtein * step.proteinFactor,
      ...(step.calorieTolerance !== null && {
        minCalories: slotCalories * (1 - step.calorieTolerance),
        maxCalories: slotCalories * (1 + step.calorieTolerance),
      }),
    });

    if (results.length > 0) {
      const seen = new Set<number>();
      const unique = results.filter((r) =>
        seen.has(r.id) ? false : (seen.add(r.id), true),
      );
      return unique.map((r) => toSlotResult(r, spec));
    }
  }

  console.warn(
    `No recipes for ${spec.slot} after every relaxation step ` +
      `(type=${spec.type}, calories≈${Math.round(slotCalories)}, ` +
      `diet=${spec.diet ?? "none"}, exclude=${spec.excludeIngredients ?? "none"})`,
  );
  return [];
};

const DAYS_PER_WEEK = 7;

const SLOT_QUERY_COUNT = 24;

const PROTEIN_WEIGHT = 1.5;
const WEEK_REPEAT_PENALTY = 0.05;
const SAME_DAY_REPEAT_PENALTY = 5;

const composeDay = (
  pools: SlotResult[][],
  targetCalories: number,
  targetProtein: number,
  usedThisWeek: Set<number>,
): SlotResult[] => {
  let best: SlotResult[] = [];
  let bestCost = Infinity;

  const chooseCombination = (
    slotIdx: number,
    chosen: SlotResult[],
    calories: number,
    protein: number,
    repeats: number,
  ) => {
    if (slotIdx === pools.length) {
      const calorieCost =
        Math.abs(calories - targetCalories) / (targetCalories || 1);
      const proteinCost =
        Math.max(0, targetProtein - protein) / (targetProtein || 1);
      const cost = calorieCost + PROTEIN_WEIGHT * proteinCost + repeats;
      if (cost < bestCost) {
        bestCost = cost;
        best = [...chosen];
      }
      return;
    }

    for (const candidate of pools[slotIdx]) {
      const id = candidate.recipe.id;
      const penalty = chosen.some((c) => c.recipe.id === id)
        ? SAME_DAY_REPEAT_PENALTY
        : usedThisWeek.has(id)
          ? WEEK_REPEAT_PENALTY
          : 0;
      chosen.push(candidate);
      chooseCombination(
        slotIdx + 1,
        chosen,
        calories + candidate.calories,
        protein + candidate.protein,
        repeats + penalty,
      );
      chosen.pop();
    }
  };

  chooseCombination(0, [], 0, 0, 0);
  return best;
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

  const pools = poolsBySlot.filter((pool) => pool.length > 0);

  const usedThisWeek = new Set<number>();
  const days: DayResult[] = [];
  for (let dayIdx = 0; dayIdx < DAYS_PER_WEEK; dayIdx++) {
    const slots = composeDay(
      pools,
      targetCalories,
      proteinGramsPerDay,
      usedThisWeek,
    );
    slots.forEach((s) => usedThisWeek.add(s.recipe.id));

    const proteinTotal = slots.reduce((sum, s) => sum + s.protein, 0);
    const proteinTargetMet =
      slots.length === specs.length && proteinTotal >= proteinGramsPerDay;
    days.push({ slots, proteinTargetMet });
  }

  return days;
};
