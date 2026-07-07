import { MealPlan } from "../../../models/mealPlanModel";
import { Recipe } from "../../../models/recipeModel";
import { UserFavorites } from "../../../models/userFavoritesModel";
import mealPlannerService from "../../../services/mealPlannerService";
import * as spoonacularService from "../../../services/spoonacularService.service";
import axios from "axios";

jest.mock("../../../models/mealPlanModel");
jest.mock("../../../models/recipeModel");
jest.mock("../../../models/userFavoritesModel");
jest.mock("../../../services/spoonacularService.service");
jest.mock("axios");

const buildPlan = () => {
  const day: any = {
    date: new Date("2026-05-31T12:00:00Z"),
    breakfast: { recipeId: "b", name: "B", calories: 100, image: "b.jpg" },
    lunch: { recipeId: "l", name: "L", calories: 200, image: "l.jpg" },
    dinner: { recipeId: "d", name: "D", calories: 300, image: "d.jpg" },
  };
  return {
    days: [day],
    nutritionSummary: { calories: 0 },
    save: jest.fn(),
    markModified: jest.fn(),
  };
};

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

describe("MealPlannerService Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  afterEach(() => jest.restoreAllMocks());

  describe("getWeeklyPlan", () => {
    it("should return weekly plan", async () => {
      (MealPlan.findOne as jest.Mock).mockResolvedValue({ id: "plan" });
      const plan = await mealPlannerService.getWeeklyPlan(
        "user-1",
        "2023-01-01",
      );
      expect(plan).toEqual({ id: "plan" });
      expect(MealPlan.findOne).toHaveBeenCalled();
    });
  });

  describe("getDailyPlan", () => {
    it("should return daily plan", async () => {
      (MealPlan.findOne as jest.Mock).mockResolvedValue({
        days: [{ id: "day-1" }],
      });
      const plan = await mealPlannerService.getDailyPlan(
        "user-1",
        "2023-01-01",
      );
      expect(plan).toEqual({ id: "day-1" });
    });

    it("should return null if no plan", async () => {
      (MealPlan.findOne as jest.Mock).mockResolvedValue(null);
      const plan = await mealPlannerService.getDailyPlan(
        "user-1",
        "2023-01-01",
      );
      expect(plan).toBeNull();
    });
  });

  describe("getManualRecipes", () => {
    it("should return manual recipes", async () => {
      (Recipe.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue([{ id: "recipe-1" }]),
      });
      const recipes = await mealPlannerService.getManualRecipes("user-1");
      expect(recipes).toEqual([{ id: "recipe-1" }]);
    });
  });

  describe("getLikedRecipes", () => {
    it("should return empty if no favs", async () => {
      (UserFavorites.findOne as jest.Mock).mockResolvedValue(null);
      const recipes = await mealPlannerService.getLikedRecipes("user-1");
      expect(recipes).toEqual([]);
    });

    it("should return liked recipes", async () => {
      (UserFavorites.findOne as jest.Mock).mockResolvedValue({
        likedRecipeIds: ["1", "2"],
      });
      (Recipe.find as jest.Mock).mockResolvedValue([
        { toObject: () => ({ id: "1" }) },
      ]);
      const recipes = await mealPlannerService.getLikedRecipes("user-1");
      expect(recipes).toEqual([{ id: "1", isLiked: true }]);
    });
  });

  describe("toggleRecipeLike", () => {
    it("should add like if no favs exist", async () => {
      (UserFavorites.findOne as jest.Mock).mockResolvedValue(null);
      (UserFavorites.create as jest.Mock).mockResolvedValue({});
      const result = await mealPlannerService.toggleRecipeLike("user-1", "1");
      expect(result).toEqual({ isLiked: true });
    });

    it("should remove like if exists", async () => {
      (UserFavorites.findOne as jest.Mock).mockResolvedValue({
        likedRecipeIds: ["1"],
      });
      (UserFavorites.updateOne as jest.Mock).mockResolvedValue({});
      const result = await mealPlannerService.toggleRecipeLike("user-1", "1");
      expect(result).toEqual({ isLiked: false });
    });

    it("should add like if exists but not this recipe", async () => {
      (UserFavorites.findOne as jest.Mock).mockResolvedValue({
        likedRecipeIds: ["2"],
      });
      (UserFavorites.updateOne as jest.Mock).mockResolvedValue({});
      const result = await mealPlannerService.toggleRecipeLike("user-1", "1");
      expect(result).toEqual({ isLiked: true });
    });
  });

  describe("createManualRecipe", () => {
    it("should create recipe with fallback nutrition", async () => {
      const mockSave = jest.fn();
      (Recipe as any).mockImplementation(() => ({
        save: mockSave,
        toObject: () => ({ id: "created" }),
      }));
      const recipe = await mealPlannerService.createManualRecipe(
        { name: "Manual" },
        "user-1",
      );
      expect(mockSave).toHaveBeenCalled();
      expect(recipe).toEqual({ id: "created" });
    });
  });

  describe("getRecipeDetails", () => {
    it("should return recipe details if complete in DB", async () => {
      (Recipe.findOne as jest.Mock).mockResolvedValue({
        instructions: { steps: ["1"] },
        toObject: () => ({ id: "1" }),
      });
      const recipe = await mealPlannerService.getRecipeDetails("1", "user-1");
      expect(recipe).toEqual({ id: "1", isLiked: false });
    });

    it("should fetch from spoonacular if incomplete", async () => {
      (Recipe.findOne as jest.Mock).mockResolvedValue(null);
      (spoonacularService.getRecipeDetails as jest.Mock).mockResolvedValue({
        title: "Fetched",
        nutrition: { nutrients: [] },
        analyzedInstructions: [],
        extendedIngredients: [],
      });
      const mockSave = jest.fn();
      (Recipe as any).mockImplementation((opts: any) => ({
        ...opts,
        save: mockSave,
        toObject: () => ({ id: "new" }),
      }));
      const recipe = await mealPlannerService.getRecipeDetails("1");
      expect(recipe).toEqual({ id: "new", isLiked: false });
      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe("createWeeklyPlan", () => {
    it("should create weekly plan", async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: { preferences: { diet: ["vegan"] } },
      });
      (spoonacularService.generateMealPlan as jest.Mock).mockResolvedValue({
        week: {},
      });
      const mockSave = jest.fn();
      (MealPlan as any).mockImplementation((opts: any) => ({
        ...opts,
        save: mockSave,
      }));
      const plan = await mealPlannerService.createWeeklyPlan("user-1");
      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe("mealPlannerService.replaceMeal", () => {
    it("swaps the slot, recomputes total calories and saves", async () => {
      jest.spyOn(mealPlannerService, "getRecipeDetails").mockResolvedValue({
        name: "Gyoza",
        calories: 400,
        image: "gyoza.jpg",
      } as any);
      const plan = buildPlan();
      (MealPlan.findOne as jest.Mock).mockResolvedValue(plan);

      const day = await mealPlannerService.replaceMeal(
        "user-1",
        "2026-05-31",
        "dinner",
        "222",
      );

      expect(day?.dinner).toEqual({
        recipeId: "222",
        name: "Gyoza",
        calories: 400,
        image: "gyoza.jpg",
      });
      expect(plan.nutritionSummary.calories).toBe(700); // 100 + 200 + 400
      expect(plan.markModified).toHaveBeenCalledWith("days");
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

  describe("mealPlannerService.updateManualRecipe", () => {
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
      const result = await mealPlannerService.updateManualRecipe(
        "missing",
        {},
        "user-1",
      );
      expect(result).toBeNull();
    });

    it("throws FORBIDDEN when userId does not match", async () => {
      const recipe = buildManualRecipe({ userId: "other-user" });
      (Recipe.findOne as jest.Mock).mockResolvedValue(recipe);

      await expect(
        mealPlannerService.updateManualRecipe(
          "user-1-abc123",
          { name: "Hack" },
          "user-1",
        ),
      ).rejects.toThrow("FORBIDDEN");
    });

    it("throws FORBIDDEN when recipe is not manual", async () => {
      const recipe = buildManualRecipe({ source: "spoonacular" });
      (Recipe.findOne as jest.Mock).mockResolvedValue(recipe);

      await expect(
        mealPlannerService.updateManualRecipe(
          "user-1-abc123",
          { name: "Hack" },
          "user-1",
        ),
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

      const result = await mealPlannerService.deleteManualRecipe(
        "user-1-abc123",
        "user-1",
      );

      expect(result).toBe(true);
      expect(Recipe.deleteOne).toHaveBeenCalledWith({
        originRecipeId: "user-1-abc123",
      });
      expect(UserFavorites.updateMany).toHaveBeenCalledWith(
        { likedRecipeIds: "user-1-abc123" },
        { $pull: { likedRecipeIds: "user-1-abc123" } },
      );
    });

    it("returns false when recipe is not found", async () => {
      (Recipe.findOne as jest.Mock).mockResolvedValue(null);
      const result = await mealPlannerService.deleteManualRecipe(
        "missing",
        "user-1",
      );
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

  describe("mealPlannerService.getUserStats", () => {
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
            },
          ],
        },
        {
          days: [
            {
              breakfast: { recipeId: "104", name: "Oatmeal" },
              lunch: { recipeId: "105", name: "Sandwich" },
              dinner: { recipeId: "106", name: "Soup" },
            },
          ],
        },
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

      expect(MealPlan.countDocuments).toHaveBeenCalledWith({
        userId: "user-1",
      });
      expect(MealPlan.find).toHaveBeenCalledWith({ userId: "user-1" });
      expect(Recipe.countDocuments).toHaveBeenCalledWith({
        userId: "user-1",
        source: "manual",
      });
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
});
