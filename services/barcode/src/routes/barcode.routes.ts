import { Router } from 'express';
import { scanBarcode } from '../controllers/barcode.controller';
import authMiddleware from '../middlewares/auth.middleware';

export const barcodeRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Barcode
 *   description: Barcode scanning, product lookup, and preference validation endpoints
 */

/**
 * @swagger
 * /barcode/scan/{userId}:
 *   post:
 *     summary: Scan a barcode and get nutrition data, preference matches, and AI-suggested alternatives
 *     tags: [Barcode]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Authenticated user id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - barcode
 *             properties:
 *               barcode:
 *                 type: string
 *                 description: Product barcode to scan
 *                 example: "3017620422003"
 *     responses:
 *       200:
 *         description: Nutrition data, preference matches, and alternatives (if a mismatch was found)
 *       400:
 *         description: Barcode is required
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found in OpenFoodFacts
 *       500:
 *         description: Failed to process barcode
 */
barcodeRouter.post('/scan/:userId', authMiddleware, scanBarcode);
