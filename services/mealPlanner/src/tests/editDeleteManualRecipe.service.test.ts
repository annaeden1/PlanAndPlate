jest.mock("../models/mealPlanModel", () => ({
  __esModule: true,
  MealPlan: {},
}));

jest.mock("../models/recipeModel", () => ({
  __esModule: true,
  Recipe: {
    findOne: jest.fn(),
    deleteOne: jest.fn(),
  },
}));

jest.mock("../models/userFavoritesModel", () => ({
  __esModule: true,
  UserFavorites: {
    updateMany: jest.fn(),
  },
}));

import mealPlannerService from "../services/mealPlannerService";
import { Recipe } from "../models/recipeModel";
import { UserFavorites } from "../models/userFavoritesModel";

const buildManualRecipe = (overrides: Record<string, any> = {}) => ({
  originRecipeId: "user-1-abc123",
  source: "manual",
  userId: "user-1",
  name: "My Salad",
  servings: 2,
  readyInMinutes: 10,
  instructions: { steps: ["Chop veggies", "Mix"], ingredients: [] },
  set: jest.fn(),
  save: jest.fn(),
  toObject: jest.fn().mockReturnThis(),
  ...overrides,
});

describe("mealPlannerService.updateManualRecipe", () => {
  beforeEach(() => jest.clearAllMocks());

  it("updates and returns the recipe when the user is the owner", async () => {
    const recipe = buildManualRecipe();
    (Recipe.findOne as jest.Mock).mockResolvedValue(recipe);

    const result = await mealPlannerService.updateManualRecipe(
      "user-1-abc123",
      { name: "Updated Salad", servings: 4 },
      "user-1",
    );

    expect(recipe.name).toBe("Updated Salad");
    expect(recipe.servings).toBe(4);
    expect(recipe.save).toHaveBeenCalled();
    expect(result).toBeTruthy();
  });

  it("returns null when recipe is not found", async () => {
    (Recipe.findOne as jest.Mock).mockResolvedValue(null);
    const result = await mealPlannerService.updateManualRecipe("missing", {}, "user-1");
    expect(result).toBeNull();
  });

  it("throws FORBIDDEN when userId does not match", async () => {
    const recipe = buildManualRecipe({ userId: "other-user" });
    (Recipe.findOne as jest.Mock).mockResolvedValue(recipe);

    await expect(
      mealPlannerService.updateManualRecipe("user-1-abc123", { name: "Hack" }, "user-1"),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("throws FORBIDDEN when recipe is not manual", async () => {
    const recipe = buildManualRecipe({ source: "spoonacular" });
    (Recipe.findOne as jest.Mock).mockResolvedValue(recipe);

    await expect(
      mealPlannerService.updateManualRecipe("user-1-abc123", { name: "Hack" }, "user-1"),
    ).rejects.toThrow("FORBIDDEN");
  });
});

describe("mealPlannerService.deleteManualRecipe", () => {
  beforeEach(() => jest.clearAllMocks());

  it("deletes the recipe and removes it from favorites", async () => {
    const recipe = buildManualRecipe();
    (Recipe.findOne as jest.Mock).mockResolvedValue(recipe);
    (Recipe.deleteOne as jest.Mock).mockResolvedValue({});
    (UserFavorites.updateMany as jest.Mock).mockResolvedValue({});

    const result = await mealPlannerService.deleteManualRecipe("user-1-abc123", "user-1");

    expect(result).toBe(true);
    expect(Recipe.deleteOne).toHaveBeenCalledWith({ originRecipeId: "user-1-abc123" });
    expect(UserFavorites.updateMany).toHaveBeenCalledWith(
      { likedRecipeIds: "user-1-abc123" },
      { $pull: { likedRecipeIds: "user-1-abc123" } },
    );
  });

  it("returns false when recipe is not found", async () => {
    (Recipe.findOne as jest.Mock).mockResolvedValue(null);
    const result = await mealPlannerService.deleteManualRecipe("missing", "user-1");
    expect(result).toBe(false);
    expect(Recipe.deleteOne).not.toHaveBeenCalled();
  });

  it("throws FORBIDDEN when userId does not match", async () => {
    const recipe = buildManualRecipe({ userId: "other-user" });
    (Recipe.findOne as jest.Mock).mockResolvedValue(recipe);

    await expect(
      mealPlannerService.deleteManualRecipe("user-1-abc123", "user-1"),
    ).rejects.toThrow("FORBIDDEN");
  });
});
