import axios from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock the Spoonacular search so no network call happens. Every slot gets a
// recipe whose protein clears the requested floor.
const searchMock = jest.fn();
jest.mock("../services/spoonacularService.service", () => ({
  searchRecipesByNutrition: (params: any) => searchMock(params),
  getRecipeDetails: jest.fn(),
}));

// Capture what gets saved to Mongo without a real DB.
const savedPlans: any[] = [];
jest.mock("../models/recipeModel", () => ({
  Recipe: {
    find: jest.fn().mockResolvedValue([]),
    insertMany: jest.fn().mockResolvedValue([]),
  },
}));
jest.mock("../models/mealPlanModel", () => ({
  MealPlan: class {
    [key: string]: any;
    constructor(doc: any) {
      Object.assign(this, doc);
      savedPlans.push(this);
    }
    save() {
      return Promise.resolve(this);
    }
  },
}));
jest.mock("../models/userFavoritesModel", () => ({
  UserFavorites: {},
}));

import mealPlannerService from "../services/mealPlannerService";

const recipe = (protein: number, calories: number) => ({
  id: Math.floor(Math.random() * 1e6),
  title: "meal",
  nutrition: {
    nutrients: [
      { name: "Protein", amount: protein, unit: "g", percentOfDailyNeeds: 0 },
      { name: "Calories", amount: calories, unit: "kcal", percentOfDailyNeeds: 0 },
    ],
  },
});

describe("createWeeklyPlan — protein-aware integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    savedPlans.length = 0;
    process.env.USER_MANAGMENT_URL = "http://user";

    // User has complete bodyStats → protein floor applies.
    mockedAxios.get.mockResolvedValue({
      data: {
        userPreferences: {
          allergies: ["peanuts"],
          diet: "vegetarian",
          bodyStats: {
            weightKg: 70,
            heightCm: 175,
            age: 30,
            gender: "male",
            activityLevel: "moderate",
            unitSystem: "metric",
          },
          healthGoal: "gain_muscle",
        },
      },
    });
  });

  it("builds 7 days × 3 meals and marks proteinTargetMet true when floors met", async () => {
    // Always return a recipe well above any requested floor.
    searchMock.mockImplementation((p: any) =>
      Promise.resolve([recipe((p.minProtein ?? 0) + 30, 700)]),
    );

    await mealPlannerService.createWeeklyPlan("user1", "2026-06-17", "tok");

    expect(savedPlans).toHaveLength(1);
    const plan = savedPlans[0];
    expect(plan.days).toHaveLength(7);
    plan.days.forEach((d: any) => {
      expect(d.breakfast.recipeId).not.toBe("0");
      expect(d.lunch.recipeId).not.toBe("0");
      expect(d.dinner.recipeId).not.toBe("0");
      expect(d.proteinTargetMet).toBe(true);
    });
  });

  it("flags proteinTargetMet false when no recipe meets the floor", async () => {
    // Floor never met: only return low-protein recipes after floor drops to 0.
    searchMock.mockImplementation((p: any) =>
      (p.minProtein ?? 0) > 0
        ? Promise.resolve([])
        : Promise.resolve([recipe(5, 700)]),
    );

    await mealPlannerService.createWeeklyPlan("user1", "2026-06-17", "tok");

    const plan = savedPlans[0];
    plan.days.forEach((d: any) => {
      expect(d.proteinTargetMet).toBe(false);
    });
  });
});
