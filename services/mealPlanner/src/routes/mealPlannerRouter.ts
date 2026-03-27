import express from "express";
import MealPlannerController from "../controllers/mealPlannerController";

const router = express.Router();

router.post(
  "/users/{userId}/meal-plans/weekly",
  MealPlannerController.createWeeklyPlan.bind(MealPlannerController),
);

router.get(
  "/users/{userId}/meal-plans?week=",
  MealPlannerController.getWeeklyPlan.bind(MealPlannerController),
);

router.get(
  "/users/{userId}/meal-plans/day?date= ",
  MealPlannerController.getDailyPlan.bind(MealPlannerController),
);

router.get(
  "/recipes/{recipeId}",
  MealPlannerController.getRecipeDetails.bind(MealPlannerController),
);

router.patch(
  "/users/{userId}/meal-plans/day?date= ",
  MealPlannerController.updateDailyPlan.bind(MealPlannerController),
);

router.patch(
  "/users/{userId}/meal-plans/day?date=&mealType= ",
  MealPlannerController.updateMealInPlan.bind(MealPlannerController),
);

router.get(
  "/users/{userId}/meal-plans/nutritions?week= ",
  MealPlannerController.getWeeklyNutritionSummary.bind(MealPlannerController),
);

router.post(
  "/users/{userId}/likes",
  MealPlannerController.likeRecipe.bind(MealPlannerController),
);

router.delete(
  "/users/{userId}/likes",
  MealPlannerController.unlikeRecipe.bind(MealPlannerController),
);

router.get(
  "/users/{userId}/likes?type=recipe",
  MealPlannerController.getLikedRecipes.bind(MealPlannerController),
);

router.get(
  "/users/{userId}/recommendations/meals",
  MealPlannerController.getMealRecommendations.bind(MealPlannerController),
);
