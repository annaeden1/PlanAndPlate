import axios from "axios";
import {
  generateMealPlan,
  getRecipeDetails,
  getRecipeDetailsBulk,
  searchRecipes
} from "../services/spoonacularService.service";

jest.mock("axios");

describe("SpoonacularService Tests", () => {
  beforeEach(() => {
    process.env.SPOONACULAR_API_KEY = "test-key";
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.SPOONACULAR_API_KEY;
  });

  describe("generateMealPlan", () => {
    it("should generate plan", async () => {
      (axios.get as jest.Mock).mockResolvedValue({ data: { week: {} } });
      const res = await generateMealPlan("vegan", "nuts");
      expect(res).toEqual({ week: {} });
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("diet=vegan"));
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("exclude=nuts"));
    });

    it("should throw if no API key", async () => {
      delete process.env.SPOONACULAR_API_KEY;
      await expect(generateMealPlan()).rejects.toThrow("SPOONACULAR_API_KEY is not set");
    });
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

  describe("getRecipeDetailsBulk", () => {
    it("should get bulk details", async () => {
      (axios.get as jest.Mock).mockResolvedValue({ data: [{ id: "1" }, { id: "2" }] });
      const res = await getRecipeDetailsBulk("1,2");
      expect(res).toEqual([{ id: "1" }, { id: "2" }]);
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("ids=1,2"));
    });

    it("should throw if no API key", async () => {
      delete process.env.SPOONACULAR_API_KEY;
      await expect(getRecipeDetailsBulk("1,2")).rejects.toThrow();
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
});
