jest.mock("../models/mealPlanModel", () => ({
  __esModule: true,
  MealPlan: { findOne: jest.fn() },
}));

import mealPlannerService from "../services/mealPlannerService";
import { MealPlan } from "../models/mealPlanModel";

const buildPlan = () => {
  const day: any = {
    date: new Date("2026-05-31T12:00:00Z"),
    breakfast: { recipeId: "b", name: "B", calories: 100 },
    lunch: { recipeId: "l", name: "L", calories: 200 },
    dinner: { recipeId: "d", name: "D", calories: 300 },
  };
  return { days: [day], nutritionSummary: { calories: 0 }, save: jest.fn() };
};

describe("mealPlannerService.replaceMeal", () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(() => jest.restoreAllMocks());

  it("swaps the slot, recomputes total calories and saves", async () => {
    jest
      .spyOn(mealPlannerService, "getRecipeDetails")
      .mockResolvedValue({ name: "Gyoza", calories: 400 } as any);
    const plan = buildPlan();
    (MealPlan.findOne as jest.Mock).mockResolvedValue(plan);

    const day = await mealPlannerService.replaceMeal(
      "user-1",
      "2026-05-31",
      "dinner",
      "222",
    );

    expect(day?.dinner).toEqual({ recipeId: "222", name: "Gyoza", calories: 400 });
    expect(plan.nutritionSummary.calories).toBe(700); // 100 + 200 + 400
    expect(plan.save).toHaveBeenCalled();
  });

  it("returns null when the new recipe cannot be fetched", async () => {
    jest
      .spyOn(mealPlannerService, "getRecipeDetails")
      .mockResolvedValue(null as any);

    const day = await mealPlannerService.replaceMeal(
      "user-1",
      "2026-05-31",
      "dinner",
      "222",
    );

    expect(day).toBeNull();
    expect(MealPlan.findOne).not.toHaveBeenCalled();
  });

  it("returns null when no plan contains the requested day", async () => {
    jest
      .spyOn(mealPlannerService, "getRecipeDetails")
      .mockResolvedValue({ name: "Gyoza", calories: 400 } as any);
    (MealPlan.findOne as jest.Mock).mockResolvedValue(null);

    const day = await mealPlannerService.replaceMeal(
      "user-1",
      "2026-05-31",
      "dinner",
      "222",
    );

    expect(day).toBeNull();
  });
});
