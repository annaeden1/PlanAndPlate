import { Router } from 'express';
import * as GroceryController from '../controllers/groceryList.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: GroceryList
 *   description: Grocery list management endpoints
 */

/**
 * @swagger
 * /grocerylist/users/{userId}/products:
 *   get:
 *     summary: Search products in the grocery list
 *     tags: [GroceryList]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: productName
 *         schema:
 *           type: string
 *         description: Optional partial name filter
 *     responses:
 *       200:
 *         description: List of matching products
 */
router.get('/users/:userId/products', GroceryController.searchProducts);

/**
 * @swagger
 * /grocerylist/users/{userId}/products/{productName}:
 *   get:
 *     summary: Get a specific product by name
 *     tags: [GroceryList]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: productName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 */
router.get('/users/:userId/products/:productName', GroceryController.getProduct);

/**
 * @swagger
 * /grocerylist/users/{userId}/products:
 *   post:
 *     summary: Add a product to the grocery list
 *     tags: [GroceryList]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, quantity, unit]
 *             properties:
 *               name:
 *                 type: string
 *                 example: tomato
 *               quantity:
 *                 type: number
 *                 example: 3
 *               unit:
 *                 type: string
 *                 example: piece
 *     responses:
 *       201:
 *         description: Updated grocery list items
 *       400:
 *         description: Missing required fields
 */
router.post('/users/:userId/products', GroceryController.addProduct);

/**
 * @swagger
 * /grocerylist/users/{userId}/recipes/{recipeId}/ingredients:
 *   post:
 *     summary: Import all ingredients from a recipe into the grocery list
 *     tags: [GroceryList]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mealPlanId:
 *                 type: string
 *                 description: Optional meal plan reference
 *     responses:
 *       201:
 *         description: Updated grocery list with imported ingredients
 */
router.post('/users/:userId/recipes/:recipeId/ingredients', GroceryController.importRecipeIngredients);

/**
 * @swagger
 * /grocerylist/users/{userId}/products/{productName}:
 *   delete:
 *     summary: Remove a product from the grocery list
 *     tags: [GroceryList]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: productName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Updated grocery list items
 */
router.delete('/users/:userId/products/:productName', GroceryController.removeProduct);

/**
 * @swagger
 * /grocerylist/users/{userId}/products:
 *   delete:
 *     summary: Clear the entire grocery list
 *     tags: [GroceryList]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Grocery list cleared
 */
router.delete('/users/:userId/products', GroceryController.clearGroceryList);

export default router;
