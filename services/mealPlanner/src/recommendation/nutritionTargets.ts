export interface NutritionTargets {
  minCalories?: number;
  maxCalories?: number;
  minProtein?: number;
}

export function nutritionTargets(
  healthGoal: string | undefined,
  currentCalories: number | undefined,
): NutritionTargets {
  const goal = (healthGoal || "").toLowerCase();
  const cals = currentCalories ?? 0;
  const targets: NutritionTargets = {};

  if (cals > 0) {
    if (goal.includes("loss") || goal.includes("weight")) {
      targets.minCalories = Math.round(cals * 0.6);
      targets.maxCalories = Math.round(cals);
    } else {
      targets.minCalories = Math.round(cals * 0.8);
      targets.maxCalories = Math.round(cals * 1.2);
    }
  }

  if (goal.includes("muscle") || goal.includes("gain")) {
    targets.minProtein = 25;
  }

  return targets;
}
