jest.mock("../models/mealPlanModel", () => ({
  __esModule: true,
  MealPlan: {
    countDocuments: jest.fn(),
    find: jest.fn(),
  },
}));

jest.mock("../models/recipeModel", () => ({
  __esModule: true,
  Recipe: {
    countDocuments: jest.fn(),
  },
}));

import mealPlannerService from "../services/mealPlannerService";
import { MealPlan } from "../models/mealPlanModel";
import { Recipe } from "../models/recipeModel";

describe("mealPlannerService.getUserStats", () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(() => jest.restoreAllMocks());

  it("calculates statistics correctly by counting weeks, meals in plans, and manual recipes", async () => {
    (MealPlan.countDocuments as jest.Mock).mockResolvedValue(2);

    const mockMealPlans = [
      {
        days: [
          {
            breakfast: { recipeId: "101", name: "Pancakes" },
            lunch: { recipeId: "0", name: "" }, // empty
            dinner: { recipeId: "102", name: "Pasta" },
          },
          {
            breakfast: { recipeId: "", name: "" }, // empty
            lunch: { recipeId: "103", name: "Salad" },
            dinner: { recipeId: 0, name: "" }, // empty (number)
          }
        ]
      },
      {
        days: [
          {
            breakfast: { recipeId: "104", name: "Oatmeal" },
            lunch: { recipeId: "105", name: "Sandwich" },
            dinner: { recipeId: "106", name: "Soup" },
          }
        ]
      }
    ];
    (MealPlan.find as jest.Mock).mockResolvedValue(mockMealPlans);
    (Recipe.countDocuments as jest.Mock).mockResolvedValue(3); // 3 manual recipes

    const stats = await mealPlannerService.getUserStats("user-1");

    expect(stats.weeksActive).toBe(2);
    // Valid meals:
    // Plan 1, Day 1: breakfast (101), dinner (102) -> 2
    // Plan 1, Day 2: lunch (103) -> 1
    // Plan 2, Day 1: breakfast (104), lunch (105), dinner (106) -> 3
    // Total in plans = 2 + 1 + 3 = 6
    // Manual recipes = 3
    // Total meals logged = 6 + 3 = 9
    expect(stats.mealsLogged).toBe(9);

    expect(MealPlan.countDocuments).toHaveBeenCalledWith({ userId: "user-1" });
    expect(MealPlan.find).toHaveBeenCalledWith({ userId: "user-1" });
    expect(Recipe.countDocuments).toHaveBeenCalledWith({ userId: "user-1", source: "manual" });
  });

  it("handles empty database results gracefully", async () => {
    (MealPlan.countDocuments as jest.Mock).mockResolvedValue(0);
    (MealPlan.find as jest.Mock).mockResolvedValue([]);
    (Recipe.countDocuments as jest.Mock).mockResolvedValue(0);

    const stats = await mealPlannerService.getUserStats("user-2");

    expect(stats.weeksActive).toBe(0);
    expect(stats.mealsLogged).toBe(0);
  });
});
