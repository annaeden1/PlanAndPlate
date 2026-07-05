import mongoose from "mongoose";
import { IMealPlan } from "../../../models/mealPlanModel";
import { IRecipe } from "../../../models/recipeModel";
import { RecipeResponse } from "../../../utils/types/spoonacularTypes";

export const mockUserId = "user-123456789";
export const mockRecipeId1 = "10001";
export const mockRecipeId2 = "10002";
export const mockRecipeId3 = "10003";

export const mockRecipeData1: Partial<IRecipe> = {
  _id: new mongoose.Types.ObjectId(),
  originRecipeId: mockRecipeId1,
  source: "spoonacular",
  name: "Spicy Creamy Vegan Ramen",
  image: "https://spoonacular.com/recipeImages/10001-556x370.jpg",
  calories: 550,
  protein: 15,
  fat: 20,
  carbs: 75,
  servings: 2,
  readyInMinutes: 45,
  diets: ["vegan", "dairy free"],
  cuisines: ["Japanese"],
  dishTypes: ["soup"],
  instructions: {
    steps: ["Boil water.", "Add noodles.", "Add spices.", "Serve hot."],
    ingredients: [
      {
        id: 111,
        name: "ramen noodles",
        amount: 2,
        unit: "packs",
        image: "noodles.jpg",
        aisle: "Pasta",
      },
      {
        id: 112,
        name: "chili oil",
        amount: 1,
        unit: "tbsp",
        image: "chili-oil.jpg",
        aisle: "Condiments",
      },
    ],
  },
};

export const mockRecipeData2: Partial<IRecipe> = {
  _id: new mongoose.Types.ObjectId(),
  originRecipeId: mockRecipeId2,
  source: "manual",
  userId: mockUserId,
  name: "Avocado Toast",
  image: "https://spoonacular.com/recipeImages/10002-556x370.jpg",
  calories: 350,
  protein: 8,
  fat: 25,
  carbs: 28,
  servings: 1,
  readyInMinutes: 5,
  diets: ["vegan", "vegetarian"],
  instructions: {
    steps: ["Toast bread.", "Mash avocado.", "Spread avocado on toast."],
    ingredients: [
      {
        id: 201,
        name: "bread",
        amount: 2,
        unit: "slices",
        image: "bread.jpg",
        aisle: "Bakery",
      },
      {
        id: 202,
        name: "avocado",
        amount: 1,
        unit: "whole",
        image: "avocado.jpg",
        aisle: "Produce",
      },
    ],
  },
};

export const mockMealPlanData: IMealPlan = {
  userId: mockUserId,
  days: [
    {
      date: new Date("2023-01-01T00:00:00Z"),
      breakfast: {
        recipeId: mockRecipeId2,
        name: "Avocado Toast",
        calories: 350,
        image: "https://spoonacular.com/recipeImages/10002-556x370.jpg",
      },
      lunch: {
        recipeId: mockRecipeId1,
        name: "Spicy Creamy Vegan Ramen",
        calories: 550,
        image: "https://spoonacular.com/recipeImages/10001-556x370.jpg",
      },
      dinner: {
        recipeId: mockRecipeId3,
        name: "Grilled Chicken Salad",
        calories: 450,
        image: "https://spoonacular.com/recipeImages/10003-556x370.jpg",
      },
    },
  ],
  nutritionSummary: {
    calories: 1350,
    protein: 65,
    fat: 55,
    carbs: 140,
  },
};

export const mockUserFavoritesData = {
  _id: new mongoose.Types.ObjectId(),
  userId: mockUserId,
  favoriteRecipeIds: [mockRecipeId1, mockRecipeId2],
};

// Provide a fully populated mock object matching RecipeResponse from spoonacularTypes
export const mockSpoonacularRecipeResponse: RecipeResponse = {
  id: mockRecipeId1,
  title: "Spicy Creamy Vegan Ramen",
  image: "https://spoonacular.com/recipeImages/10001-556x370.jpg",
  imageType: "jpg",
  servings: 2,
  readyInMinutes: 45,
  sourceUrl: "http://example.com/ramen",
  vegetarian: false,
  vegan: true,
  glutenFree: false,
  dairyFree: true,
  veryHealthy: true,
  cheap: false,
  veryPopular: true,
  sustainable: false,
  lowFodmap: false,
  weightWatcherSmartPoints: 10,
  gaps: "no",
  preparationMinutes: 10,
  cookingMinutes: 35,
  aggregateLikes: 200,
  healthScore: 85,
  creditText: "Example Author",
  license: "CC BY 4.0",
  sourceName: "Example Source",
  pricePerServing: 1.5,
  diets: ["vegan", "dairy free"],
  cuisines: ["Japanese"],
  dishTypes: ["soup"],
  summary: "A very tasty vegan ramen.",
  occasions: [],
  winePairing: { pairedWines: [], pairingText: "", productMatches: [] },
  instructions: "Boil water. Add noodles. Add spices. Serve hot.",
  analyzedInstructions: [
    {
      name: "",
      steps: [
        {
          number: 1,
          step: "Boil water.",
          ingredients: [],
          equipment: [{ id: 1, name: "pot", localizedName: "pot", image: "pot.jpg" }],
          length: { number: 10, unit: "minutes" }
        },
        {
          number: 2,
          step: "Add noodles.",
          ingredients: [{ id: 111, name: "ramen noodles", localizedName: "ramen noodles", image: "noodles.jpg" }],
          equipment: [],
          length: { number: 5, unit: "minutes" }
        },
      ],
    },
  ],
  extendedIngredients: [
    {
      id: 111,
      name: "ramen noodles",
      nameClean: "ramen noodles",
      original: "2 packs ramen noodles",
      originalName: "ramen noodles",
      amount: 2,
      unit: "packs",
      image: "noodles.jpg",
      aisle: "Pasta",
      consistency: "solid",
      meta: [],
      measures: {
        us: { amount: 2, unitShort: "packs", unitLong: "packs" },
        metric: { amount: 2, unitShort: "packs", unitLong: "packs" },
      },
    },
  ],
  nutrition: {
    nutrients: [
      { name: "Calories", amount: 550, unit: "kcal", percentOfDailyNeeds: 25 },
      { name: "Protein", amount: 15, unit: "g", percentOfDailyNeeds: 30 },
      { name: "Fat", amount: 20, unit: "g", percentOfDailyNeeds: 20 },
      { name: "Carbohydrates", amount: 75, unit: "g", percentOfDailyNeeds: 25 },
    ],
    properties: [],
    flavonoids: [],
    ingredients: [],
    caloriesBreakdown: { percentProtein: 15, percentFat: 30, percentCarbs: 55 },
    weightPerServing: { amount: 300, unit: "g" },
  },
  language: "en",
  spoonacularSourceUrl: "https://spoonacular.com/recipe/10001",
  spoonacularScore: 90,
};
