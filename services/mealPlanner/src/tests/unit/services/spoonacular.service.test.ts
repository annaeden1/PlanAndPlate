import axios from "axios";
import {
  getRecipeDetails,
  searchRecipes,
  searchRecipesByNutrition,
} from "../../../services/spoonacularService.service";

jest.mock("axios");

describe("SpoonacularService Tests", () => {
  beforeEach(() => {
    process.env.SPOONACULAR_API_KEY = "test-key";
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.SPOONACULAR_API_KEY;
  });

  describe("getRecipeDetails", () => {
    it("should get recipe details", async () => {
      (axios.get as jest.Mock).mockResolvedValue({ data: { id: "1" } });
      const res = await getRecipeDetails("1");
      expect(res).toEqual({ id: "1" });
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("/recipes/1/information"));
    });

    it("should throw if no API key", async () => {
      delete process.env.SPOONACULAR_API_KEY;
      await expect(getRecipeDetails("1")).rejects.toThrow();
    });
  });

  describe("searchRecipes", () => {
    it("should search recipes", async () => {
      (axios.get as jest.Mock).mockResolvedValue({ data: { results: [{ id: "1" }] } });
      const res = await searchRecipes({ diet: "vegan" });
      expect(res).toEqual([{ id: "1" }]);
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("diet=vegan"));
    });

    it("should throw if no API key", async () => {
      delete process.env.SPOONACULAR_API_KEY;
      await expect(searchRecipes({})).rejects.toThrow();
    });
  });

  describe("searchRecipesByNutrition — complexSearch params", () => {
    it("builds complexSearch URL with nutrition params and returns results array", async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: { results: [{ id: 1, title: "x", nutrition: { nutrients: [] } }] },
      });

      const out = await searchRecipesByNutrition({
        type: "main course",
        minProtein: 60,
        minCalories: 640,
        maxCalories: 960,
        diet: "vegetarian",
        excludeIngredients: "peanuts,shellfish",
        number: 3,
      });

      expect(out).toHaveLength(1);
      expect(out[0].id).toBe(1);

      const url: string = (axios.get as jest.Mock).mock.calls[0][0];
      expect(url).toContain("recipes/complexSearch");
      expect(url).toContain("addRecipeNutrition=true");
      expect(url).toContain("type=main+course");
      expect(url).toContain("minProtein=60");
      expect(url).toContain("minCalories=640");
      expect(url).toContain("maxCalories=960");
      expect(url).toContain("diet=vegetarian");
      expect(url).toContain("excludeIngredients=peanuts%2Cshellfish");
      expect(url).toContain("number=3");
      expect(url).toContain("apiKey=test-key");
    });

    it("rounds numeric params and omits undefined optionals", async () => {
      (axios.get as jest.Mock).mockResolvedValue({ data: { results: [] } });

      await searchRecipesByNutrition({
        minProtein: 44.7,
        minCalories: 639.6,
        maxCalories: 960.2,
      });

      const url: string = (axios.get as jest.Mock).mock.calls[0][0];
      expect(url).toContain("minProtein=45");
      expect(url).toContain("minCalories=640");
      expect(url).toContain("maxCalories=960");
      expect(url).not.toContain("diet=");
      expect(url).not.toContain("type=");
      expect(url).not.toContain("excludeIngredients=");
      expect(url).not.toContain("offset=");
    });

    it("passes offset when provided", async () => {
      (axios.get as jest.Mock).mockResolvedValue({ data: { results: [] } });

      await searchRecipesByNutrition({ minProtein: 10, offset: 14 });

      const url: string = (axios.get as jest.Mock).mock.calls[0][0];
      expect(url).toContain("offset=14");
    });

    it("throws when API key missing", async () => {
      delete process.env.SPOONACULAR_API_KEY;
      await expect(searchRecipesByNutrition({ minProtein: 10 })).rejects.toThrow(
        "SPOONACULAR_API_KEY is not set",
      );
    });
  });
});
