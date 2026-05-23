import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

// Real models from services — all share root's mongoose (via patchMongoose.js preload)
import { Recipe } from "../services/mealPlanner/src/models/recipeModel";
import { MealPlan } from "../services/mealPlanner/src/models/mealPlanModel";
import { GroceryList } from "../services/groceryListManager/src/models/groceryList.model";
import { normalizeAisle } from "../services/groceryListManager/src/types/categories";
import { user as UserModel } from "../services/userManagement/src/model/userModel";

dotenv.config({ path: path.join(__dirname, "../services/mealPlanner/.env") });

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/planandplate";
const USER_ID = "69cad35321eafa0edf72e669";

const recipesData = [
  {
    originRecipeId: "100001",
    name: "Avocado Toast with Poached Egg",
    calories: 350,
    protein: 15,
    fat: 22,
    carbs: 28,
    servings: 1,
    readyInMinutes: 15,
    diets: ["vegetarian", "dairy free"],
    instructions: {
      steps: [
        "Toast the bread until golden brown.",
        "Mash avocado with a pinch of salt and lemon juice.",
        "Poach the egg in simmering water for 3 minutes.",
        "Spread avocado on toast and top with the poached egg.",
      ],
      ingredients: [
        {
          id: 101,
          name: "Sourdough Bread",
          amount: 1,
          unit: "slice",
          aisle: "Bakery",
        },
        {
          id: 102,
          name: "Avocado",
          amount: 0.5,
          unit: "whole",
          aisle: "Produce",
        },
        { id: 103, name: "Egg", amount: 1, unit: "large", aisle: "Dairy" },
        {
          id: 104,
          name: "Lemon Juice",
          amount: 1,
          unit: "tsp",
          aisle: "Produce",
        },
      ],
    },
  },
  {
    originRecipeId: "100002",
    name: "Grilled Chicken Quinoa Bowl",
    calories: 550,
    protein: 45,
    fat: 12,
    carbs: 65,
    servings: 1,
    readyInMinutes: 25,
    diets: ["gluten free", "high protein"],
    instructions: {
      steps: [
        "Cook quinoa according to package instructions.",
        "Season chicken breast with salt, pepper, and paprika.",
        "Grill chicken for 6-7 minutes per side.",
        "Assemble bowl with quinoa, chicken, and fresh vegetables.",
      ],
      ingredients: [
        {
          id: 201,
          name: "Chicken Breast",
          amount: 150,
          unit: "g",
          aisle: "Meat",
        },
        {
          id: 202,
          name: "Quinoa",
          amount: 0.5,
          unit: "cup",
          aisle: "Pasta and Rice",
        },
        {
          id: 203,
          name: "Cucumber",
          amount: 0.5,
          unit: "cup",
          aisle: "Produce",
        },
        {
          id: 204,
          name: "Cherry Tomatoes",
          amount: 5,
          unit: "whole",
          aisle: "Produce",
        },
      ],
    },
  },
  {
    originRecipeId: "100003",
    name: "Salmon with Roasted Asparagus",
    calories: 450,
    protein: 38,
    fat: 25,
    carbs: 10,
    servings: 1,
    readyInMinutes: 20,
    diets: ["keto", "paleo", "gluten free"],
    instructions: {
      steps: [
        "Preheat oven to 400°F (200°C).",
        "Place salmon and asparagus on a baking sheet.",
        "Drizzle with olive oil and season with lemon and dill.",
        "Roast for 12-15 minutes.",
      ],
      ingredients: [
        {
          id: 301,
          name: "Salmon Fillet",
          amount: 180,
          unit: "g",
          aisle: "Seafood",
        },
        {
          id: 302,
          name: "Asparagus",
          amount: 100,
          unit: "g",
          aisle: "Produce",
        },
        {
          id: 303,
          name: "Olive Oil",
          amount: 1,
          unit: "tbsp",
          aisle: "Oil, Vinegar, Salad Dressing",
        },
        {
          id: 304,
          name: "Lemon",
          amount: 0.5,
          unit: "whole",
          aisle: "Produce",
        },
      ],
    },
  },
  {
    originRecipeId: "100004",
    name: "Berry Smoothie Bowl",
    calories: 300,
    protein: 8,
    fat: 5,
    carbs: 55,
    servings: 1,
    readyInMinutes: 10,
    diets: ["vegan", "vegetarian"],
    instructions: {
      steps: [
        "Blend frozen berries, banana, and almond milk.",
        "Pour into a bowl.",
        "Top with granola and fresh berries.",
      ],
      ingredients: [
        {
          id: 401,
          name: "Frozen Berries",
          amount: 1,
          unit: "cup",
          aisle: "Frozen",
        },
        { id: 402, name: "Banana", amount: 1, unit: "whole", aisle: "Produce" },
        {
          id: 403,
          name: "Almond Milk",
          amount: 0.5,
          unit: "cup",
          aisle: "Beverages",
        },
        { id: 404, name: "Granola", amount: 2, unit: "tbsp", aisle: "Cereal" },
      ],
    },
  },
  {
    originRecipeId: "100005",
    name: "Beef and Broccoli Stir-Fry",
    calories: 500,
    protein: 35,
    fat: 20,
    carbs: 45,
    servings: 1,
    readyInMinutes: 20,
    diets: ["dairy free"],
    instructions: {
      steps: [
        "Slice beef into thin strips.",
        "Stir-fry beef in a hot pan until browned.",
        "Add broccoli and soy sauce mixture.",
        "Cook until broccoli is tender-crisp.",
      ],
      ingredients: [
        {
          id: 501,
          name: "Beef Flank Steak",
          amount: 150,
          unit: "g",
          aisle: "Meat",
        },
        {
          id: 502,
          name: "Broccoli Florets",
          amount: 2,
          unit: "cups",
          aisle: "Produce",
        },
        {
          id: 503,
          name: "Soy Sauce",
          amount: 2,
          unit: "tbsp",
          aisle: "Condiments",
        },
        {
          id: 504,
          name: "Brown Rice",
          amount: 0.5,
          unit: "cup",
          aisle: "Pasta and Rice",
        },
      ],
    },
  },
  {
    originRecipeId: "100006",
    name: "Greek Yogurt Parfait",
    calories: 250,
    protein: 20,
    fat: 4,
    carbs: 32,
    servings: 1,
    readyInMinutes: 5,
    diets: ["vegetarian", "high protein"],
    instructions: {
      steps: [
        "Layer yogurt in a glass.",
        "Add a layer of honey and walnuts.",
        "Top with fresh blueberries.",
      ],
      ingredients: [
        {
          id: 601,
          name: "Greek Yogurt",
          amount: 200,
          unit: "g",
          aisle: "Dairy",
        },
        { id: 602, name: "Honey", amount: 1, unit: "tbsp", aisle: "Baking" },
        { id: 603, name: "Walnuts", amount: 15, unit: "g", aisle: "Snacks" },
        {
          id: 604,
          name: "Blueberries",
          amount: 0.25,
          unit: "cup",
          aisle: "Produce",
        },
      ],
    },
  },
  {
    originRecipeId: "100007",
    name: "Lentil Soup",
    calories: 380,
    protein: 22,
    fat: 8,
    carbs: 55,
    servings: 1,
    readyInMinutes: 40,
    diets: ["vegan", "vegetarian", "gluten free"],
    instructions: {
      steps: [
        "Sauté onions, carrots, and celery.",
        "Add lentils, broth, and spices.",
        "Simmer for 30 minutes until lentils are soft.",
      ],
      ingredients: [
        {
          id: 701,
          name: "Dried Lentils",
          amount: 0.5,
          unit: "cup",
          aisle: "Pasta and Rice",
        },
        {
          id: 702,
          name: "Vegetable Broth",
          amount: 2,
          unit: "cups",
          aisle: "Canned and Jarred",
        },
        {
          id: 703,
          name: "Carrot",
          amount: 1,
          unit: "medium",
          aisle: "Produce",
        },
        {
          id: 704,
          name: "Onion",
          amount: 0.5,
          unit: "medium",
          aisle: "Produce",
        },
      ],
    },
  },
  {
    originRecipeId: "100008",
    name: "Turkey Club Sandwich",
    calories: 480,
    protein: 30,
    fat: 18,
    carbs: 48,
    servings: 1,
    readyInMinutes: 10,
    diets: [],
    instructions: {
      steps: [
        "Toast three slices of bread.",
        "Spread mayo on each slice.",
        "Layer turkey, bacon, lettuce, and tomato.",
        "Cut into triangles and serve.",
      ],
      ingredients: [
        {
          id: 801,
          name: "Turkey Breast",
          amount: 100,
          unit: "g",
          aisle: "Meat",
        },
        { id: 802, name: "Bacon", amount: 2, unit: "strips", aisle: "Meat" },
        {
          id: 803,
          name: "Whole Wheat Bread",
          amount: 3,
          unit: "slices",
          aisle: "Bakery",
        },
        {
          id: 804,
          name: "Tomato",
          amount: 2,
          unit: "slices",
          aisle: "Produce",
        },
      ],
    },
  },
  {
    originRecipeId: "100009",
    name: "Pasta Primavera",
    calories: 520,
    protein: 18,
    fat: 15,
    carbs: 78,
    servings: 1,
    readyInMinutes: 25,
    diets: ["vegetarian"],
    instructions: {
      steps: [
        "Cook pasta in salted water.",
        "Sauté seasonal vegetables in olive oil.",
        "Toss pasta with vegetables and parmesan cheese.",
      ],
      ingredients: [
        {
          id: 901,
          name: "Spaghetti",
          amount: 100,
          unit: "g",
          aisle: "Pasta and Rice",
        },
        {
          id: 902,
          name: "Zucchini",
          amount: 0.5,
          unit: "whole",
          aisle: "Produce",
        },
        {
          id: 903,
          name: "Bell Pepper",
          amount: 0.5,
          unit: "whole",
          aisle: "Produce",
        },
        {
          id: 904,
          name: "Parmesan Cheese",
          amount: 2,
          unit: "tbsp",
          aisle: "Dairy",
        },
      ],
    },
  },
  {
    originRecipeId: "100010",
    name: "Oatmeal with Apple and Cinnamon",
    calories: 320,
    protein: 10,
    fat: 6,
    carbs: 58,
    servings: 1,
    readyInMinutes: 10,
    diets: ["vegan", "vegetarian"],
    instructions: {
      steps: [
        "Cook oats with water or milk.",
        "Stir in chopped apples and cinnamon.",
        "Top with a drizzle of maple syrup.",
      ],
      ingredients: [
        {
          id: 111,
          name: "Rolled Oats",
          amount: 0.5,
          unit: "cup",
          aisle: "Cereal",
        },
        { id: 112, name: "Apple", amount: 1, unit: "medium", aisle: "Produce" },
        {
          id: 113,
          name: "Cinnamon",
          amount: 0.5,
          unit: "tsp",
          aisle: "Spices and Seasonings",
        },
        {
          id: 114,
          name: "Maple Syrup",
          amount: 1,
          unit: "tbsp",
          aisle: "Condiments",
        },
      ],
    },
  },
  {
    originRecipeId: "100011",
    name: "Shrimp Tacos",
    calories: 420,
    protein: 28,
    fat: 16,
    carbs: 38,
    servings: 1,
    readyInMinutes: 20,
    diets: ["dairy free"],
    instructions: {
      steps: [
        "Season shrimp with taco spices.",
        "Sauté shrimp until pink.",
        "Warm tortillas and fill with shrimp and slaw.",
        "Top with lime juice and cilantro.",
      ],
      ingredients: [
        { id: 121, name: "Shrimp", amount: 120, unit: "g", aisle: "Seafood" },
        {
          id: 122,
          name: "Corn Tortillas",
          amount: 3,
          unit: "small",
          aisle: "Bakery",
        },
        {
          id: 123,
          name: "Cabbage Slaw",
          amount: 0.5,
          unit: "cup",
          aisle: "Produce",
        },
        { id: 124, name: "Lime", amount: 1, unit: "whole", aisle: "Produce" },
      ],
    },
  },
  {
    originRecipeId: "100012",
    name: "Spinach and Feta Omelet",
    calories: 280,
    protein: 18,
    fat: 20,
    carbs: 6,
    servings: 1,
    readyInMinutes: 10,
    diets: ["vegetarian", "gluten free", "keto"],
    instructions: {
      steps: [
        "Whisk eggs in a bowl.",
        "Sauté spinach until wilted.",
        "Pour eggs over spinach and cook.",
        "Sprinkle with feta and fold.",
      ],
      ingredients: [
        { id: 131, name: "Eggs", amount: 3, unit: "large", aisle: "Dairy" },
        {
          id: 132,
          name: "Fresh Spinach",
          amount: 1,
          unit: "handful",
          aisle: "Produce",
        },
        { id: 133, name: "Feta Cheese", amount: 30, unit: "g", aisle: "Dairy" },
        { id: 134, name: "Butter", amount: 1, unit: "tsp", aisle: "Dairy" },
      ],
    },
  },
  {
    originRecipeId: "100013",
    name: "Tuna Salad Wrap",
    calories: 380,
    protein: 32,
    fat: 14,
    carbs: 32,
    servings: 1,
    readyInMinutes: 10,
    diets: [],
    instructions: {
      steps: [
        "Mix canned tuna with Greek yogurt and mustard.",
        "Add diced celery and onions.",
        "Spread on a whole wheat tortilla and wrap.",
      ],
      ingredients: [
        {
          id: 141,
          name: "Canned Tuna",
          amount: 1,
          unit: "can",
          aisle: "Canned and Jarred",
        },
        {
          id: 142,
          name: "Whole Wheat Tortilla",
          amount: 1,
          unit: "large",
          aisle: "Bakery",
        },
        { id: 143, name: "Celery", amount: 1, unit: "stalk", aisle: "Produce" },
        {
          id: 144,
          name: "Mustard",
          amount: 1,
          unit: "tsp",
          aisle: "Condiments",
        },
      ],
    },
  },
  {
    originRecipeId: "100014",
    name: "Mushroom Risotto",
    calories: 460,
    protein: 12,
    fat: 18,
    carbs: 62,
    servings: 1,
    readyInMinutes: 45,
    diets: ["vegetarian"],
    instructions: {
      steps: [
        "Sauté mushrooms and shallots.",
        "Add arborio rice and stir until translucent.",
        "Slowly add warm broth, stirring constantly.",
        "Finish with butter and parmesan.",
      ],
      ingredients: [
        {
          id: 151,
          name: "Arborio Rice",
          amount: 0.5,
          unit: "cup",
          aisle: "Pasta and Rice",
        },
        {
          id: 152,
          name: "Mushrooms",
          amount: 150,
          unit: "g",
          aisle: "Produce",
        },
        {
          id: 153,
          name: "Parmesan Cheese",
          amount: 3,
          unit: "tbsp",
          aisle: "Dairy",
        },
        {
          id: 154,
          name: "Vegetable Broth",
          amount: 3,
          unit: "cups",
          aisle: "Canned and Jarred",
        },
      ],
    },
  },
  {
    originRecipeId: "100015",
    name: "Chia Seed Pudding",
    calories: 220,
    protein: 8,
    fat: 12,
    carbs: 22,
    servings: 1,
    readyInMinutes: 5,
    diets: ["vegan", "vegetarian", "gluten free"],
    instructions: {
      steps: [
        "Mix chia seeds with almond milk and vanilla.",
        "Let sit in fridge overnight or for 4 hours.",
        "Top with mango chunks.",
      ],
      ingredients: [
        {
          id: 161,
          name: "Chia Seeds",
          amount: 3,
          unit: "tbsp",
          aisle: "Health Foods",
        },
        {
          id: 162,
          name: "Almond Milk",
          amount: 1,
          unit: "cup",
          aisle: "Beverages",
        },
        { id: 163, name: "Mango", amount: 0.5, unit: "cup", aisle: "Produce" },
        {
          id: 164,
          name: "Vanilla Extract",
          amount: 0.5,
          unit: "tsp",
          aisle: "Baking",
        },
      ],
    },
  },
];

async function seedData() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected.");

    const firstUser = await UserModel.findOne({});
    if (!firstUser) {
      console.error(
        "No users found in DB. Register/login first, then re-run the seed.",
      );
      process.exit(1);
    }
    const USER_ID = firstUser._id.toString();
    console.log(`Seeding for user: ${firstUser.email} (${USER_ID})`);

    // 1. Seed Recipes
    console.log("Seeding Recipes...");
    await Recipe.deleteMany({});
    const createdRecipes = await Recipe.insertMany(recipesData);
    console.log(`Inserted ${createdRecipes.length} recipes.`);

    const recipeInfo = createdRecipes.map((r: any) => ({
      id: r._id,
      originRecipeId: r.originRecipeId,
      name: r.name,
      calories: r.calories,
      protein: r.protein,
      fat: r.fat,
      carbs: r.carbs,
      ingredients: r.instructions?.ingredients || [],
    }));

    // 2. Clear existing MealPlan and GroceryList for this user
    console.log(`Clearing existing MealPlan for user ${USER_ID}...`);
    await MealPlan.deleteMany({ userId: USER_ID });
    await GroceryList.deleteMany({
      userId: new mongoose.Types.ObjectId(USER_ID),
    });

    // 3. Generate 6 weeks of data (3 before, 3 after today)
    console.log("Generating 6 separate weekly MealPlans...");

    const today = new Date();
    const threeWeeksAgo = new Date(today);
    threeWeeksAgo.setDate(today.getDate() - 3 * 7);
    const startSunday = new Date(threeWeeksAgo);
    startSunday.setDate(threeWeeksAgo.getDate() - threeWeeksAgo.getDay());
    startSunday.setUTCHours(0, 0, 0, 0);

    const allPlannedIngredients: any[] = [];
    let firstMealPlanId = "";

    for (let w = 0; w < 6; w++) {
      const weekStart = new Date(startSunday);
      weekStart.setDate(startSunday.getDate() + w * 7);

      const days = [];
      let weekCalories = 0,
        weekProtein = 0,
        weekFat = 0,
        weekCarbs = 0;

      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(weekStart);
        currentDate.setDate(weekStart.getDate() + i);

        const breakfast =
          recipeInfo[Math.floor(Math.random() * recipeInfo.length)];
        const lunch = recipeInfo[Math.floor(Math.random() * recipeInfo.length)];
        const dinner =
          recipeInfo[Math.floor(Math.random() * recipeInfo.length)];

        days.push({
          date: currentDate,
          breakfast: {
            recipeId: breakfast.originRecipeId,
            name: breakfast.name,
            calories: breakfast.calories,
          },
          lunch: {
            recipeId: lunch.originRecipeId,
            name: lunch.name,
            calories: lunch.calories,
          },
          dinner: {
            recipeId: dinner.originRecipeId,
            name: dinner.name,
            calories: dinner.calories,
          },
        });

        [breakfast, lunch, dinner].forEach((meal) => {
          weekCalories += meal.calories || 0;
          weekProtein += meal.protein || 0;
          weekFat += meal.fat || 0;
          weekCarbs += meal.carbs || 0;
          meal.ingredients.forEach((ing: any) =>
            allPlannedIngredients.push(ing),
          );
        });
      }

      const mealPlan = new MealPlan({
        userId: USER_ID,
        days,
        nutritionSummary: {
          calories: Math.round(weekCalories / 7),
          protein: Math.round(weekProtein / 7),
          fat: Math.round(weekFat / 7),
          carbs: Math.round(weekCarbs / 7),
        },
      });

      const savedPlan = await mealPlan.save();
      if (w === 3) firstMealPlanId = savedPlan._id.toString();
      console.log(
        `Saved plan for week starting ${weekStart.toISOString().split("T")[0]}`,
      );
    }

    // 4. Generate GroceryList (aggregated across all 6 weeks)
    console.log(`Generating GroceryList for user ${USER_ID}...`);

    const ingredientMap = new Map<string, any>();
    allPlannedIngredients.forEach((ing) => {
      const key = `${ing.name.toLowerCase()}-${ing.unit.toLowerCase()}`;
      if (ingredientMap.has(key)) {
        ingredientMap.get(key).quantity += ing.amount;
      } else {
        ingredientMap.set(key, {
          name: ing.name.toLowerCase(),
          quantity: ing.amount,
          unit: (ing.unit || "unit").toLowerCase(),
          category: normalizeAisle(ing.aisle || "other"),
        });
      }
    });

    const groceryItems = Array.from(ingredientMap.values())
      .map((item) => ({
        name: item.name,
        quantity: Math.round(item.quantity * 100) / 100,
        unit: item.unit,
        category: item.category,
        checked: false,
        inventoryQuantity: 0,
      }))
      .slice(0, 50);

    const groceryList = new GroceryList({
      userId: new mongoose.Types.ObjectId(USER_ID),
      mealPlanId: firstMealPlanId,
      items: groceryItems,
    });

    await groceryList.save();
    console.log("GroceryList saved.");

    console.log("Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
}

seedData();
