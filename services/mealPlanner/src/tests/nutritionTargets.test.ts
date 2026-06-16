import { nutritionTargets } from "../recommendation/nutritionTargets";

describe("nutritionTargets", () => {
  it("keeps suggestions within ~20% of the replaced meal for muscle gain", () => {
    const t = nutritionTargets("muscle_gain", 700);
    expect(t.minCalories).toBe(560);
    expect(t.maxCalories).toBe(840);
    expect(t.minProtein).toBe(25);
  });

  it("biases lower with no protein floor for weight loss", () => {
    const t = nutritionTargets("weight_loss", 700);
    expect(t.minCalories).toBe(420);
    expect(t.maxCalories).toBe(700);
    expect(t.minProtein).toBeUndefined();
  });

  it("uses a symmetric band with no protein floor when no goal is set", () => {
    const t = nutritionTargets(undefined, 500);
    expect(t.minCalories).toBe(400);
    expect(t.maxCalories).toBe(600);
    expect(t.minProtein).toBeUndefined();
  });

  it("omits calorie bounds when the current calories are unknown", () => {
    const t = nutritionTargets("muscle_gain", 0);
    expect(t.minCalories).toBeUndefined();
    expect(t.maxCalories).toBeUndefined();
    expect(t.minProtein).toBe(25);
  });
});
