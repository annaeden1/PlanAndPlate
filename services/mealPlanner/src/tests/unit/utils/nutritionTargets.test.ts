import { nutritionTargets } from "../../../recommendation/nutritionTargets";

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
  describe("weight loss goals", () => {
    it("sets deficit range for 'weight loss' goal", () => {
      const result = nutritionTargets("weight loss", 500);
      expect(result.minCalories).toBe(300); // 500 * 0.6
      expect(result.maxCalories).toBe(500);
    });

    it("sets deficit range for 'lose weight' goal", () => {
      const result = nutritionTargets("lose weight", 600);
      expect(result.minCalories).toBe(360);
      expect(result.maxCalories).toBe(600);
    });
  });

  describe("weight gain / bulking goals", () => {
    it("sets surplus range for 'gain weight' goal", () => {
      const result = nutritionTargets("gain weight", 500);
      expect(result.minCalories).toBe(500);
      expect(result.maxCalories).toBe(700); // 500 * 1.4
    });

    it("sets surplus range for 'bulk' goal", () => {
      const result = nutritionTargets("bulk up", 400);
      expect(result.minCalories).toBe(400);
      expect(result.maxCalories).toBe(560);
    });

    it("sets minProtein for muscle gain goal", () => {
      const result = nutritionTargets("muscle gain", 500);
      expect(result.minProtein).toBe(25);
    });
  });

  describe("maintenance goals", () => {
    it("sets maintenance range for unknown goal with calories", () => {
      const result = nutritionTargets("maintenance", 500);
      expect(result.minCalories).toBe(400); // 500 * 0.8
      expect(result.maxCalories).toBe(600); // 500 * 1.2
    });
  });

  describe("healthy/balanced goals (no calories provided)", () => {
    it("sets default range for 'healthy eating' goal with no current calories", () => {
      const result = nutritionTargets("healthy eating", 0);
      expect(result.minCalories).toBe(300);
      expect(result.maxCalories).toBe(700);
    });

    it("sets default range for 'clean eating' goal with no current calories", () => {
      const result = nutritionTargets("clean eating", undefined);
      expect(result.minCalories).toBe(300);
      expect(result.maxCalories).toBe(700);
    });

    it("sets default range for 'balanced diet' goal with no current calories", () => {
      const result = nutritionTargets("balanced diet", undefined);
      expect(result.minCalories).toBe(300);
      expect(result.maxCalories).toBe(700);
    });

    it("does NOT override calorie targets already set when healthy+calories given", () => {
      // 'healthy' with actual calories — maintenance range takes priority over default 300-700
      const result = nutritionTargets("healthy eating", 500);
      expect(result.minCalories).toBe(400);
      expect(result.maxCalories).toBe(600);
    });
  });

  describe("edge cases", () => {
    it("returns empty object when no goal and no calories", () => {
      const result = nutritionTargets(undefined, undefined);
      expect(result).toEqual({});
    });

    it("returns empty object when empty goal and zero calories", () => {
      const result = nutritionTargets("", 0);
      expect(result).toEqual({});
    });
  });
});
