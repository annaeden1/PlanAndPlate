/**
 * Mock-data catalog for live-demo seeding.
 *
 * Recipes are authored in the SAME normalized shape the app itself writes when it
 * ingests Spoonacular results (see mealPlannerService.createWeeklyPlan /
 * getRecipeDetails). Because each recipe carries full `instructions.steps`, the
 * recommendation + recipe-detail code paths treat them as "complete" and never
 * call the live Spoonacular API for seeded data. `cuisines`/`dishTypes`/`diets`/
 * ingredients give the embedding builder real signal so the liked-recipes taste
 * vector is meaningful.
 *
 * IMAGES: every recipe points at a real, dish-matched photo on TheMealDB's CDN
 * (stable `.../images/media/meals/<hash>.jpg`). These were verified to return
 * `image/jpeg` so nothing 404s — and, unlike keyword image search, the picture
 * always matches the dish (no random cat photos during a live demo).
 *
 * `meta` is planner-only guidance (which slot a recipe fits, diet/allergen flags);
 * it is NOT persisted — only `doc` is inserted.
 */

export type Slot = "breakfast" | "lunch" | "dinner";

export interface SeedIngredient {
  id: number;
  name: string;
  amount: number;
  unit: string;
  aisle: string;
}

export interface SeedRecipeDoc {
  originRecipeId: string;
  source: "spoonacular" | "manual";
  name: string;
  image: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  servings: number;
  readyInMinutes: number;
  diets: string[];
  cuisines: string[];
  dishTypes: string[];
  instructions: { steps: string[]; ingredients: SeedIngredient[] };
}

export interface SeedRecipeMeta {
  slots: Slot[];
  pescatarian: boolean; // no meat/poultry (fish allowed)
  vegetarian: boolean;
  nutFree: boolean;
  /** For manual recipes: which demo profile owns it. */
  owner?: "man" | "woman";
}

export interface SeedRecipe {
  doc: SeedRecipeDoc;
  meta: SeedRecipeMeta;
}

/** TheMealDB CDN base for meal photos (stable, dish-matched, real jpegs). */
const IMG = "https://www.themealdb.com/images/media/meals/";

const ing = (
  id: number,
  name: string,
  amount: number,
  unit: string,
  aisle: string,
): SeedIngredient => ({ id, name, amount, unit, aisle });

export const SEED_RECIPES: SeedRecipe[] = [
  // ======================= BREAKFASTS =======================
  {
    meta: { slots: ["breakfast"], pescatarian: true, vegetarian: true, nutFree: true },
    doc: {
      originRecipeId: "900001",
      source: "spoonacular",
      name: "Shakshuka",
      image: IMG + "g373701551450225.jpg",
      calories: 360, protein: 20, fat: 22, carbs: 22, servings: 1, readyInMinutes: 25,
      diets: ["vegetarian", "gluten free", "high protein"],
      cuisines: ["Mediterranean", "Middle Eastern"],
      dishTypes: ["breakfast", "brunch", "morning meal"],
      instructions: {
        steps: [
          "Simmer tomatoes, peppers, onion and spices into a sauce.",
          "Make wells and crack in the eggs.",
          "Cover and cook until whites set; scatter parsley.",
        ],
        ingredients: [
          ing(1001, "eggs", 2, "large", "Milk, Eggs, Other Dairy"),
          ing(1002, "canned tomatoes", 200, "g", "Canned and Jarred"),
          ing(1003, "bell pepper", 1, "whole", "Produce"),
          ing(1004, "onion", 0.5, "whole", "Produce"),
        ],
      },
    },
  },
  {
    meta: { slots: ["breakfast"], pescatarian: true, vegetarian: true, nutFree: true },
    doc: {
      originRecipeId: "900002",
      source: "spoonacular",
      name: "Bread Omelette",
      image: IMG + "hqaejl1695738653.jpg",
      calories: 380, protein: 24, fat: 26, carbs: 12, servings: 1, readyInMinutes: 10,
      diets: ["vegetarian", "high protein"],
      cuisines: ["Indian"],
      dishTypes: ["breakfast", "morning meal"],
      instructions: {
        steps: [
          "Whisk eggs with chopped onion, chilli and salt.",
          "Pour into a buttered pan and lay bread on top.",
          "Flip, cook until set and golden.",
        ],
        ingredients: [
          ing(1011, "eggs", 3, "large", "Milk, Eggs, Other Dairy"),
          ing(1012, "bread", 2, "slice", "Bakery/Bread"),
          ing(1013, "onion", 0.25, "whole", "Produce"),
          ing(1014, "butter", 1, "tsp", "Milk, Eggs, Other Dairy"),
        ],
      },
    },
  },
  {
    meta: { slots: ["breakfast"], pescatarian: true, vegetarian: false, nutFree: true },
    doc: {
      originRecipeId: "900003",
      source: "spoonacular",
      name: "Salmon Eggs Benedict",
      image: IMG + "1550440197.jpg",
      calories: 450, protein: 28, fat: 28, carbs: 26, servings: 1, readyInMinutes: 20,
      diets: ["pescatarian", "high protein"],
      cuisines: ["American", "British"],
      dishTypes: ["breakfast", "brunch", "morning meal"],
      instructions: {
        steps: [
          "Toast and butter the muffin halves.",
          "Poach the eggs to a soft centre.",
          "Layer smoked salmon, egg and hollandaise.",
        ],
        ingredients: [
          ing(1021, "English muffin", 1, "whole", "Bakery/Bread"),
          ing(1022, "eggs", 2, "large", "Milk, Eggs, Other Dairy"),
          ing(1023, "smoked salmon", 80, "g", "Seafood"),
          ing(1024, "hollandaise sauce", 2, "tbsp", "Condiments"),
        ],
      },
    },
  },
  {
    meta: { slots: ["breakfast"], pescatarian: true, vegetarian: true, nutFree: true },
    doc: {
      originRecipeId: "900004",
      source: "spoonacular",
      name: "Oatmeal Pancakes",
      image: IMG + "c400ok1764439058.jpg",
      calories: 480, protein: 22, fat: 12, carbs: 72, servings: 1, readyInMinutes: 15,
      diets: ["vegetarian", "high protein"],
      cuisines: ["American"],
      dishTypes: ["breakfast", "morning meal"],
      instructions: {
        steps: [
          "Blend oats, milk, egg and baking powder into a batter.",
          "Cook pancakes on a non-stick pan until bubbling.",
          "Stack and top with banana and a drizzle of honey.",
        ],
        ingredients: [
          ing(1031, "rolled oats", 60, "g", "Cereal"),
          ing(1032, "milk", 200, "ml", "Milk, Eggs, Other Dairy"),
          ing(1033, "egg", 1, "large", "Milk, Eggs, Other Dairy"),
          ing(1034, "banana", 1, "whole", "Produce"),
        ],
      },
    },
  },
  {
    meta: { slots: ["breakfast", "lunch"], pescatarian: true, vegetarian: false, nutFree: true },
    doc: {
      originRecipeId: "900005",
      source: "spoonacular",
      name: "Smoked Haddock Kedgeree",
      image: IMG + "1550441275.jpg",
      calories: 520, protein: 34, fat: 18, carbs: 55, servings: 1, readyInMinutes: 25,
      diets: ["pescatarian", "high protein"],
      cuisines: ["British", "Indian"],
      dishTypes: ["breakfast", "lunch", "main course"],
      instructions: {
        steps: [
          "Poach the haddock, then flake it.",
          "Fry curry spices with rice and stock until fluffy.",
          "Fold in haddock, egg and parsley.",
        ],
        ingredients: [
          ing(1041, "smoked haddock", 160, "g", "Seafood"),
          ing(1042, "basmati rice", 80, "g", "Pasta and Rice"),
          ing(1043, "egg", 1, "large", "Milk, Eggs, Other Dairy"),
          ing(1044, "curry powder", 1, "tsp", "Spices and Seasonings"),
        ],
      },
    },
  },
  {
    meta: { slots: ["breakfast", "lunch"], pescatarian: false, vegetarian: false, nutFree: true },
    doc: {
      originRecipeId: "900044",
      source: "spoonacular",
      name: "Chicken Congee",
      image: IMG + "1529446352.jpg",
      calories: 380, protein: 24, fat: 8, carbs: 52, servings: 1, readyInMinutes: 45,
      diets: ["dairy free", "gluten free", "high protein"],
      cuisines: ["Chinese", "Asian"],
      dishTypes: ["breakfast", "lunch", "main course"],
      instructions: {
        steps: [
          "Simmer rice in plenty of stock until it breaks down.",
          "Poach shredded chicken in the porridge.",
          "Top with ginger, scallion and soy.",
        ],
        ingredients: [
          ing(1441, "chicken breast", 120, "g", "Meat"),
          ing(1442, "white rice", 70, "g", "Pasta and Rice"),
          ing(1443, "ginger", 1, "thumb", "Produce"),
          ing(1444, "scallion", 2, "whole", "Produce"),
        ],
      },
    },
  },
  {
    meta: { slots: ["breakfast", "lunch"], pescatarian: true, vegetarian: true, nutFree: true },
    doc: {
      originRecipeId: "900045",
      source: "spoonacular",
      name: "Spanish Tortilla",
      image: IMG + "quuxsx1511476154.jpg",
      calories: 420, protein: 20, fat: 26, carbs: 30, servings: 1, readyInMinutes: 30,
      diets: ["vegetarian", "gluten free"],
      cuisines: ["Spanish", "Mediterranean"],
      dishTypes: ["breakfast", "lunch", "main course"],
      instructions: {
        steps: [
          "Soften sliced potato and onion in olive oil.",
          "Stir into beaten eggs, then set in the pan.",
          "Flip and cook until just firm; slice into wedges.",
        ],
        ingredients: [
          ing(1451, "eggs", 3, "large", "Milk, Eggs, Other Dairy"),
          ing(1452, "potato", 200, "g", "Produce"),
          ing(1453, "onion", 0.5, "whole", "Produce"),
          ing(1454, "olive oil", 2, "tbsp", "Oil, Vinegar, Salad Dressing"),
        ],
      },
    },
  },
  {
    meta: { slots: ["breakfast"], pescatarian: true, vegetarian: true, nutFree: true },
    doc: {
      originRecipeId: "900046",
      source: "spoonacular",
      name: "Cheesy Grits",
      image: IMG + "bfok4w1780242078.jpg",
      calories: 360, protein: 10, fat: 14, carbs: 48, servings: 1, readyInMinutes: 20,
      diets: ["vegetarian", "gluten free"],
      cuisines: ["American", "Southern"],
      dishTypes: ["breakfast", "morning meal"],
      instructions: {
        steps: [
          "Simmer grits in milk and water, stirring, until creamy.",
          "Beat in butter and cheddar.",
          "Season and serve hot.",
        ],
        ingredients: [
          ing(1461, "grits", 60, "g", "Cereal"),
          ing(1462, "milk", 200, "ml", "Milk, Eggs, Other Dairy"),
          ing(1463, "cheddar cheese", 30, "g", "Cheese"),
          ing(1464, "butter", 1, "tbsp", "Milk, Eggs, Other Dairy"),
        ],
      },
    },
  },
  {
    meta: { slots: ["breakfast"], pescatarian: false, vegetarian: false, nutFree: true },
    doc: {
      originRecipeId: "900022",
      source: "spoonacular",
      name: "Full English Breakfast",
      image: IMG + "utxryw1511721587.jpg",
      calories: 780, protein: 40, fat: 50, carbs: 38, servings: 1, readyInMinutes: 25,
      diets: ["high protein"],
      cuisines: ["British"],
      dishTypes: ["breakfast", "morning meal"],
      instructions: {
        steps: [
          "Fry the sausages and bacon until browned.",
          "Cook the eggs, beans and tomato.",
          "Plate everything with toast.",
        ],
        ingredients: [
          ing(1221, "pork sausage", 2, "whole", "Meat"),
          ing(1222, "bacon", 2, "slice", "Meat"),
          ing(1223, "eggs", 2, "large", "Milk, Eggs, Other Dairy"),
          ing(1224, "baked beans", 120, "g", "Canned and Jarred"),
        ],
      },
    },
  },

  // ======================= MEATY MAINS (man's lane) =======================
  {
    meta: { slots: ["lunch", "dinner"], pescatarian: false, vegetarian: false, nutFree: true },
    doc: {
      originRecipeId: "900006",
      source: "spoonacular",
      name: "Chicken Quinoa Greek Salad",
      image: IMG + "k29viq1585565980.jpg",
      calories: 560, protein: 48, fat: 22, carbs: 40, servings: 1, readyInMinutes: 25,
      diets: ["gluten free", "high protein"],
      cuisines: ["American", "Mediterranean"],
      dishTypes: ["lunch", "main course", "dinner", "salad"],
      instructions: {
        steps: [
          "Grill and slice the chicken.",
          "Toss quinoa with cucumber, tomato, olives and feta.",
          "Add chicken and a lemon-oregano dressing.",
        ],
        ingredients: [
          ing(1061, "chicken breast", 180, "g", "Meat"),
          ing(1062, "quinoa", 80, "g", "Pasta and Rice"),
          ing(1063, "feta cheese", 30, "g", "Cheese"),
          ing(1064, "cucumber", 0.5, "whole", "Produce"),
        ],
      },
    },
  },
  {
    meta: { slots: ["lunch", "dinner"], pescatarian: false, vegetarian: false, nutFree: true },
    doc: {
      originRecipeId: "900007",
      source: "spoonacular",
      name: "Beef and Broccoli Stir-Fry",
      image: IMG + "m0p0j81765568742.jpg",
      calories: 640, protein: 45, fat: 24, carbs: 58, servings: 1, readyInMinutes: 20,
      diets: ["dairy free", "high protein"],
      cuisines: ["Chinese", "Asian"],
      dishTypes: ["lunch", "main course", "dinner"],
      instructions: {
        steps: [
          "Sear thin strips of beef until browned.",
          "Add broccoli and a soy-ginger sauce.",
          "Toss until glossy; serve over rice.",
        ],
        ingredients: [
          ing(1071, "beef flank steak", 170, "g", "Meat"),
          ing(1072, "broccoli", 200, "g", "Produce"),
          ing(1073, "soy sauce", 2, "tbsp", "Condiments"),
          ing(1074, "brown rice", 80, "g", "Pasta and Rice"),
        ],
      },
    },
  },
  {
    meta: { slots: ["lunch", "dinner"], pescatarian: false, vegetarian: false, nutFree: true },
    doc: {
      originRecipeId: "900031",
      source: "spoonacular",
      name: "Sweet and Sour Chicken",
      image: IMG + "arzs741766434335.jpg",
      calories: 620, protein: 40, fat: 18, carbs: 78, servings: 1, readyInMinutes: 25,
      diets: ["dairy free", "high protein"],
      cuisines: ["Chinese", "Asian"],
      dishTypes: ["lunch", "main course", "dinner"],
      instructions: {
        steps: [
          "Crisp the battered chicken pieces.",
          "Simmer pineapple, pepper and onion in a sweet-sour sauce.",
          "Toss chicken through; serve with rice.",
        ],
        ingredients: [
          ing(1311, "chicken breast", 180, "g", "Meat"),
          ing(1312, "pineapple", 80, "g", "Produce"),
          ing(1313, "bell pepper", 1, "whole", "Produce"),
          ing(1314, "white rice", 90, "g", "Pasta and Rice"),
        ],
      },
    },
  },
  {
    meta: { slots: ["lunch", "dinner"], pescatarian: false, vegetarian: false, nutFree: true },
    doc: {
      originRecipeId: "900020",
      source: "spoonacular",
      name: "Chicken Alfredo Pasta",
      image: IMG + "syqypv1486981727.jpg",
      calories: 950, protein: 52, fat: 40, carbs: 92, servings: 1, readyInMinutes: 25,
      diets: ["high protein"],
      cuisines: ["Italian"],
      dishTypes: ["lunch", "main course", "dinner"],
      instructions: {
        steps: [
          "Cook fettuccine al dente.",
          "Sear chicken, then build a parmesan cream sauce.",
          "Toss pasta through the sauce with the sliced chicken.",
        ],
        ingredients: [
          ing(1201, "chicken breast", 200, "g", "Meat"),
          ing(1202, "fettuccine", 120, "g", "Pasta and Rice"),
          ing(1203, "heavy cream", 80, "ml", "Milk, Eggs, Other Dairy"),
          ing(1204, "parmesan cheese", 30, "g", "Cheese"),
        ],
      },
    },
  },
  {
    meta: { slots: ["lunch", "dinner"], pescatarian: false, vegetarian: false, nutFree: true },
    doc: {
      originRecipeId: "900032",
      source: "spoonacular",
      name: "Beef Lasagne",
      image: IMG + "wtsvxx1511296896.jpg",
      calories: 780, protein: 42, fat: 36, carbs: 74, servings: 1, readyInMinutes: 60,
      diets: ["high protein"],
      cuisines: ["Italian"],
      dishTypes: ["lunch", "main course", "dinner"],
      instructions: {
        steps: [
          "Simmer a beef ragù with tomato and herbs.",
          "Layer pasta sheets with ragù and béchamel.",
          "Top with cheese and bake until bubbling.",
        ],
        ingredients: [
          ing(1321, "ground beef", 180, "g", "Meat"),
          ing(1322, "lasagne sheets", 100, "g", "Pasta and Rice"),
          ing(1323, "tomato sauce", 150, "g", "Canned and Jarred"),
          ing(1324, "mozzarella cheese", 50, "g", "Cheese"),
        ],
      },
    },
  },
  {
    meta: { slots: ["lunch", "dinner"], pescatarian: false, vegetarian: false, nutFree: true },
    doc: {
      originRecipeId: "900011",
      source: "spoonacular",
      name: "Turkey Meatloaf",
      image: IMG + "ypuxtw1511297463.jpg",
      calories: 600, protein: 46, fat: 22, carbs: 40, servings: 1, readyInMinutes: 50,
      diets: ["dairy free", "high protein"],
      cuisines: ["American"],
      dishTypes: ["lunch", "main course", "dinner"],
      instructions: {
        steps: [
          "Mix ground turkey with onion, breadcrumbs and egg.",
          "Shape into a loaf and glaze with tomato.",
          "Bake until cooked through; rest and slice.",
        ],
        ingredients: [
          ing(1111, "ground turkey", 200, "g", "Meat"),
          ing(1112, "breadcrumbs", 30, "g", "Bakery/Bread"),
          ing(1113, "egg", 1, "large", "Milk, Eggs, Other Dairy"),
          ing(1114, "tomato ketchup", 2, "tbsp", "Condiments"),
        ],
      },
    },
  },
  {
    meta: { slots: ["lunch", "dinner"], pescatarian: false, vegetarian: false, nutFree: true },
    doc: {
      originRecipeId: "900015",
      source: "spoonacular",
      name: "Steak Diane",
      image: IMG + "vussxq1511882648.jpg",
      calories: 720, protein: 50, fat: 40, carbs: 30, servings: 1, readyInMinutes: 25,
      diets: ["gluten free", "high protein"],
      cuisines: ["American"],
      dishTypes: ["main course", "dinner"],
      instructions: {
        steps: [
          "Sear the steak to preferred doneness; rest.",
          "Build a mustard-cream pan sauce with the juices.",
          "Spoon sauce over and serve with potatoes.",
        ],
        ingredients: [
          ing(1151, "sirloin steak", 200, "g", "Meat"),
          ing(1152, "cream", 60, "ml", "Milk, Eggs, Other Dairy"),
          ing(1153, "dijon mustard", 1, "tbsp", "Condiments"),
          ing(1154, "baby potatoes", 150, "g", "Produce"),
        ],
      },
    },
  },
  {
    meta: { slots: ["lunch", "dinner"], pescatarian: false, vegetarian: false, nutFree: true },
    doc: {
      originRecipeId: "900017",
      source: "spoonacular",
      name: "Brown Stew Chicken",
      image: IMG + "sypxpx1515365095.jpg",
      calories: 620, protein: 44, fat: 26, carbs: 48, servings: 1, readyInMinutes: 40,
      diets: ["dairy free", "gluten free", "high protein"],
      cuisines: ["Caribbean", "Jamaican"],
      dishTypes: ["lunch", "main course", "dinner"],
      instructions: {
        steps: [
          "Brown seasoned chicken in a hot pot.",
          "Simmer with onion, thyme and browning sauce.",
          "Serve over rice and peas.",
        ],
        ingredients: [
          ing(1171, "chicken thighs", 200, "g", "Meat"),
          ing(1172, "white rice", 90, "g", "Pasta and Rice"),
          ing(1173, "onion", 0.5, "whole", "Produce"),
          ing(1174, "thyme", 1, "tsp", "Spices and Seasonings"),
        ],
      },
    },
  },
  {
    meta: { slots: ["lunch", "dinner"], pescatarian: false, vegetarian: false, nutFree: true },
    doc: {
      originRecipeId: "900019",
      source: "spoonacular",
      name: "Beef Brisket Pot Roast",
      image: IMG + "ursuup1487348423.jpg",
      calories: 900, protein: 60, fat: 48, carbs: 55, servings: 1, readyInMinutes: 180,
      diets: ["dairy free", "gluten free", "high protein"],
      cuisines: ["American"],
      dishTypes: ["lunch", "main course", "dinner"],
      instructions: {
        steps: [
          "Sear the brisket, then slow-roast with stock and aromatics.",
          "Roast potatoes and carrots alongside.",
          "Rest, slice against the grain, and spoon over the pan gravy.",
        ],
        ingredients: [
          ing(1191, "beef brisket", 220, "g", "Meat"),
          ing(1192, "potato", 200, "g", "Produce"),
          ing(1193, "carrot", 100, "g", "Produce"),
          ing(1194, "beef stock", 200, "ml", "Canned and Jarred"),
        ],
      },
    },
  },
  {
    meta: { slots: ["lunch", "dinner"], pescatarian: false, vegetarian: false, nutFree: true },
    doc: {
      originRecipeId: "900021",
      source: "spoonacular",
      name: "Beef Empanadas",
      image: IMG + "dxpc7j1764370714.jpg",
      calories: 880, protein: 40, fat: 44, carbs: 78, servings: 1, readyInMinutes: 50,
      diets: ["high protein"],
      cuisines: ["Mexican", "Argentine"],
      dishTypes: ["lunch", "main course", "dinner"],
      instructions: {
        steps: [
          "Cook a spiced beef and onion filling.",
          "Spoon into pastry rounds and crimp.",
          "Bake until golden.",
        ],
        ingredients: [
          ing(1211, "ground beef", 180, "g", "Meat"),
          ing(1212, "empanada pastry", 4, "round", "Bakery/Bread"),
          ing(1213, "onion", 0.5, "whole", "Produce"),
          ing(1214, "paprika", 1, "tsp", "Spices and Seasonings"),
        ],
      },
    },
  },
  {
    meta: { slots: ["lunch", "dinner"], pescatarian: false, vegetarian: false, nutFree: true },
    doc: {
      originRecipeId: "900023",
      source: "spoonacular",
      name: "Beef Bourguignon",
      image: IMG + "vtqxtu1511784197.jpg",
      calories: 720, protein: 48, fat: 34, carbs: 40, servings: 1, readyInMinutes: 150,
      diets: ["dairy free", "high protein"],
      cuisines: ["French"],
      dishTypes: ["lunch", "main course", "dinner"],
      instructions: {
        steps: [
          "Brown beef chunks and bacon.",
          "Braise in red wine with mushrooms and onions.",
          "Simmer low until fork-tender.",
        ],
        ingredients: [
          ing(1231, "beef chuck", 200, "g", "Meat"),
          ing(1232, "mushrooms", 100, "g", "Produce"),
          ing(1233, "red wine", 150, "ml", "Alcoholic Beverages"),
          ing(1234, "carrot", 80, "g", "Produce"),
        ],
      },
    },
  },
  {
    meta: { slots: ["lunch", "dinner"], pescatarian: false, vegetarian: false, nutFree: true },
    doc: {
      originRecipeId: "900024",
      source: "spoonacular",
      name: "Lamb Tagine",
      image: IMG + "yuwtuu1511295751.jpg",
      calories: 650, protein: 42, fat: 30, carbs: 48, servings: 1, readyInMinutes: 120,
      diets: ["dairy free", "gluten free", "high protein"],
      cuisines: ["Moroccan", "Mediterranean"],
      dishTypes: ["lunch", "main course", "dinner"],
      instructions: {
        steps: [
          "Brown the lamb with warm spices.",
          "Braise with apricots, tomato and stock.",
          "Serve over couscous.",
        ],
        ingredients: [
          ing(1241, "lamb shoulder", 200, "g", "Meat"),
          ing(1242, "dried apricots", 40, "g", "Produce"),
          ing(1243, "couscous", 80, "g", "Pasta and Rice"),
          ing(1244, "ras el hanout", 1, "tbsp", "Spices and Seasonings"),
        ],
      },
    },
  },
  {
    meta: { slots: ["lunch", "dinner"], pescatarian: false, vegetarian: false, nutFree: true },
    doc: {
      originRecipeId: "900027",
      source: "spoonacular",
      name: "Spaghetti alla Carbonara",
      image: IMG + "llcbn01574260722.jpg",
      calories: 720, protein: 32, fat: 34, carbs: 74, servings: 1, readyInMinutes: 20,
      diets: ["high protein"],
      cuisines: ["Italian"],
      dishTypes: ["lunch", "main course", "dinner"],
      instructions: {
        steps: [
          "Cook spaghetti al dente.",
          "Crisp the guanciale, then toss with egg and pecorino off the heat.",
          "Loosen with pasta water to a glossy sauce.",
        ],
        ingredients: [
          ing(1271, "spaghetti", 100, "g", "Pasta and Rice"),
          ing(1272, "guanciale", 60, "g", "Meat"),
          ing(1273, "egg yolk", 2, "whole", "Milk, Eggs, Other Dairy"),
          ing(1274, "pecorino cheese", 30, "g", "Cheese"),
        ],
      },
    },
  },
  {
    meta: { slots: ["lunch", "dinner"], pescatarian: false, vegetarian: false, nutFree: false },
    doc: {
      originRecipeId: "900029",
      source: "spoonacular",
      name: "Kung Pao Chicken",
      image: IMG + "1525872624.jpg",
      calories: 640, protein: 44, fat: 28, carbs: 52, servings: 1, readyInMinutes: 25,
      diets: ["dairy free", "high protein"],
      cuisines: ["Chinese", "Asian"],
      dishTypes: ["lunch", "main course", "dinner"],
      instructions: {
        steps: [
          "Stir-fry diced chicken until golden.",
          "Add peppers, chilli and peanuts.",
          "Toss in a soy-vinegar sauce; serve with rice.",
        ],
        ingredients: [
          ing(1291, "chicken breast", 180, "g", "Meat"),
          ing(1292, "peanuts", 30, "g", "Nuts"),
          ing(1293, "bell pepper", 1, "whole", "Produce"),
          ing(1294, "white rice", 90, "g", "Pasta and Rice"),
        ],
      },
    },
  },
  {
    meta: { slots: ["lunch", "dinner"], pescatarian: false, vegetarian: false, nutFree: true },
    doc: {
      originRecipeId: "900030",
      source: "spoonacular",
      name: "Moussaka",
      image: IMG + "ctg8jd1585563097.jpg",
      calories: 700, protein: 38, fat: 40, carbs: 48, servings: 1, readyInMinutes: 75,
      diets: ["gluten free", "high protein"],
      cuisines: ["Greek", "Mediterranean"],
      dishTypes: ["lunch", "main course", "dinner"],
      instructions: {
        steps: [
          "Layer fried aubergine with spiced lamb ragù.",
          "Top with béchamel and cheese.",
          "Bake until golden and set.",
        ],
        ingredients: [
          ing(1301, "ground lamb", 180, "g", "Meat"),
          ing(1302, "aubergine", 1, "whole", "Produce"),
          ing(1303, "bechamel sauce", 120, "g", "Milk, Eggs, Other Dairy"),
          ing(1304, "tomato", 100, "g", "Produce"),
        ],
      },
    },
  },
  {
    meta: { slots: ["lunch", "dinner"], pescatarian: false, vegetarian: false, nutFree: true },
    doc: {
      originRecipeId: "900033",
      source: "spoonacular",
      name: "Thai Green Curry",
      image: IMG + "sstssx1487349585.jpg",
      calories: 560, protein: 38, fat: 26, carbs: 40, servings: 1, readyInMinutes: 30,
      diets: ["dairy free", "gluten free", "high protein"],
      cuisines: ["Thai", "Asian"],
      dishTypes: ["lunch", "main course", "dinner"],
      instructions: {
        steps: [
          "Fry green curry paste, then add coconut milk.",
          "Simmer chicken and vegetables until cooked.",
          "Serve with jasmine rice.",
        ],
        ingredients: [
          ing(1331, "chicken thighs", 180, "g", "Meat"),
          ing(1332, "coconut milk", 120, "ml", "Canned and Jarred"),
          ing(1333, "green curry paste", 2, "tbsp", "Condiments"),
          ing(1334, "jasmine rice", 80, "g", "Pasta and Rice"),
        ],
      },
    },
  },
  {
    meta: { slots: ["lunch", "dinner"], pescatarian: false, vegetarian: false, nutFree: true },
    doc: {
      originRecipeId: "900034",
      source: "spoonacular",
      name: "Katsu Chicken Curry",
      image: IMG + "vwrpps1503068729.jpg",
      calories: 780, protein: 40, fat: 30, carbs: 88, servings: 1, readyInMinutes: 35,
      diets: ["dairy free", "high protein"],
      cuisines: ["Japanese", "Asian"],
      dishTypes: ["lunch", "main course", "dinner"],
      instructions: {
        steps: [
          "Bread and fry the chicken cutlet.",
          "Simmer a mild Japanese curry sauce.",
          "Slice katsu over rice and pour on the sauce.",
        ],
        ingredients: [
          ing(1341, "chicken breast", 180, "g", "Meat"),
          ing(1342, "panko breadcrumbs", 40, "g", "Bakery/Bread"),
          ing(1343, "japanese curry roux", 40, "g", "Condiments"),
          ing(1344, "white rice", 100, "g", "Pasta and Rice"),
        ],
      },
    },
  },
  {
    meta: { slots: ["lunch", "dinner"], pescatarian: false, vegetarian: false, nutFree: true },
    doc: {
      originRecipeId: "900038",
      source: "spoonacular",
      name: "Beef Wellington",
      image: IMG + "vvpprx1487325699.jpg",
      calories: 920, protein: 52, fat: 54, carbs: 58, servings: 1, readyInMinutes: 90,
      diets: ["high protein"],
      cuisines: ["British"],
      dishTypes: ["main course", "dinner"],
      instructions: {
        steps: [
          "Sear the fillet and coat with mushroom duxelles.",
          "Wrap in prosciutto and puff pastry.",
          "Bake until the pastry is golden and the beef medium-rare.",
        ],
        ingredients: [
          ing(1381, "beef fillet", 200, "g", "Meat"),
          ing(1382, "puff pastry", 100, "g", "Bakery/Bread"),
          ing(1383, "mushrooms", 100, "g", "Produce"),
          ing(1384, "prosciutto", 40, "g", "Meat"),
        ],
      },
    },
  },
  {
    meta: { slots: ["lunch", "dinner"], pescatarian: false, vegetarian: false, nutFree: true },
    doc: {
      originRecipeId: "900039",
      source: "spoonacular",
      name: "Chicken Handi",
      image: IMG + "wyxwsp1486979827.jpg",
      calories: 620, protein: 46, fat: 28, carbs: 42, servings: 1, readyInMinutes: 45,
      diets: ["gluten free", "high protein"],
      cuisines: ["Indian", "Asian"],
      dishTypes: ["lunch", "main course", "dinner"],
      instructions: {
        steps: [
          "Brown chicken with onion, ginger and garlic.",
          "Simmer in a spiced tomato-yogurt gravy.",
          "Finish with cream and coriander; serve with rice.",
        ],
        ingredients: [
          ing(1391, "chicken thighs", 200, "g", "Meat"),
          ing(1392, "yogurt", 60, "g", "Milk, Eggs, Other Dairy"),
          ing(1393, "tomato", 120, "g", "Produce"),
          ing(1394, "garam masala", 1, "tbsp", "Spices and Seasonings"),
        ],
      },
    },
  },

  // ======================= FISH / PESCATARIAN MAINS (woman's lane) =======================
  {
    meta: { slots: ["lunch", "dinner"], pescatarian: true, vegetarian: false, nutFree: true },
    doc: {
      originRecipeId: "900008",
      source: "spoonacular",
      name: "Honey Teriyaki Salmon",
      image: IMG + "xxyupu1468262513.jpg",
      calories: 580, protein: 40, fat: 20, carbs: 55, servings: 1, readyInMinutes: 22,
      diets: ["pescatarian", "dairy free", "high protein"],
      cuisines: ["Japanese", "Asian"],
      dishTypes: ["lunch", "main course", "dinner"],
      instructions: {
        steps: [
          "Glaze salmon with honey-teriyaki and roast until flaky.",
          "Steam rice and greens.",
          "Plate salmon over rice with sesame and scallion.",
        ],
        ingredients: [
          ing(1081, "salmon fillet", 180, "g", "Seafood"),
          ing(1082, "teriyaki sauce", 2, "tbsp", "Condiments"),
          ing(1083, "white rice", 80, "g", "Pasta and Rice"),
          ing(1084, "honey", 1, "tbsp", "Baking"),
        ],
      },
    },
  },
  {
    meta: { slots: ["lunch", "dinner"], pescatarian: true, vegetarian: false, nutFree: true },
    doc: {
      originRecipeId: "900009",
      source: "spoonacular",
      name: "Chilli Prawn Linguine",
      image: IMG + "usywpp1511189717.jpg",
      calories: 560, protein: 34, fat: 16, carbs: 68, servings: 1, readyInMinutes: 20,
      diets: ["pescatarian", "high protein"],
      cuisines: ["Italian", "Mediterranean"],
      dishTypes: ["lunch", "main course", "dinner"],
      instructions: {
        steps: [
          "Cook linguine al dente.",
          "Sauté prawns with garlic, chilli and olive oil.",
          "Toss pasta through with lemon and parsley.",
        ],
        ingredients: [
          ing(1091, "prawns", 150, "g", "Seafood"),
          ing(1092, "linguine", 90, "g", "Pasta and Rice"),
          ing(1093, "garlic", 3, "clove", "Produce"),
          ing(1094, "chilli flakes", 1, "tsp", "Spices and Seasonings"),
        ],
      },
    },
  },
  {
    meta: { slots: ["lunch", "dinner"], pescatarian: true, vegetarian: false, nutFree: true },
    doc: {
      originRecipeId: "900010",
      source: "spoonacular",
      name: "Baked Salmon with Fennel & Tomatoes",
      image: IMG + "1548772327.jpg",
      calories: 470, protein: 40, fat: 22, carbs: 20, servings: 1, readyInMinutes: 30,
      diets: ["pescatarian", "gluten free", "dairy free", "high protein"],
      cuisines: ["Mediterranean"],
      dishTypes: ["lunch", "main course", "dinner"],
      instructions: {
        steps: [
          "Toss fennel and tomatoes in olive oil and roast.",
          "Add the salmon and bake until just opaque.",
          "Finish with lemon and dill.",
        ],
        ingredients: [
          ing(1101, "salmon fillet", 200, "g", "Seafood"),
          ing(1102, "fennel", 1, "bulb", "Produce"),
          ing(1103, "cherry tomatoes", 120, "g", "Produce"),
          ing(1104, "olive oil", 1, "tbsp", "Oil, Vinegar, Salad Dressing"),
        ],
      },
    },
  },
  {
    meta: { slots: ["lunch", "dinner"], pescatarian: true, vegetarian: false, nutFree: true },
    doc: {
      originRecipeId: "900014",
      source: "spoonacular",
      name: "Tuna Niçoise Salad",
      image: IMG + "yypwwq1511304979.jpg",
      calories: 430, protein: 38, fat: 18, carbs: 28, servings: 1, readyInMinutes: 18,
      diets: ["pescatarian", "gluten free", "dairy free", "high protein"],
      cuisines: ["Mediterranean", "French"],
      dishTypes: ["lunch", "main course", "salad"],
      instructions: {
        steps: [
          "Boil baby potatoes and green beans.",
          "Arrange greens, tuna, egg, olives and tomato.",
          "Dress with olive oil and dijon.",
        ],
        ingredients: [
          ing(1141, "tuna", 120, "g", "Seafood"),
          ing(1142, "baby potatoes", 120, "g", "Produce"),
          ing(1143, "green beans", 80, "g", "Produce"),
          ing(1144, "egg", 1, "large", "Milk, Eggs, Other Dairy"),
        ],
      },
    },
  },
  {
    meta: { slots: ["lunch", "dinner"], pescatarian: true, vegetarian: false, nutFree: true },
    doc: {
      originRecipeId: "900018",
      source: "spoonacular",
      name: "Salmon & Avocado Sushi",
      image: IMG + "g046bb1663960946.jpg",
      calories: 520, protein: 28, fat: 12, carbs: 80, servings: 1, readyInMinutes: 40,
      diets: ["pescatarian", "dairy free", "high protein"],
      cuisines: ["Japanese", "Asian"],
      dishTypes: ["lunch", "main course", "dinner"],
      instructions: {
        steps: [
          "Season sushi rice with vinegar.",
          "Roll with salmon, avocado and cucumber in nori.",
          "Slice and serve with soy and wasabi.",
        ],
        ingredients: [
          ing(1181, "sushi-grade salmon", 120, "g", "Seafood"),
          ing(1182, "sushi rice", 90, "g", "Pasta and Rice"),
          ing(1183, "avocado", 0.5, "whole", "Produce"),
          ing(1184, "nori", 2, "sheet", "Ethnic Foods"),
        ],
      },
    },
  },
  {
    meta: { slots: ["lunch", "dinner"], pescatarian: true, vegetarian: false, nutFree: true },
    doc: {
      originRecipeId: "900026",
      source: "spoonacular",
      name: "Seafood Paella",
      image: IMG + "9bl20p1763248192.jpg",
      calories: 620, protein: 38, fat: 18, carbs: 72, servings: 1, readyInMinutes: 45,
      diets: ["pescatarian", "gluten free", "dairy free", "high protein"],
      cuisines: ["Spanish", "Mediterranean"],
      dishTypes: ["lunch", "main course", "dinner"],
      instructions: {
        steps: [
          "Fry sofrito, then toast the rice with saffron.",
          "Add stock and simmer without stirring.",
          "Nestle in prawns and mussels until cooked.",
        ],
        ingredients: [
          ing(1261, "prawns", 100, "g", "Seafood"),
          ing(1262, "mussels", 100, "g", "Seafood"),
          ing(1263, "paella rice", 90, "g", "Pasta and Rice"),
          ing(1264, "saffron", 1, "pinch", "Spices and Seasonings"),
        ],
      },
    },
  },
  {
    meta: { slots: ["lunch", "dinner"], pescatarian: true, vegetarian: false, nutFree: true },
    doc: {
      originRecipeId: "900036",
      source: "spoonacular",
      name: "Fish Pie",
      image: IMG + "ysxwuq1487323065.jpg",
      calories: 580, protein: 34, fat: 26, carbs: 52, servings: 1, readyInMinutes: 50,
      diets: ["pescatarian", "high protein"],
      cuisines: ["British"],
      dishTypes: ["lunch", "main course", "dinner"],
      instructions: {
        steps: [
          "Poach mixed fish in milk, then make a sauce from it.",
          "Fold fish through and top with mashed potato.",
          "Bake until golden.",
        ],
        ingredients: [
          ing(1361, "white fish", 120, "g", "Seafood"),
          ing(1362, "salmon fillet", 80, "g", "Seafood"),
          ing(1363, "potato", 200, "g", "Produce"),
          ing(1364, "milk", 150, "ml", "Milk, Eggs, Other Dairy"),
        ],
      },
    },
  },
  {
    meta: { slots: ["lunch", "dinner"], pescatarian: true, vegetarian: false, nutFree: true },
    doc: {
      originRecipeId: "900040",
      source: "spoonacular",
      name: "Prawn Stir-Fry",
      image: IMG + "96lt871763480970.jpg",
      calories: 480, protein: 34, fat: 16, carbs: 48, servings: 1, readyInMinutes: 18,
      diets: ["pescatarian", "dairy free", "high protein"],
      cuisines: ["Chinese", "Asian"],
      dishTypes: ["lunch", "main course", "dinner"],
      instructions: {
        steps: [
          "Sear prawns until pink; set aside.",
          "Stir-fry mixed vegetables in a soy-garlic sauce.",
          "Return prawns and serve over noodles.",
        ],
        ingredients: [
          ing(1401, "prawns", 160, "g", "Seafood"),
          ing(1402, "mixed vegetables", 200, "g", "Produce"),
          ing(1403, "egg noodles", 80, "g", "Pasta and Rice"),
          ing(1404, "soy sauce", 2, "tbsp", "Condiments"),
        ],
      },
    },
  },
  {
    meta: { slots: ["lunch", "dinner"], pescatarian: true, vegetarian: false, nutFree: true },
    doc: {
      originRecipeId: "900041",
      source: "spoonacular",
      name: "Salmon & Prawn Risotto",
      image: IMG + "xxrxux1503070723.jpg",
      calories: 640, protein: 38, fat: 22, carbs: 70, servings: 1, readyInMinutes: 35,
      diets: ["pescatarian", "gluten free", "high protein"],
      cuisines: ["Italian", "Mediterranean"],
      dishTypes: ["lunch", "main course", "dinner"],
      instructions: {
        steps: [
          "Toast risotto rice, then add stock a ladle at a time.",
          "Stir until creamy and al dente.",
          "Fold in salmon and prawns; finish with lemon.",
        ],
        ingredients: [
          ing(1411, "salmon fillet", 100, "g", "Seafood"),
          ing(1412, "prawns", 80, "g", "Seafood"),
          ing(1413, "arborio rice", 90, "g", "Pasta and Rice"),
          ing(1414, "parmesan cheese", 20, "g", "Cheese"),
        ],
      },
    },
  },

  // ======================= VEGETARIAN / VEGAN MAINS =======================
  {
    meta: { slots: ["lunch", "dinner"], pescatarian: true, vegetarian: true, nutFree: true },
    doc: {
      originRecipeId: "900012",
      source: "spoonacular",
      name: "Dal Fry",
      image: IMG + "wuxrtu1483564410.jpg",
      calories: 520, protein: 22, fat: 12, carbs: 78, servings: 1, readyInMinutes: 30,
      diets: ["vegan", "vegetarian", "gluten free", "dairy free"],
      cuisines: ["Indian", "Asian"],
      dishTypes: ["lunch", "main course", "dinner"],
      instructions: {
        steps: [
          "Simmer lentils until soft.",
          "Fry a cumin-garlic-tomato tempering.",
          "Stir the tempering through; serve with rice.",
        ],
        ingredients: [
          ing(1121, "yellow lentils", 90, "g", "Pasta and Rice"),
          ing(1122, "tomato", 120, "g", "Produce"),
          ing(1123, "basmati rice", 80, "g", "Pasta and Rice"),
          ing(1124, "cumin", 1, "tsp", "Spices and Seasonings"),
        ],
      },
    },
  },
  {
    meta: { slots: ["lunch", "dinner"], pescatarian: true, vegetarian: true, nutFree: true },
    doc: {
      originRecipeId: "900013",
      source: "spoonacular",
      name: "Chickpea Fajitas",
      image: IMG + "tvtxpq1511464705.jpg",
      calories: 540, protein: 22, fat: 18, carbs: 70, servings: 1, readyInMinutes: 20,
      diets: ["vegan", "vegetarian", "dairy free"],
      cuisines: ["Mexican"],
      dishTypes: ["lunch", "main course", "dinner"],
      instructions: {
        steps: [
          "Sauté chickpeas, peppers and onion with fajita spices.",
          "Warm the tortillas.",
          "Fill and top with salsa and lime.",
        ],
        ingredients: [
          ing(1131, "chickpeas", 200, "g", "Canned and Jarred"),
          ing(1132, "bell pepper", 1, "whole", "Produce"),
          ing(1133, "flour tortilla", 2, "whole", "Bakery/Bread"),
          ing(1134, "onion", 0.5, "whole", "Produce"),
        ],
      },
    },
  },
  {
    meta: { slots: ["lunch", "dinner"], pescatarian: true, vegetarian: true, nutFree: true },
    doc: {
      originRecipeId: "900016",
      source: "spoonacular",
      name: "Silken Tofu with Sesame Soy",
      image: IMG + "j9nray1765657692.jpg",
      calories: 500, protein: 26, fat: 18, carbs: 58, servings: 1, readyInMinutes: 15,
      diets: ["vegan", "vegetarian", "dairy free"],
      cuisines: ["Chinese", "Asian"],
      dishTypes: ["lunch", "main course", "dinner"],
      instructions: {
        steps: [
          "Steam the silken tofu until hot.",
          "Warm a sesame-soy-ginger dressing.",
          "Pour over and serve with rice.",
        ],
        ingredients: [
          ing(1161, "silken tofu", 250, "g", "Health Foods"),
          ing(1162, "soy sauce", 2, "tbsp", "Condiments"),
          ing(1163, "sesame oil", 1, "tbsp", "Oil, Vinegar, Salad Dressing"),
          ing(1164, "white rice", 90, "g", "Pasta and Rice"),
        ],
      },
    },
  },
  {
    meta: { slots: ["lunch", "dinner"], pescatarian: true, vegetarian: true, nutFree: true },
    doc: {
      originRecipeId: "900028",
      source: "spoonacular",
      name: "Ratatouille",
      image: IMG + "wrpwuu1511786491.jpg",
      calories: 320, protein: 8, fat: 14, carbs: 42, servings: 1, readyInMinutes: 45,
      diets: ["vegan", "vegetarian", "gluten free", "dairy free"],
      cuisines: ["French", "Mediterranean"],
      dishTypes: ["lunch", "main course", "dinner", "side dish"],
      instructions: {
        steps: [
          "Slice courgette, aubergine and pepper.",
          "Layer over a tomato-onion sauce.",
          "Bake with olive oil and herbs until tender.",
        ],
        ingredients: [
          ing(1281, "aubergine", 1, "whole", "Produce"),
          ing(1282, "courgette", 1, "whole", "Produce"),
          ing(1283, "bell pepper", 1, "whole", "Produce"),
          ing(1284, "canned tomatoes", 200, "g", "Canned and Jarred"),
        ],
      },
    },
  },
  {
    meta: { slots: ["lunch", "dinner"], pescatarian: true, vegetarian: true, nutFree: true },
    doc: {
      originRecipeId: "900035",
      source: "spoonacular",
      name: "Spicy Arrabiata Penne",
      image: IMG + "ustsqw1468250014.jpg",
      calories: 520, protein: 16, fat: 12, carbs: 92, servings: 1, readyInMinutes: 25,
      diets: ["vegan", "vegetarian", "dairy free"],
      cuisines: ["Italian"],
      dishTypes: ["lunch", "main course", "dinner"],
      instructions: {
        steps: [
          "Cook penne al dente.",
          "Simmer garlic, chilli and tomato into a spicy sauce.",
          "Toss pasta through and finish with parsley.",
        ],
        ingredients: [
          ing(1351, "penne", 110, "g", "Pasta and Rice"),
          ing(1352, "canned tomatoes", 200, "g", "Canned and Jarred"),
          ing(1353, "garlic", 3, "clove", "Produce"),
          ing(1354, "chilli flakes", 1, "tsp", "Spices and Seasonings"),
        ],
      },
    },
  },
  {
    meta: { slots: ["lunch", "dinner"], pescatarian: true, vegetarian: true, nutFree: true },
    doc: {
      originRecipeId: "900037",
      source: "spoonacular",
      name: "Sichuan Eggplant",
      image: IMG + "1oz4nb1765687990.jpg",
      calories: 420, protein: 10, fat: 18, carbs: 56, servings: 1, readyInMinutes: 25,
      diets: ["vegan", "vegetarian", "dairy free"],
      cuisines: ["Chinese", "Asian"],
      dishTypes: ["lunch", "main course", "dinner"],
      instructions: {
        steps: [
          "Fry eggplant until soft and golden.",
          "Add a garlic-chilli-soy sauce.",
          "Toss to coat; serve over rice.",
        ],
        ingredients: [
          ing(1371, "eggplant", 1, "whole", "Produce"),
          ing(1372, "soy sauce", 2, "tbsp", "Condiments"),
          ing(1373, "garlic", 3, "clove", "Produce"),
          ing(1374, "white rice", 90, "g", "Pasta and Rice"),
        ],
      },
    },
  },
  {
    meta: { slots: ["lunch", "dinner"], pescatarian: true, vegetarian: true, nutFree: true },
    doc: {
      originRecipeId: "900042",
      source: "spoonacular",
      name: "Falafel Plate",
      image: IMG + "u5e9qq1763795441.jpg",
      calories: 540, protein: 20, fat: 22, carbs: 68, servings: 1, readyInMinutes: 30,
      diets: ["vegan", "vegetarian", "dairy free"],
      cuisines: ["Middle Eastern", "Mediterranean"],
      dishTypes: ["lunch", "main course", "dinner"],
      instructions: {
        steps: [
          "Blend soaked chickpeas with herbs and spices.",
          "Shape and fry the falafel until crisp.",
          "Serve with flatbread, salad and tahini.",
        ],
        ingredients: [
          ing(1421, "dried chickpeas", 120, "g", "Canned and Jarred"),
          ing(1422, "flatbread", 1, "whole", "Bakery/Bread"),
          ing(1423, "tahini", 1, "tbsp", "Condiments"),
          ing(1424, "parsley", 1, "handful", "Produce"),
        ],
      },
    },
  },
  {
    meta: { slots: ["lunch", "dinner"], pescatarian: true, vegetarian: true, nutFree: true },
    doc: {
      originRecipeId: "900043",
      source: "spoonacular",
      name: "Vegetable Casserole",
      image: IMG + "vptwyt1511450962.jpg",
      calories: 420, protein: 14, fat: 12, carbs: 64, servings: 1, readyInMinutes: 60,
      diets: ["vegan", "vegetarian", "gluten free", "dairy free"],
      cuisines: ["British"],
      dishTypes: ["lunch", "main course", "dinner"],
      instructions: {
        steps: [
          "Sauté root vegetables and beans.",
          "Simmer in a herby tomato stock.",
          "Bake until thick and tender.",
        ],
        ingredients: [
          ing(1431, "carrot", 100, "g", "Produce"),
          ing(1432, "potato", 150, "g", "Produce"),
          ing(1433, "cannellini beans", 120, "g", "Canned and Jarred"),
          ing(1434, "vegetable stock", 200, "ml", "Canned and Jarred"),
        ],
      },
    },
  },
  {
    meta: { slots: ["lunch", "dinner"], pescatarian: true, vegetarian: false, nutFree: false },
    doc: {
      originRecipeId: "900025",
      source: "spoonacular",
      name: "Prawn Pad Thai",
      image: IMG + "rg9ze01763479093.jpg",
      calories: 600, protein: 28, fat: 22, carbs: 72, servings: 1, readyInMinutes: 25,
      diets: ["pescatarian", "dairy free"],
      cuisines: ["Thai", "Asian"],
      dishTypes: ["lunch", "main course", "dinner"],
      instructions: {
        steps: [
          "Soak rice noodles until pliable.",
          "Stir-fry prawns, egg and noodles in tamarind sauce.",
          "Finish with peanuts, lime and bean sprouts.",
        ],
        ingredients: [
          ing(1251, "prawns", 120, "g", "Seafood"),
          ing(1252, "rice noodles", 90, "g", "Pasta and Rice"),
          ing(1253, "peanuts", 25, "g", "Nuts"),
          ing(1254, "tamarind paste", 1, "tbsp", "Condiments"),
        ],
      },
    },
  },

  // ======================= MANUAL (user-owned, full nutrition + image) =======================
  {
    meta: { slots: ["lunch", "dinner"], pescatarian: false, vegetarian: false, nutFree: true, owner: "man" },
    doc: {
      originRecipeId: "manual-man-chili", // replaced with per-user id at seed time
      source: "manual",
      name: "High-Protein Beef Chili",
      image: IMG + "uuqvwu1504629254.jpg",
      calories: 680, protein: 52, fat: 24, carbs: 60, servings: 1, readyInMinutes: 40,
      diets: ["dairy free", "gluten free", "high protein"],
      cuisines: ["American", "Mexican"],
      dishTypes: ["lunch", "main course", "dinner"],
      instructions: {
        steps: [
          "Brown lean ground beef with onion and garlic.",
          "Add beans, tomatoes and chili spices; simmer 30 min.",
          "Serve topped with fresh coriander.",
        ],
        ingredients: [
          ing(9501, "lean ground beef", 180, "g", "Meat"),
          ing(9502, "kidney beans", 150, "g", "Canned and Jarred"),
          ing(9503, "canned tomatoes", 200, "g", "Canned and Jarred"),
          ing(9504, "chili powder", 1, "tbsp", "Spices and Seasonings"),
        ],
      },
    },
  },
  {
    meta: { slots: ["breakfast"], pescatarian: true, vegetarian: true, nutFree: false, owner: "man" },
    doc: {
      originRecipeId: "manual-man-pancakes",
      source: "manual",
      name: "Peanut Butter Protein Pancakes",
      image: IMG + "oaqz9f1766593912.jpg",
      calories: 560, protein: 38, fat: 20, carbs: 58, servings: 1, readyInMinutes: 15,
      diets: ["vegetarian", "high protein"],
      cuisines: ["American"],
      dishTypes: ["breakfast", "morning meal"],
      instructions: {
        steps: [
          "Blend oats, egg, banana and protein powder into a batter.",
          "Cook pancakes on a non-stick pan.",
          "Top with peanut butter and banana.",
        ],
        ingredients: [
          ing(9511, "rolled oats", 50, "g", "Cereal"),
          ing(9512, "egg", 1, "large", "Milk, Eggs, Other Dairy"),
          ing(9513, "banana", 1, "whole", "Produce"),
          ing(9514, "peanut butter", 1, "tbsp", "Nut butters, Jams, and Honey"),
        ],
      },
    },
  },
  {
    meta: { slots: ["lunch", "dinner"], pescatarian: true, vegetarian: false, nutFree: true, owner: "woman" },
    doc: {
      originRecipeId: "manual-woman-salmon-salad",
      source: "manual",
      name: "Salmon Avocado Salad",
      image: IMG + "1549542994.jpg",
      calories: 460, protein: 36, fat: 22, carbs: 26, servings: 1, readyInMinutes: 20,
      diets: ["pescatarian", "gluten free", "high protein"],
      cuisines: ["Mediterranean"],
      dishTypes: ["lunch", "main course", "salad"],
      instructions: {
        steps: [
          "Pan-sear the salmon and flake it.",
          "Toss greens, avocado, cucumber and tomato.",
          "Add salmon and a lemon-olive-oil dressing.",
        ],
        ingredients: [
          ing(9521, "salmon fillet", 150, "g", "Seafood"),
          ing(9522, "avocado", 0.5, "whole", "Produce"),
          ing(9523, "mixed greens", 80, "g", "Produce"),
          ing(9524, "cucumber", 0.5, "whole", "Produce"),
        ],
      },
    },
  },
  {
    meta: { slots: ["lunch", "dinner"], pescatarian: true, vegetarian: false, nutFree: true, owner: "woman" },
    doc: {
      originRecipeId: "manual-woman-shrimp-rice",
      source: "manual",
      name: "Thai Prawn Fried Rice",
      image: IMG + "hblwvg1763478203.jpg",
      calories: 500, protein: 32, fat: 14, carbs: 62, servings: 1, readyInMinutes: 18,
      diets: ["pescatarian", "dairy free", "high protein"],
      cuisines: ["Thai", "Asian"],
      dishTypes: ["lunch", "main course", "dinner"],
      instructions: {
        steps: [
          "Stir-fry prawns until pink; set aside.",
          "Fry cold rice with peas, carrot and egg.",
          "Return prawns, season with fish sauce and lime.",
        ],
        ingredients: [
          ing(9531, "prawns", 140, "g", "Seafood"),
          ing(9532, "cooked rice", 180, "g", "Pasta and Rice"),
          ing(9533, "frozen peas and carrots", 80, "g", "Frozen"),
          ing(9534, "egg", 1, "large", "Milk, Eggs, Other Dairy"),
        ],
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Demo profiles
// ---------------------------------------------------------------------------

export type ProfileKey = "man" | "woman";

export interface DemoProfile {
  key: ProfileKey;
  name: string;
  email: string;
  password: string;
  preferences: {
    diet: string[];
    allergies: string[];
    healthGoal: string;
    bodyStats: {
      weightKg: number;
      heightCm: number;
      age: number;
      gender: "male" | "female";
      activityLevel:
        | "sedentary"
        | "light"
        | "moderate"
        | "active"
        | "very_active"
        | "extra_active";
      unitSystem: "metric" | "us";
    };
  };
  /** originRecipeIds this user "liked" — drives the taste vector.
   *  Manual recipes are referenced by their template id and rewritten per-user. */
  likedRecipeIds: string[];
}

export const DEMO_PROFILES: Record<ProfileKey, DemoProfile> = {
  man: {
    key: "man",
    name: "Daniel Cohen",
    email: "khgojnu1@gmail.com",
    password: "khgojnu21!",
    preferences: {
      diet: [],
      allergies: [],
      healthGoal: "maintain_weight",
      bodyStats: {
        weightKg: 73,
        heightCm: 174,
        age: 28,
        gender: "male",
        activityLevel: "moderate", // "Exercise 4–5 times/week" per app options
        unitSystem: "metric",
      },
    },
    // Focused taste: American · Chinese · Italian, meaty / high-protein.
    likedRecipeIds: [
      "900007", // Beef & Broccoli Stir-Fry (Chinese)
      "900031", // Sweet and Sour Chicken (Chinese)
      "900020", // Chicken Alfredo Pasta (Italian)
      "900032", // Beef Lasagne (Italian)
      "900015", // Steak Diane (American)
      "manual-man-chili", // High-Protein Beef Chili (American)
    ],
  },
  woman: {
    key: "woman",
    name: "Maya Levi",
    email: "khgojnu2@gmail.com",
    password: "khgojnu21!",
    preferences: {
      diet: ["pescatarian"],
      allergies: ["nuts"],
      healthGoal: "lose_weight",
      bodyStats: {
        weightKg: 64,
        heightCm: 167,
        age: 30,
        gender: "female",
        activityLevel: "light", // "Exercise 1–3 times/week"
        unitSystem: "metric",
      },
    },
    // Focused taste: Mediterranean · Japanese · Italian, pescatarian & nut-free.
    likedRecipeIds: [
      "900014", // Tuna Niçoise Salad (Mediterranean)
      "900010", // Baked Salmon with Fennel & Tomatoes (Mediterranean)
      "900008", // Honey Teriyaki Salmon (Japanese)
      "900018", // Salmon & Avocado Sushi (Japanese)
      "900009", // Chilli Prawn Linguine (Italian)
      "manual-woman-salmon-salad", // Salmon Avocado Salad (Mediterranean)
    ],
  },
};
