import express from "express";
import MealPlannerController from "../controllers/mealPlannerController";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: MealPlanner
 *   description: Meal planner management endpoints
 */

/**
 * @swagger
 * /users/{userId}/meal-plans/weekly:
 *   post:
 *     summary: Create a new weekly meal plan for a user from a given start date from the API
 *     tags: [MealPlanner]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Created - Weekly meal plan created successfully
 *       400:
 *         description: Bad Request - Invalid input data
 *       500:
 *         description: Internal Server Error - Server error while creating meal plan
 **/
router.post(
  "/users/{userId}/meal-plans/weekly",
  MealPlannerController.createWeeklyPlan,
);

/**
 * @swagger
 * /users/{userId}/meal-plans?week=:
 *   get:
 *     summary: Get the weekly meal plan for a user for a specific week from DB
 *     tags: [MealPlanner]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: week
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: OK - Weekly meal plan retrieved successfully
 *       400:
 *         description: Bad Request - Invalid input data
 *       404:
 *         description: Not Found - User or meal plan not found
 *       500:
 *         description: Internal Server Error - Server error while retrieving meal plan
 **/
router.get(
  "/users/{userId}/meal-plans?week=",
  MealPlannerController.getWeeklyPlan,
);

/**
 * @swagger
 * /users/{userId}/meal-plans/day?date=:
 *   get:
 *     summary: Get the daily meal plan for a user for a specific date from DB
 *     tags: [MealPlanner]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *     responses:
 *       200:
 *         description: OK - Daily meal plan retrieved successfully
 *       400:
 *         description: Bad Request - Invalid input data
 *       404:
 *         description: Not Found - User or meal plan not found
 *       500:
 *         description: Internal Server Error - Server error while retrieving meal plan
 **/
router.get(
  "/users/{userId}/meal-plans/day?date= ",
  MealPlannerController.getDailyPlan,
);

/**
 * @swagger
 * /recipes/{recipeId}:
 *   get:
 *     summary: Get the details of a recipe by its ID from API
 *     tags: [MealPlanner]
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: OK - Recipe details retrieved successfully
 *       400:
 *         description: Bad Request - Invalid recipe ID
 *       404:
 *         description: Not Found - Recipe not found
 *       500:
 *         description: Internal Server Error - Server error while retrieving recipe details
 **/
router.get(
  "/recipes/{recipeId}",
  MealPlannerController.getRecipeDetails,
);

/**
 * @swagger
 * /users/{userId}/meal-plans/day?date=:
 *   patch:
 *     summary: Update the daily meal plan for a user for a specific date in DB from API - regenerate the whole day plan with new meals
 *     tags: [MealPlanner]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               breakfast:
 *                 type: object
 *                 properties:
 *                   recipeId:
 *                     type: string
 *                   name:
 *                     type: string
 *               lunch:
 *                 type: object
 *                 properties:
 *                   recipeId:
 *                     type: string
 *                   name:
 *                     type: string
 *               dinner:
 *                 type: object
 *                 properties:
 *                   recipeId:
 *                     type: string
 *                   name:
 *                     type: string
 *     responses:
 *       200:
 *         description: OK - Daily meal plan updated successfully
 *       400:
 *         description: Bad Request - Invalid input data
 *       404:
 *         description: Not Found - User or meal plan not found
 *       500:
 *         description: Internal Server Error - Server error while updating meal plan
 **/
router.patch(
  "/users/{userId}/meal-plans/day?date= ",
  MealPlannerController.updateDailyPlan,
);

/**
 * @swagger
 * /users/{userId}/meal-plans/day:
 *   patch:
 *     summary: Update a specific meal (breakfast/lunch/dinner) in the daily meal plan for a user for a specific date in DB from API - regenerate only the specified meal with a new recipe
 *     tags: [MealPlanner]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *       - in: query
 *         name: mealType
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recipeId:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK - Meal in daily meal plan updated successfully
 *       400:
 *         description: Bad Request - Invalid input data
 *       404:
 *         description: Not Found - User or meal plan not found
 *       500:
 *         description: Internal Server Error - Server error while updating meal plan
 **/
router.patch(
  "/users/{userId}/meal-plans/day?date=&mealType= ",
  MealPlannerController.updateMealInPlan,
);

/**
 * @swagger
 * /users/{userId}/meal-plans/nutritions?week=:
 *   get:
 *     summary: Get the weekly nutrition summary for a user for a specific week
 *     tags: [MealPlanner]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: week
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: OK - Weekly nutrition summary retrieved successfully
 *       400:
 *         description: Bad Request - Invalid input data
 *       404:
 *         description: Not Found - User or meal plan not found
 *       500:
 *         description: Internal Server Error - Server error while retrieving nutrition summary
 **/
router.get(
  "/users/{userId}/meal-plans/nutritions?week= ",
  MealPlannerController.getWeeklyNutritionSummary,
);

/**
 * @swagger
 * /users/{userId}/likes:
 *   post:
 *     summary: Like a recipe for a user
 *     tags: [MealPlanner]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recipeId:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK - Recipe liked successfully
 *       400:
 *         description: Bad Request - Invalid input data
 *       404:
 *         description: Not Found - User or recipe not found
 *       500:
 *         description: Internal Server Error - Server error while liking recipe
 **/
router.post(
  "/users/{userId}/likes",
  MealPlannerController.likeRecipe,
);

/**
 * @swagger
 * /users/{userId}/likes:
 *   delete:
 *     summary: Unlike a recipe for a user
 *     tags: [MealPlanner]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recipeId:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK - Recipe unliked successfully
 *       400:
 *         description: Bad Request - Invalid input data
 *       404:
 *         description: Not Found - User or recipe not found
 *       500:
 *         description: Internal Server Error - Server error while unliking recipe
 **/
router.delete(
  "/users/{userId}/likes",
  MealPlannerController.unlikeRecipe,
);

/**
 * @swagger
 * /users/{userId}/likes?type=recipe:
 *   get:
 *     summary: Get the list of liked recipes for a user
 *     tags: [MealPlanner]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         required: false
 *     responses:
 *       200:
 *         description: OK - Liked recipes retrieved successfully
 *       400:
 *         description: Bad Request - Invalid input data
 *       404:
 *         description: Not Found - User not found
 *       500:
 *         description: Internal Server Error - Server error while retrieving liked recipes
 **/
router.get(
  "/users/{userId}/likes?type=recipe",
  MealPlannerController.getLikedRecipes,
);

/**
 * @swagger
 * /users/{userId}/recommendations/meals:
 *   get:
 *     summary: Get personalized meal recommendations for a user based on their liked recipes and meal plan history
 *     tags: [MealPlanner]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: OK - Meal recommendations retrieved successfully
 *       400:
 *         description: Bad Request - Invalid input data
 *       404:
 *         description: Not Found - User not found
 *       500:
 *         description: Internal Server Error - Server error while retrieving meal recommendations
 **/
router.get(
  "/users/{userId}/recommendations/meals",
  MealPlannerController.getMealRecommendations,
);
