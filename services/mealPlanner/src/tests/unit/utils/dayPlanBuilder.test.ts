import {
  splitDailyTargets,
  findMealsForSlotType,
  buildWeek,
  SLOT_FRACTIONS,
  SlotSpec,
} from "../../../utils/dayPlanBuilder";
import {
  ComplexSearchParams,
  ComplexSearchRecipe,
} from "../../../utils/types/spoonacularTypes";

// Build a fake recipe with a given protein/calorie amount.
const recipe = (
  id: number,
  protein: number,
  calories: number,
): ComplexSearchRecipe => ({
  id,
  title: `recipe-${id}`,
  nutrition: {
    nutrients: [
      { name: "Protein", amount: protein, unit: "g", percentOfDailyNeeds: 0 },
      { name: "Calories", amount: calories, unit: "kcal", percentOfDailyNeeds: 0 },
    ],
  },
});

const slotSpec = (): SlotSpec => ({
  slot: "lunch",
  type: "main course",
  minProtein: 60,
  minCalories: 640,
  maxCalories: 960,
});

describe("splitDailyTargets — 30/40/30 slot split", () => {
  it("splits protein floor and calorie band per slot", () => {
    // 150 g protein/day, 2000 kcal/day
    const slots = splitDailyTargets(150, 2000);

    expect(slots).toHaveLength(3);
    expect(slots.map((s: { slot: string }) => s.slot)).toEqual([
      "breakfast",
      "lunch",
      "dinner",
    ]);

    // protein floor = daily * fraction
    expect(slots[0].minProtein).toBeCloseTo(150 * 0.3); // 45
    expect(slots[1].minProtein).toBeCloseTo(150 * 0.4); // 60
    expect(slots[2].minProtein).toBeCloseTo(150 * 0.3); // 45

    // calorie band = daily * fraction ± 20%
    const lunchCals = 2000 * 0.4; // 800
    expect(slots[1].minCalories).toBeCloseTo(lunchCals * 0.8); // 640
    expect(slots[1].maxCalories).toBeCloseTo(lunchCals * 1.2); // 960
  });

  it("maps breakfast slot to breakfast meal type, others to main course", () => {
    const slots = splitDailyTargets(150, 2000);
    expect(slots[0].type).toBe("breakfast");
    expect(slots[1].type).toBe("main course");
    expect(slots[2].type).toBe("main course");
  });

  it("fractions sum to 1", () => {
    const sum = SLOT_FRACTIONS.reduce((a: number, b: number) => a + b, 0);
    expect(sum).toBeCloseTo(1);
  });
});

describe("findMealsForSlotType — batched relax-retry", () => {
  it("requests `count` recipes in a single query at full floor", async () => {
    const calls: ComplexSearchParams[] = [];
    const search = async (p: ComplexSearchParams) => {
      calls.push(p);
      return [recipe(1, 65, 800), recipe(2, 70, 820)];
    };

    const results = await findMealsForSlotType(slotSpec(), 7, search);

    expect(results).toHaveLength(2);
    expect(results.every((r) => r.proteinFloorMet)).toBe(true);
    expect(calls).toHaveLength(1); // one batched query, not per-day
    expect(calls[0].minProtein).toBe(60); // full floor
    expect(calls[0].number).toBe(7); // asked for 7 in one call
  });

  it("relaxes to 70% floor when full floor empty", async () => {
    const calls: ComplexSearchParams[] = [];
    const search = async (p: ComplexSearchParams) => {
      calls.push(p);
      if (p.minProtein === 60) return [];
      return [recipe(2, 45, 800)]; // 45 < 60 floor
    };

    const results = await findMealsForSlotType(slotSpec(), 7, search);

    expect(results).toHaveLength(1);
    expect(results[0].recipe.id).toBe(2);
    expect(results[0].proteinFloorMet).toBe(false); // 45 < 60
    expect(calls.map((c) => c.minProtein)).toEqual([60, 42]); // 60, 70%
  });

  it("drops protein floor to 0 when 70% also empty", async () => {
    const calls: ComplexSearchParams[] = [];
    const search = async (p: ComplexSearchParams) => {
      calls.push(p);
      if ((p.minProtein ?? 0) > 0) return [];
      return [recipe(3, 20, 800)];
    };

    const results = await findMealsForSlotType(slotSpec(), 7, search);

    expect(results[0].recipe.id).toBe(3);
    expect(results[0].proteinFloorMet).toBe(false);
    expect(calls.map((c) => c.minProtein)).toEqual([60, 42, 0]);
  });

  it("returns empty array when no recipe exists even with no protein floor", async () => {
    const search = async () => [];
    const results = await findMealsForSlotType(slotSpec(), 7, search);
    expect(results).toEqual([]);
  });

  it("dedups recipes by id", async () => {
    const search = async () => [recipe(1, 65, 800), recipe(1, 65, 800), recipe(2, 65, 800)];
    const results = await findMealsForSlotType(slotSpec(), 7, search);
    expect(results.map((r) => r.recipe.id)).toEqual([1, 2]);
  });
});

describe("buildWeek — 3 batched queries, distinct recipes across 7 days", () => {
  it("issues exactly 3 search calls (one per slot-type) for a full week", async () => {
    const calls: ComplexSearchParams[] = [];
    const search = async (p: ComplexSearchParams) => {
      calls.push(p);
      // 7 distinct recipes per slot-type, each above floor
      return Array.from({ length: 7 }, (_, i) =>
        recipe(p.type === "breakfast" ? 100 + i : 200 + i, (p.minProtein ?? 0) + 5, 700),
      );
    };

    const week = await buildWeek(
      { proteinGramsPerDay: 150, targetCalories: 2000 },
      search,
    );

    expect(calls).toHaveLength(3); // breakfast + lunch + dinner, NOT 21
    expect(week).toHaveLength(7);
    week.forEach((day) => expect(day.slots).toHaveLength(3));
  });

  it("assigns a distinct recipe to each day per slot-type", async () => {
    const search = async (p: ComplexSearchParams) =>
      Array.from({ length: 7 }, (_, i) =>
        recipe((p.type === "breakfast" ? 100 : 200) + i, (p.minProtein ?? 0) + 5, 700),
      );

    const week = await buildWeek(
      { proteinGramsPerDay: 150, targetCalories: 2000 },
      search,
    );

    const breakfastIds = week.map(
      (d) => d.slots.find((s) => s.slot === "breakfast")!.recipe.id,
    );
    expect(new Set(breakfastIds).size).toBe(7); // all distinct
  });

  it("cycles recipes when fewer than 7 distinct are available", async () => {
    const search = async (p: ComplexSearchParams) =>
      [recipe(p.type === "breakfast" ? 100 : 200, (p.minProtein ?? 0) + 5, 700)];

    const week = await buildWeek(
      { proteinGramsPerDay: 150, targetCalories: 2000 },
      search,
    );

    expect(week).toHaveLength(7);
    week.forEach((day) => expect(day.slots).toHaveLength(3)); // every day still filled
  });

  it("flags proteinTargetMet per day from that day's recipes", async () => {
    const search = async (p: ComplexSearchParams) => {
      if (p.type === "breakfast") {
        // 7 breakfasts above floor
        return Array.from({ length: 7 }, (_, i) =>
          recipe(100 + i, (p.minProtein ?? 0) + 5, 600),
        );
      }
      // main course: full floor empty → relax → below-floor recipes
      if ((p.minProtein ?? 0) === (p.minCalories! > 700 ? 60 : 45)) {
        // only return on relaxed call
      }
      if ((p.minProtein ?? 0) > 0) return [];
      return Array.from({ length: 7 }, (_, i) => recipe(200 + i, 5, 700));
    };

    const week = await buildWeek(
      { proteinGramsPerDay: 150, targetCalories: 2000 },
      search,
    );

    // lunch + dinner never meet floor → every day flagged false
    week.forEach((day) => expect(day.proteinTargetMet).toBe(false));
  });

  it("omits a slot and flags false when a slot-type yields nothing", async () => {
    const search = async (p: ComplexSearchParams) =>
      p.type === "breakfast"
        ? []
        : Array.from({ length: 7 }, (_, i) => recipe(200 + i, 100, 700));

    const week = await buildWeek(
      { proteinGramsPerDay: 150, targetCalories: 2000 },
      search,
    );

    week.forEach((day) => {
      expect(day.slots.map((s) => s.slot)).toEqual(["lunch", "dinner"]);
      expect(day.proteinTargetMet).toBe(false);
    });
  });

  it("passes diet and excludeIngredients through to every query", async () => {
    const calls: ComplexSearchParams[] = [];
    const search = async (p: ComplexSearchParams) => {
      calls.push(p);
      return [recipe(1, 100, 700)];
    };

    await buildWeek(
      {
        proteinGramsPerDay: 150,
        targetCalories: 2000,
        diet: "vegan",
        excludeIngredients: "nuts",
      },
      search,
    );

    expect(calls.every((c) => c.diet === "vegan")).toBe(true);
    expect(calls.every((c) => c.excludeIngredients === "nuts")).toBe(true);
  });
});
