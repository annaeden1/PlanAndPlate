export type RecipeResponse = {
  id: string;
  title: string;
  image: string;
  imageType: string;
  readyInMinutes: number;
  servings: number;
  sourceUrl: string;
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
  dairyFree: boolean;
  veryHealthy: boolean;
  cheap: boolean;
  veryPopular: boolean;
  sustainable: boolean;
  lowFodmap: boolean;
  weightWatcherSmartPoints: number;
  gaps: string;
  preparationMinutes: number;
  cookingMinutes: number;
  aggregateLikes: number;
  healthScore: number;
  creditText: string;
  license: string;
  sourceName: string;
  pricePerServing: number;
  extendedIngredients: {
    id: number;
    aisle: string;
    image: string;
    consistency: string;
    name: string;
    nameClean: string;
    original: string;
    originalName: string;
    amount: number;
    unit: string;
    meta: string[];
    measures: {
      us: {
        amount: number;
        unitShort: string;
        unitLong: string;
      };
      metric: {
        amount: number;
        unitShort: string;
        unitLong: string;
      };
    };
  }[];
  nutrition: {
    nutrients: recipeNutrients[];
    properties: {
      name: string;
      amount: number;
      unit: string;
    }[];
    flavonoids: {
      name: string;
      amount: number;
      unit: string;
    }[];
    ingredients: {
      name: string;
      amount: number;
      unit: string;
      nutrients: recipeNutrients[];
    }[];
    caloriesBreakdown: {
      percentProtein: number;
      percentFat: number;
      percentCarbs: number;
    };
    weightPerServing: {
      amount: number;
      unit: string;
    };
  };
  summary: string;
  cuisines: string[];
  dishTypes: string[];
  diets: string[];
  occasions: string[];
  winePairing: {
    pairedWines: string[];
    pairingText: string;
    productMatches: {
      id: number;
      title: string;
      description: string;
      price: string;
      imageUrl: string;
      averageRating: number;
      ratingCount: number;
      score: number;
      link: string;
    }[];
  }; // Not used in our app, but included for completeness
  instructions: string;
  analyzedInstructions: {
    name: string;
    steps: {
      number: number;
      step: string;
      ingredients: recipeInstructionItem[];
      equipment: recipeInstructionItem[];
      length: {
        number: number;
        unit: string;
      };
    }[];
  }[];
  language: string;
  spoonacularSourceUrl: string;
  spoonacularScore: number;
};

export type MealPlanResponse = {
  week: {
    [day: string]: {
      meals: meal[];
      nutrients: nutrients;
    };
  };
};

type meal = {
  id: number;
  image: string;
  imageType: string;
  title: string;
  readyInMinutes: number;
  servings: number;
  sourceUrl: string;
};

export type nutrients = {
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
};

type recipeNutrients = {
  name: string;
  amount: number;
  unit: string;
  percentOfDailyNeeds: number;
};

type recipeInstructionItem = {
  id: number;
  name: string;
  localizedName: string;
  image: string;
} 