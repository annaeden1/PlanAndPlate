import express from 'express';
import MealPlannerController from '../controllers/mealPlannerController';
import authMiddleware from '../middlewares/auth.middleware';

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
  '/users/:userId/meal-plans/weekly',
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
  '/users/:userId/meal-plans',
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
  '/users/:userId/meal-plans/day',
  authMiddleware,
  MealPlannerController.getDailyPlan,
);

/**
 * @swagger
 * /recipes:
 *   post:
 *     summary: Create a new manual recipe and save it to the recipe collection
 *     tags: [MealPlanner]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               image:
 *                 type: string
 *               servings:
 *                 type: number
 *               readyInMinutes:
 *                 type: number
 *               diets:
 *                 type: array
 *                 items:
 *                   type: string
 *               instructions:
 *                 type: object
 *                 properties:
 *                   steps:
 *                     type: array
 *                     items:
 *                       type: string
 *                   ingredients:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: number
 *                         name:
 *                           type: string
 *                         image:
 *                           type: string
 *                         amount:
 *                           type: number
 *                         unit:
 *                           type: string
 *                         aisle:
 *                           type: string
 *     responses:
 *       201:
 *         description: Created - Manual recipe created successfully
 *       400:
 *         description: Bad Request - Invalid recipe payload
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error - Failed to create manual recipe
 **/
mealPlannerRouter.post(
  '/recipes',
  authMiddleware,
  MealPlannerController.createManualRecipe,
);

/**
 * @swagger
 * /recipes/manual:
 *   get:
 *     summary: Get all manual recipes created by the logged-in user
 *     tags: [MealPlanner]
 *     responses:
 *       200:
 *         description: OK - Manual recipes retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error - Failed to retrieve manual recipes
 **/
mealPlannerRouter.get(
  '/recipes/manual',
  authMiddleware,
  MealPlannerController.getManualRecipes,
);

/**
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
  '/recipes/:recipeId',
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
  '/recipes/:recipeId/like',
  authMiddleware,
  MealPlannerController.toggleRecipeLike,
);

/**
 * @swagger
 * /users/{userId}/favorites:
 *   get:
 *     summary: Get all liked recipes for a user
 *     tags: [MealPlanner]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: OK - List of liked recipes
 *       400:
 *         description: Bad Request - Invalid userId
 *       500:
 *         description: Internal Server Error - Failed to fetch recipes
 */
mealPlannerRouter.get(
  "/users/:userId/favorites",
  authMiddleware,
  MealPlannerController.getLikedRecipes,
);
