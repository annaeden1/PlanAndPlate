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