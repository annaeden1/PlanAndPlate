import {
  splitDailyTargets,
  findMealsForSlotType,
  buildWeek,
  SLOT_FRACTIONS,
} from "../../../utils/dayPlanBuilder";
import {
  ComplexSearchParams,
  ComplexSearchRecipe,
  SlotSpec,
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

describe("splitDailyTargets — high daily calorie targets", () => {
  // 2919 kcal / 144 g protein — the profile that produced a week with no
  // breakfast in production. A flat 30% share demands a 701–1051 kcal
  // breakfast, which no recipe catalogue holds.
  const HIGH_CALORIES = 2919;
  const HIGH_PROTEIN = 144;

  const slotCalories = (s: SlotSpec) => (s.minCalories + s.maxCalories) / 2;

  it("keeps the slot shares proportional rather than capping any slot", () => {
    const slots = splitDailyTargets(HIGH_PROTEIN, HIGH_CALORIES);
    SLOT_FRACTIONS.forEach((fraction, i) =>
      expect(slotCalories(slots[i])).toBeCloseTo(HIGH_CALORIES * fraction, 0),
    );
  });

  it("still distributes the whole daily calorie target across the three slots", () => {
    const slots = splitDailyTargets(HIGH_PROTEIN, HIGH_CALORIES);
    const total = slots.reduce((sum, s) => sum + slotCalories(s), 0);
    expect(total).toBeCloseTo(HIGH_CALORIES, 0);
  });

  it("still distributes the whole daily protein target across the three slots", () => {
    const slots = splitDailyTargets(HIGH_PROTEIN, HIGH_CALORIES);
    const total = slots.reduce((sum, s) => sum + s.minProtein, 0);
    expect(total).toBeCloseTo(HIGH_PROTEIN, 0);
  });

  it("leaves the 30/40/30 split untouched at ordinary targets", () => {
    const slots = splitDailyTargets(150, 2000);
    expect(slotCalories(slots[0])).toBeCloseTo(600);
    expect(slotCalories(slots[1])).toBeCloseTo(800);
    expect(slotCalories(slots[2])).toBeCloseTo(600);
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

  it("widens the calorie band once the protein floor is exhausted", async () => {
    // Only a 300 kcal recipe exists — far below the slot's 640–960 band.
    const calls: ComplexSearchParams[] = [];
    const search = async (p: ComplexSearchParams) => {
      calls.push(p);
      if ((p.minCalories ?? 0) > 400) return [];
      return [recipe(9, 20, 300)];
    };

    const results = await findMealsForSlotType(slotSpec(), 7, search);

    expect(results.map((r) => r.recipe.id)).toEqual([9]);
    expect(Math.min(...calls.map((c) => c.minCalories ?? 0))).toBeLessThan(640);
  });

  it("drops the calorie band entirely as the last resort", async () => {
    const calls: ComplexSearchParams[] = [];
    const search = async (p: ComplexSearchParams) => {
      calls.push(p);
      const unconstrained =
        p.minCalories === undefined && p.maxCalories === undefined;
      return unconstrained ? [recipe(11, 12, 180)] : [];
    };

    const results = await findMealsForSlotType(slotSpec(), 7, search);

    expect(results.map((r) => r.recipe.id)).toEqual([11]);
    expect(results[0].proteinFloorMet).toBe(false);
  });

  it("keeps the slot type on every relaxation step", async () => {
    const calls: ComplexSearchParams[] = [];
    const search = async (p: ComplexSearchParams) => {
      calls.push(p);
      return [];
    };

    await findMealsForSlotType(slotSpec(), 7, search);

    expect(calls.length).toBeGreaterThan(3);
    expect(calls.every((c) => c.type === "main course")).toBe(true);
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

  it("flags proteinTargetMet from the day's total, not each slot's own floor", async () => {
    // Per-slot floors are 45/60/45; every recipe carries 55 g, so lunch misses
    // its share while the day totals 165 g against a 150 g target.
    const search = async (p: ComplexSearchParams) =>
      Array.from({ length: 7 }, (_, i) =>
        recipe((p.type === "breakfast" ? 100 : 200) + i, 55, 650),
      );

    const week = await buildWeek(
      { proteinGramsPerDay: 150, targetCalories: 2000 },
      search,
    );

    week.forEach((day) => {
      expect(day.slots.some((s) => !s.proteinFloorMet)).toBe(true);
      expect(day.proteinTargetMet).toBe(true);
    });
  });

  it("keeps the day's calorie fit ahead of avoiding a repeated recipe", async () => {
    // Breakfast pool: one recipe that completes a 2000 kcal day exactly, and a
    // 300 kcal alternative that leaves the day 15% short. Repeating should win.
    const search = async (p: ComplexSearchParams) => {
      if (p.type === "breakfast") return [recipe(1, 50, 600), recipe(2, 50, 300)];
      return (p.minCalories ?? 0) > 700
        ? [recipe(3, 60, 800)] // lunch
        : [recipe(4, 45, 600)]; // dinner
    };

    const week = await buildWeek(
      { proteinGramsPerDay: 150, targetCalories: 2000 },
      search,
    );

    const breakfastIds = week.map(
      (d) => d.slots.find((s) => s.slot === "breakfast")!.recipe.id,
    );
    expect(breakfastIds).toEqual([1, 1, 1, 1, 1, 1, 1]);
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

// Regression for the production plan that came back with lunch and dinner only.
// The search stub models a realistic catalogue: breakfasts are small, main
// courses are large, and no breakfast recipe exists above 600 kcal.
describe("buildWeek — high-calorie profile against a realistic catalogue", () => {
  const HIGH_CALORIES = 2919;
  const HIGH_PROTEIN = 144;

  const amountOf = (r: ComplexSearchRecipe, name: string) =>
    r.nutrition.nutrients.find((n) => n.name === name)!.amount;

  const BREAKFASTS = Array.from({ length: 24 }, (_, i) =>
    recipe(100 + i, 12 + i, 220 + i * 16), // 220–588 kcal, 12–35 g protein
  );
  const MAINS = Array.from({ length: 24 }, (_, i) =>
    recipe(200 + i, 28 + i * 2, 480 + i * 34), // 480–1262 kcal, 28–74 g protein
  );

  const catalogueSearch = async (p: ComplexSearchParams) => {
    const pool = p.type === "breakfast" ? BREAKFASTS : MAINS;
    return pool
      .filter((r) => {
        const cal = amountOf(r, "Calories");
        const pro = amountOf(r, "Protein");
        if (p.minCalories !== undefined && cal < p.minCalories) return false;
        if (p.maxCalories !== undefined && cal > p.maxCalories) return false;
        if (p.minProtein !== undefined && pro < p.minProtein) return false;
        return true;
      })
      .slice(0, p.number ?? 7);
  };

  const dayCalories = (day: { slots: { calories: number }[] }) =>
    day.slots.reduce((sum, s) => sum + s.calories, 0);
  const dayProtein = (day: { slots: { protein: number }[] }) =>
    day.slots.reduce((sum, s) => sum + s.protein, 0);

  it("fills breakfast, lunch and dinner on every one of the seven days", async () => {
    const week = await buildWeek(
      { proteinGramsPerDay: HIGH_PROTEIN, targetCalories: HIGH_CALORIES },
      catalogueSearch,
    );

    expect(week).toHaveLength(7);
    week.forEach((day) =>
      expect(day.slots.map((s) => s.slot)).toEqual([
        "breakfast",
        "lunch",
        "dinner",
      ]),
    );
  });

  it("lands each day within 10% of the daily calorie target", async () => {
    const week = await buildWeek(
      { proteinGramsPerDay: HIGH_PROTEIN, targetCalories: HIGH_CALORIES },
      catalogueSearch,
    );

    week.forEach((day) => {
      const deviation =
        Math.abs(dayCalories(day) - HIGH_CALORIES) / HIGH_CALORIES;
      expect(deviation).toBeLessThanOrEqual(0.1);
    });
  });

  it("reaches the daily protein target every day", async () => {
    const week = await buildWeek(
      { proteinGramsPerDay: HIGH_PROTEIN, targetCalories: HIGH_CALORIES },
      catalogueSearch,
    );

    week.forEach((day) => expect(dayProtein(day)).toBeGreaterThanOrEqual(HIGH_PROTEIN));
  });

  it("never trades more than the variety budget of calorie accuracy", async () => {
    const week = await buildWeek(
      { proteinGramsPerDay: HIGH_PROTEIN, targetCalories: HIGH_CALORIES },
      catalogueSearch,
    );

    const deviations = week.map(
      (day) => Math.abs(dayCalories(day) - HIGH_CALORIES) / HIGH_CALORIES,
    );
    // The best day shows what the pools can do; no other day may fall further
    // than the 5% variety budget behind it.
    expect(Math.max(...deviations) - Math.min(...deviations)).toBeLessThanOrEqual(
      0.05,
    );
  });

  it("does not serve the same recipe twice in one day", async () => {
    const week = await buildWeek(
      { proteinGramsPerDay: HIGH_PROTEIN, targetCalories: HIGH_CALORIES },
      catalogueSearch,
    );

    week.forEach((day) => {
      const ids = day.slots.map((s) => s.recipe.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  it("varies the breakfast across the week rather than repeating one recipe", async () => {
    const week = await buildWeek(
      { proteinGramsPerDay: HIGH_PROTEIN, targetCalories: HIGH_CALORIES },
      catalogueSearch,
    );

    const breakfastIds = week.map(
      (d) => d.slots.find((s) => s.slot === "breakfast")!.recipe.id,
    );
    expect(new Set(breakfastIds).size).toBeGreaterThanOrEqual(5);
  });
});
