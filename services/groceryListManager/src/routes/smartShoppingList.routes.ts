import { Router } from 'express';
import * as SmartController from '../controllers/smartShoppingList.controller';
import authMiddleware from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /grocerylist/users/{userId}/smart-list:
 *   post:
 *     summary: Generate a smart shopping list from recipes + current inventory
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
 *             required: [recipes]
 *             properties:
 *               recipes:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     recipeId: { type: string }
 *                     servingsPlanned: { type: number }
 *                     servingsOriginal: { type: number }
 *                     ingredients:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name: { type: string }
 *                           amount: { type: number }
 *                           unit: { type: string }
 *                           aisle: { type: string }
 *               inventory:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name: { type: string }
 *                     quantity: { type: number }
 *                     unit: { type: string }
 *     responses:
 *       200:
 *         description: Smart shopping list with toBuy, alreadyCovered, projectedInventory
 */
router.post('/users/:userId/smart-list', SmartController.generateSmartList);

export default router;
