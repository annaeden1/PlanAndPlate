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
    if (goal.includes("loss") || goal.includes("lose")) {
      // Caloric deficit for weight loss
      targets.minCalories = Math.round(cals * 0.6);
      targets.maxCalories = Math.round(cals);
    } else if (goal.includes("gain weight") || goal.includes("bulk")) {
      // Caloric surplus for weight gain
      targets.minCalories = Math.round(cals);
      targets.maxCalories = Math.round(cals * 1.4);
    } else {
      // Maintenance / healthy eating — stay near current intake
      targets.minCalories = Math.round(cals * 0.8);
      targets.maxCalories = Math.round(cals * 1.2);
    }
  }

  if (goal.includes("muscle") || goal.includes("gain")) {
    targets.minProtein = 25;
  }

  if (goal.includes("health") || goal.includes("clean") || goal.includes("balance")) {
    // Encourage moderate calorie range if not already set via cals
    if (!targets.minCalories) {
      targets.minCalories = 300;
      targets.maxCalories = 700;
    }
  }

  return targets;
}
