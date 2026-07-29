import { buildTasteProfile, TasteRecipe } from "../../../recommendation/tasteProfile";
import { AiProvider } from "../../../ai/aiProvider";

const fakeProvider = (vec: number[]): AiProvider => ({
  embed: async (texts: string[]) => texts.map(() => vec),
});

const recipe = (over: Partial<TasteRecipe> = {}): TasteRecipe => ({
  name: "Pad Thai",
  cuisines: ["Thai"],
  dishTypes: ["main course"],
  diets: [],
  ingredients: [],
  ...over,
});

describe("buildTasteProfile", () => {
  it("uses liked recipes when there are at least MIN_LIKES (3)", async () => {
    const liked = [
      recipe({ cuisines: ["Thai"] }),
      recipe({ cuisines: ["Thai", "Asian"] }),
      recipe({ cuisines: ["Japanese"] }),
    ];
    const profile = await buildTasteProfile({
      likedRecipes: liked,
      currentRecipe: recipe({ cuisines: ["Italian"] }),
      prefs: { diet: "vegetarian" },
      provider: fakeProvider([1, 0, 0]),
    });
    expect(profile.centroid).toEqual([1, 0, 0]);
    expect(profile.cuisines[0]).toBe("Thai");
    expect(profile.diet).toBe("vegetarian");
  });

  it("cold-starts from the current recipe + prefs when likes are sparse", async () => {
    const profile = await buildTasteProfile({
      likedRecipes: [recipe()],
      currentRecipe: recipe({ cuisines: ["Mexican"] }),
      prefs: { diet: "vegan", healthGoal: "weight_loss" },
      provider: fakeProvider([0, 1, 0]),
    });
    expect(profile.centroid).toEqual([0, 1, 0]);
    expect(profile.cuisines).toEqual(["Mexican"]);
  });

  it("infers cuisines from recipe names when likes are not tagged", async () => {
    const liked = [
      recipe({ cuisines: [], name: "Spaghetti Bolognese" }), // Italian
      recipe({ cuisines: [], name: "Homemade Pizza Margherita" }), // Italian
      recipe({ cuisines: [], name: "Chicken Tikka Masala" }), // Indian
      recipe({ cuisines: [], name: "Unlabeled Mystery Plate" }), // no match -> dropped
    ];
    const profile = await buildTasteProfile({
      likedRecipes: liked,
      currentRecipe: recipe({ cuisines: [], name: "Plain Bowl" }),
      prefs: {},
      provider: fakeProvider([1, 0]),
    });
    expect(profile.cuisines[0]).toBe("Italian");
    expect(profile.cuisines).toContain("Indian");
    expect(profile.cuisines).not.toContain("Unlabeled Mystery Plate");
  });

  it("returns an empty centroid when the provider yields no embeddings", async () => {
    const profile = await buildTasteProfile({
      likedRecipes: [recipe(), recipe(), recipe()],
      currentRecipe: recipe(),
      prefs: {},
      provider: { embed: async (t: string[]) => t.map(() => []) },
    });
    expect(profile.centroid).toEqual([]);
  });
});
