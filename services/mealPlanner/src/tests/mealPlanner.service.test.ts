import { MealPlan } from "../models/mealPlanModel";
import { Recipe } from "../models/recipeModel";
import { UserFavorites } from "../models/userFavoritesModel";
import mealPlannerService from "../services/mealPlannerService";
import * as spoonacularService from "../services/spoonacularService.service";
import axios from "axios";

jest.mock("../models/mealPlanModel");
jest.mock("../models/recipeModel");
jest.mock("../models/userFavoritesModel");
jest.mock("../services/spoonacularService.service");
jest.mock("axios");

describe("MealPlannerService Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getWeeklyPlan", () => {
    it("should return weekly plan", async () => {
      (MealPlan.findOne as jest.Mock).mockResolvedValue({ id: "plan" });
      const plan = await mealPlannerService.getWeeklyPlan("user-1", "2023-01-01");
      expect(plan).toEqual({ id: "plan" });
      expect(MealPlan.findOne).toHaveBeenCalled();
    });
  });

  describe("getDailyPlan", () => {
    it("should return daily plan", async () => {
      (MealPlan.findOne as jest.Mock).mockResolvedValue({ days: [{ id: "day-1" }] });
      const plan = await mealPlannerService.getDailyPlan("user-1", "2023-01-01");
      expect(plan).toEqual({ id: "day-1" });
    });

    it("should return null if no plan", async () => {
      (MealPlan.findOne as jest.Mock).mockResolvedValue(null);
      const plan = await mealPlannerService.getDailyPlan("user-1", "2023-01-01");
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
      (UserFavorites.findOne as jest.Mock).mockResolvedValue({ likedRecipeIds: ["1", "2"] });
      (Recipe.find as jest.Mock).mockResolvedValue([{ toObject: () => ({ id: "1" }) }]);
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
      (UserFavorites.findOne as jest.Mock).mockResolvedValue({ likedRecipeIds: ["1"] });
      (UserFavorites.updateOne as jest.Mock).mockResolvedValue({});
      const result = await mealPlannerService.toggleRecipeLike("user-1", "1");
      expect(result).toEqual({ isLiked: false });
    });

    it("should add like if exists but not this recipe", async () => {
      (UserFavorites.findOne as jest.Mock).mockResolvedValue({ likedRecipeIds: ["2"] });
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
        toObject: () => ({ id: "created" })
      }));
      const recipe = await mealPlannerService.createManualRecipe({ name: "Manual" }, "user-1");
      expect(mockSave).toHaveBeenCalled();
      expect(recipe).toEqual({ id: "created" });
    });
  });

  describe("getRecipeDetails", () => {
    it("should return recipe details if complete in DB", async () => {
      (Recipe.findOne as jest.Mock).mockResolvedValue({
        instructions: { steps: ["1"] },
        toObject: () => ({ id: "1" })
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
        extendedIngredients: []
      });
      const mockSave = jest.fn();
      (Recipe as any).mockImplementation((opts: any) => ({
        ...opts,
        save: mockSave,
        toObject: () => ({ id: "new" })
      }));
      const recipe = await mealPlannerService.getRecipeDetails("1");
      expect(recipe).toEqual({ id: "new", isLiked: false });
      expect(mockSave).toHaveBeenCalled();
    });
  });
  
  describe("createWeeklyPlan", () => {
    it("should create weekly plan", async () => {
      (axios.get as jest.Mock).mockResolvedValue({ data: { preferences: { diet: ["vegan"] } } });
      (spoonacularService.generateMealPlan as jest.Mock).mockResolvedValue({ week: {} });
      const mockSave = jest.fn();
      (MealPlan as any).mockImplementation((opts: any) => ({
        ...opts,
        save: mockSave
      }));
      const plan = await mealPlannerService.createWeeklyPlan("user-1");
      expect(mockSave).toHaveBeenCalled();
    });
  });
});
