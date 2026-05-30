import axios from "axios";

jest.mock("axios");

jest.mock("../models/userFavoritesModel", () => ({
  __esModule: true,
  UserFavorites: { findOne: jest.fn() },
}));

jest.mock("../models/recipeModel", () => ({
  __esModule: true,
  Recipe: { findOne: jest.fn(), updateOne: jest.fn() },
}));

jest.mock("../services/spoonacularService.service", () => ({
  __esModule: true,
  searchRecipes: jest.fn(),
}));

jest.mock("../services/mealPlannerService", () => ({
  __esModule: true,
  default: { getRecipeDetails: jest.fn() },
}));

import recommendationService from "../recommendation/recommendationService";
import { Recipe } from "../models/recipeModel";
import { UserFavorites } from "../models/userFavoritesModel";
import { searchRecipes } from "../services/spoonacularService.service";
import { __setAiProvider } from "../ai/aiProvider";

const mockedAxios = axios as jest.Mocked<typeof axios>;

const tasteDoc = (cuisines: string[], calories = 500) => ({
  name: `recipe ${cuisines.join("-")}`,
  cuisines,
  dishTypes: ["main course"],
  diets: [],
  instructions: { ingredients: [] },
  embedding: [1, 0],
  calories,
});

const candidate = (id: number, title: string) => ({
  id,
  title,
  image: `${title}.jpg`,
  readyInMinutes: 20,
  cuisines: ["Thai"],
  dishTypes: ["main course"],
  diets: [],
  nutrition: { nutrients: [{ name: "Calories", amount: 550 }] },
});

beforeEach(() => {
  jest.clearAllMocks();

  (UserFavorites.findOne as jest.Mock).mockResolvedValue({
    likedRecipeIds: ["1", "2", "3"],
  });

  const docs: Record<string, ReturnType<typeof tasteDoc> | undefined> = {
    "1": tasteDoc(["Thai"]),
    "2": tasteDoc(["Thai", "Asian"]),
    "3": tasteDoc(["Japanese"]),
    "99": tasteDoc(["Italian"], 600),
  };
  (Recipe.findOne as jest.Mock).mockImplementation(({ originRecipeId }) =>
    Promise.resolve(docs[originRecipeId] ?? null),
  );
  (Recipe.updateOne as jest.Mock).mockResolvedValue({});

  mockedAxios.get.mockResolvedValue({
    data: {
      userPreferences: {
        diet: ["vegetarian"],
        healthGoal: "muscle_gain",
        allergies: ["peanut"],
      },
    },
  });

  __setAiProvider({
    embed: async (texts) => texts.map(() => [1, 0]),
    explain: async (_cuisines, cands) =>
      Object.fromEntries(cands.map((c) => [c.originRecipeId, `why ${c.originRecipeId}`])),
  });
});

afterAll(() => __setAiProvider(null));

describe("recommendationService.getSuggestions", () => {
  it("excludes the current and liked recipes, ranks the rest, and attaches reasons", async () => {
    (searchRecipes as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        candidate(99, "Current"),
        candidate(1, "Liked"),
        candidate(4, "New A"),
        candidate(5, "New B"),
      ]);

    const result = await recommendationService.getSuggestions(
      "user-1",
      "99",
      "dinner",
      6,
      "Bearer t",
    );

    expect(result.map((r) => r.originRecipeId)).toEqual(["4", "5"]);
    expect(result.every((r) => r.why?.startsWith("why "))).toBe(true);
  });

  it("relaxes the search progressively until it finds candidates", async () => {
    (searchRecipes as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([candidate(4, "New A")]);

    const result = await recommendationService.getSuggestions(
      "user-1",
      "99",
      "dinner",
      6,
    );

    expect(searchRecipes).toHaveBeenCalledTimes(3);
    expect(result.map((r) => r.originRecipeId)).toEqual(["4"]);
  });

  it("never relaxes allergy intolerances across fallback attempts", async () => {
    (searchRecipes as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([candidate(4, "New A")]);

    await recommendationService.getSuggestions("user-1", "99", "dinner", 6);

    for (const call of (searchRecipes as jest.Mock).mock.calls) {
      expect(call[0].intolerances).toBe("peanut");
    }
  });

  it("fetches user preferences only once (diet, goal and allergies together)", async () => {
    (searchRecipes as jest.Mock).mockResolvedValue([candidate(4, "New A")]);

    await recommendationService.getSuggestions("user-1", "99", "dinner", 6);

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });
});
