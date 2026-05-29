// services/mealPlanner/src/tests/embeddingText.test.ts
import { buildEmbeddingText, EmbeddingInput } from "../recommendation/embeddingText";

describe("buildEmbeddingText", () => {
  it("combines name, cuisines, dishTypes, diets and up to 8 ingredient names", () => {
    const input: EmbeddingInput = {
      name: "Pad Thai",
      cuisines: ["Thai", "Asian"],
      dishTypes: ["main course"],
      diets: ["dairy free"],
      ingredients: Array.from({ length: 10 }, (_, i) => ({ name: `ing${i}` })),
    };
    const text = buildEmbeddingText(input);
    expect(text).toContain("Pad Thai");
    expect(text).toContain("Thai");
    expect(text).toContain("main course");
    expect(text).toContain("dairy free");
    expect(text).toContain("ing0");
    expect(text).toContain("ing7");
    expect(text).not.toContain("ing8");
  });

  it("handles missing optional fields", () => {
    expect(buildEmbeddingText({ name: "Toast" })).toBe("Toast");
  });
});
