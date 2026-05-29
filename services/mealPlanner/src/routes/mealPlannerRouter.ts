import express from "express";
import MealPlannerController from "../controllers/mealPlannerController";
import RecommendationController from "../recommendation/recommendationController";
import authMiddleware from "../middlewares/auth.middleware";

export const mealPlannerRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: MealPlanner
 *   description: Meal planner management endpoints
 */

/**
 * @swagger
 * /users/{userId}/meal-plans/weekly?date=:
 *   post:
 *     summary: Create a new weekly meal plan for a user from a given start date from the API
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
mealPlannerRouter.post(
  "/users/:userId/meal-plans/weekly",
  authMiddleware,
  MealPlannerController.createWeeklyPlan,
);

/**
 * @swagger
 * /users/{userId}/meal-plans?date=:
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
 *         name: date
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
mealPlannerRouter.get(
  "/users/:userId/meal-plans",
  authMiddleware,
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
mealPlannerRouter.get(
  "/users/:userId/meal-plans/day",
  authMiddleware,
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
 *         description: OK - Recipe details retrieved successfully (includes isLiked status)
 *       400:
 *         description: Bad Request - Invalid recipe ID
 *       404:
 *         description: Not Found - Recipe not found
 *       500:
 *         description: Internal Server Error - Server error while retrieving recipe details
 **/
mealPlannerRouter.get(
  "/recipes/:recipeId",
  authMiddleware,
  MealPlannerController.getRecipeDetails,
);

/**
 * @swagger
 * /recipes/{recipeId}/like:
 *   patch:
 *     summary: Toggle the like status of a recipe for the logged-in user
 *     tags: [MealPlanner]
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: OK - Like status toggled
 *       400:
 *         description: Invalid recipe ID
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to toggle recipe like
 */
mealPlannerRouter.patch(
  "/recipes/:recipeId/like",
  authMiddleware,
  MealPlannerController.toggleRecipeLike,
);

/**
 * @swagger
 * /users/{userId}/recipes/{recipeId}/suggestions:
 *   get:
 *     summary: Get personalized recipe suggestions to replace a recipe
 *     tags: [MealPlanner]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *       - in: path
 *         name: recipeId
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: mealType
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OK - Ranked suggestions
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to get suggestions
 */
mealPlannerRouter.get(
  "/users/:userId/recipes/:recipeId/suggestions",
  authMiddleware,
  RecommendationController.getSuggestions,
);

/**
 * @swagger
 * /users/{userId}/meal-plans/day/meal:
 *   patch:
 *     summary: Replace a meal slot in a day with a new recipe
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
 *               date:
 *                 type: string
 *               mealType:
 *                 type: string
 *               newRecipeId:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK - Updated day
 *       400:
 *         description: Bad Request - Invalid input
 *       404:
 *         description: Not Found - Plan or day not found
 *       500:
 *         description: Failed to replace meal
 */
mealPlannerRouter.patch(
  "/users/:userId/meal-plans/day/meal",
  authMiddleware,
  MealPlannerController.replaceMeal,
);