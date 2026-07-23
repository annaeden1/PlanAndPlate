import { Recipe } from "../../../models/recipeModel";
import {
  makeCachedSearch,
  normalizeAllergyList,
} from "../../../services/cachedRecipeSearch";
import { ComplexSearchRecipe } from "../../../utils/types/spoonacularTypes";

jest.mock("../../../models/recipeModel");
jest.mock("../../../services/spoonacularService.service");

const cachedDoc = (id: string, overrides: Record<string, unknown> = {}) => ({
  originRecipeId: id,
  source: "spoonacular",
  name: `cached-${id}`,
  image: `${id}.jpg`,
  calories: 500,
  protein: 30,
  fat: 15,
  carbs: 40,
  diets: ["vegetarian"],
  ...overrides,
});

const apiRecipe = (id: number): ComplexSearchRecipe => ({
  id,
  title: `api-${id}`,
  nutrition: { nutrients: [] },
});

const params = {
  type: "main course" as const,
  minProtein: 20,
  minCalories: 400,
  maxCalories: 700,
  number: 3,
};

describe("normalizeAllergyList", () => {
  it("lowercases, trims, drops empties and sorts", () => {
    expect(normalizeAllergyList(" Peanuts,  LACTOSE ,, gluten")).toEqual([
      "gluten",
      "lactose",
      "peanuts",
    ]);
  });

  it("returns [] for undefined/empty", () => {
    expect(normalizeAllergyList(undefined)).toEqual([]);
    expect(normalizeAllergyList("")).toEqual([]);
  });
});

describe("makeCachedSearch", () => {
  const searchApi = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("serves from cache and never calls the API when enough local matches", async () => {
    (Recipe.aggregate as jest.Mock).mockResolvedValue([
      cachedDoc("11"),
      cachedDoc("12"),
      cachedDoc("13"),
    ]);
    const search = makeCachedSearch({ recentRecipeIds: [], searchApi });

    const results = await search(params);

    expect(searchApi).not.toHaveBeenCalled();
    expect(results).toHaveLength(3);
    // Mapped back to ComplexSearchRecipe shape
    expect(results[0].id).toBe(11);
    expect(results[0].title).toBe("cached-11");
    expect(
      results[0].nutrition.nutrients.find((n) => n.name === "Protein")?.amount,
    ).toBe(30);
    expect(
      results[0].nutrition.nutrients.find((n) => n.name === "Calories")?.amount,
    ).toBe(500);
  });

  it("builds the $match with nutrition, diet, allergy and no-repeat filters", async () => {
    (Recipe.aggregate as jest.Mock).mockResolvedValue([]);
    searchApi.mockResolvedValue([]);
    const search = makeCachedSearch({
      recentRecipeIds: ["77"],
      allergies: "Nuts, Lactose",
      searchApi,
    });

    await search({ ...params, diet: "vegetarian" });

    const pipeline = (Recipe.aggregate as jest.Mock).mock.calls[0][0];
    expect(pipeline[0].$match).toEqual({
      source: "spoonacular",
      calories: { $gte: 400, $lte: 700 },
      protein: { $gte: 20 },
      diets: "vegetarian",
      fetchedWithExclusions: { $all: ["lactose", "nuts"] },
      originRecipeId: { $nin: ["77"] },
    });
    expect(pipeline[1]).toEqual({ $sample: { size: 3 } });
  });

  it("omits allergy filter for users without allergies", async () => {
    (Recipe.aggregate as jest.Mock).mockResolvedValue([]);
    searchApi.mockResolvedValue([]);
    const search = makeCachedSearch({ recentRecipeIds: [], searchApi });

    await search(params);

    const match = (Recipe.aggregate as jest.Mock).mock.calls[0][0][0].$match;
    expect(match.fetchedWithExclusions).toBeUndefined();
    expect(match.originRecipeId).toBeUndefined();
  });

  it("falls through to the API with a random offset when cache is short", async () => {
    (Recipe.aggregate as jest.Mock).mockResolvedValue([cachedDoc("11")]);
    searchApi.mockResolvedValue([apiRecipe(1), apiRecipe(2), apiRecipe(3)]);
    const search = makeCachedSearch({ recentRecipeIds: [], searchApi });

    const results = await search(params);

    expect(searchApi).toHaveBeenCalledTimes(1);
    const apiParams = searchApi.mock.calls[0][0];
    expect(apiParams.minProtein).toBe(20);
    expect(apiParams.offset).toBeGreaterThanOrEqual(0);
    expect(apiParams.offset).toBeLessThanOrEqual(30);
    expect(results.map((r) => r.id)).toEqual([1, 2, 3]);
  });

  it("filters API results against the no-repeat list", async () => {
    (Recipe.aggregate as jest.Mock).mockResolvedValue([]);
    searchApi.mockResolvedValue([apiRecipe(1), apiRecipe(2), apiRecipe(3)]);
    const search = makeCachedSearch({ recentRecipeIds: ["2"], searchApi });

    const results = await search(params);

    expect(results.map((r) => r.id)).toEqual([1, 3]);
  });

  it("defaults searchApi to the real Spoonacular search when none is injected", async () => {
    (Recipe.aggregate as jest.Mock).mockResolvedValue([
      cachedDoc("11"),
      cachedDoc("12"),
      cachedDoc("13"),
    ]);
    const search = makeCachedSearch({ recentRecipeIds: [] });

    const results = await search(params);

    expect(results).toHaveLength(3);
  });

  it("maps missing nutrition fields to 0", async () => {
    (Recipe.aggregate as jest.Mock).mockResolvedValue([
      { originRecipeId: "50", name: "bare", image: "b.jpg", diets: [] },
    ]);
    const search = makeCachedSearch({ recentRecipeIds: [], searchApi });

    const results = await search({ number: 1 });

    const nutrients = results[0].nutrition.nutrients;
    expect(nutrients.find((n) => n.name === "Calories")?.amount).toBe(0);
    expect(nutrients.find((n) => n.name === "Protein")?.amount).toBe(0);
    expect(nutrients.find((n) => n.name === "Fat")?.amount).toBe(0);
    expect(nutrients.find((n) => n.name === "Carbohydrates")?.amount).toBe(0);
  });

  it("uses the default pool size and a minimal $match when params are omitted", async () => {
    (Recipe.aggregate as jest.Mock).mockResolvedValue([]);
    searchApi.mockResolvedValue([]);
    const search = makeCachedSearch({ recentRecipeIds: [], searchApi });

    await search({});

    const pipeline = (Recipe.aggregate as jest.Mock).mock.calls[0][0];
    expect(pipeline[0].$match).toEqual({ source: "spoonacular" });
    expect(pipeline[1]).toEqual({ $sample: { size: 7 } });
  });

  it("builds a one-sided calorie filter when only one bound is given", async () => {
    (Recipe.aggregate as jest.Mock).mockResolvedValue([]);
    searchApi.mockResolvedValue([]);
    const search = makeCachedSearch({ recentRecipeIds: [], searchApi });

    await search({ minCalories: 400 });
    await search({ maxCalories: 700 });

    const first = (Recipe.aggregate as jest.Mock).mock.calls[0][0][0].$match;
    const second = (Recipe.aggregate as jest.Mock).mock.calls[1][0][0].$match;
    expect(first.calories).toEqual({ $gte: 400 });
    expect(second.calories).toEqual({ $lte: 700 });
  });

  it("treats a null aggregate result as an empty cache", async () => {
    (Recipe.aggregate as jest.Mock).mockResolvedValue(null);
    searchApi.mockResolvedValue([apiRecipe(7)]);
    const search = makeCachedSearch({ recentRecipeIds: [], searchApi });

    const results = await search(params);

    expect(searchApi).toHaveBeenCalledTimes(1);
    expect(results.map((r) => r.id)).toEqual([7]);
  });

  it("falls back to the API when the cache query throws", async () => {
    (Recipe.aggregate as jest.Mock).mockRejectedValue(new Error("db down"));
    searchApi.mockResolvedValue([apiRecipe(9)]);
    const search = makeCachedSearch({ recentRecipeIds: [], searchApi });

    const results = await search(params);

    expect(searchApi).toHaveBeenCalledTimes(1);
    expect(results.map((r) => r.id)).toEqual([9]);
  });
});
