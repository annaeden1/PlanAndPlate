import axios from "axios";
import { searchRecipesByNutrition } from "../services/spoonacularService.service";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("searchRecipesByNutrition — complexSearch params", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...OLD_ENV, SPOONACULAR_API_KEY: "test-key" };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("builds complexSearch URL with nutrition params and returns results array", async () => {
    mockedAxios.get.mockResolvedValue({
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

    const url: string = mockedAxios.get.mock.calls[0][0];
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
    mockedAxios.get.mockResolvedValue({ data: { results: [] } });

    await searchRecipesByNutrition({
      minProtein: 44.7,
      minCalories: 639.6,
      maxCalories: 960.2,
    });

    const url: string = mockedAxios.get.mock.calls[0][0];
    expect(url).toContain("minProtein=45");
    expect(url).toContain("minCalories=640");
    expect(url).toContain("maxCalories=960");
    expect(url).not.toContain("diet=");
    expect(url).not.toContain("type=");
    expect(url).not.toContain("excludeIngredients=");
  });

  it("throws when API key missing", async () => {
    delete process.env.SPOONACULAR_API_KEY;
    await expect(searchRecipesByNutrition({ minProtein: 10 })).rejects.toThrow(
      "SPOONACULAR_API_KEY is not set",
    );
  });
});
