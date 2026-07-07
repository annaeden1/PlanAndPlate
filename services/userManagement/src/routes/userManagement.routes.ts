import { Router } from 'express';
import {
  getAccountData,
  getPreferences,
  updateAccountData,
  updatePassword,
  updatePreferences,
} from '../controllers/userManagement.controller';
import authMiddleware from '../middlewares/auth.middleware';

export const userManagementRouter = Router();

/**
 * @swagger
 * tags:
 *   name: UserManagement
 *   description: User account and preferences management
 */

/**
 * @swagger
 * /userManagement/{userId}/password:
 *   patch:
 *     summary: Update a user's password
 *     tags: [UserManagement]
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
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK - Password updated
 *       400:
 *         description: Bad Request - Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not Found - User not found
 *       500:
 *         description: Internal Server Error - Failed to update password
 */
userManagementRouter.patch('/:userId/password', authMiddleware, updatePassword);

/**
 * @swagger
 * /userManagement/{userId}/account:
 *   get:
 *     summary: Get user account data
 *     tags: [UserManagement]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: OK - Account data returned
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not Found - User not found
 *       500:
 *         description: Internal Server Error - Failed to retrieve account data
 */
userManagementRouter.get('/:userId/account', authMiddleware, getAccountData);

/**
 * @swagger
 * /userManagement/{userId}/account:
 *   patch:
 *     summary: Update user account data
 *     tags: [UserManagement]
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
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK - Account updated
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not Found - User not found
 *       500:
 *         description: Internal Server Error - Failed to update account data
 */
userManagementRouter.patch(
  '/:userId/account',
  authMiddleware,
  updateAccountData,
);

/**
 * @swagger
 * /userManagement/{userId}/preferences:
 *   get:
 *     summary: Get user preferences
 *     tags: [UserManagement]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: OK - Preferences returned
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not Found - User not found
 *       500:
 *         description: Internal Server Error - Failed to retrieve preferences
 */
userManagementRouter.get(
  '/:userId/preferences',
  authMiddleware,
  getPreferences,
);

/**
 * @swagger
 * /userManagement/{userId}/preferences:
 *   patch:
 *     summary: Update user preferences
 *     tags: [UserManagement]
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
 *               preferences:
 *                 type: object
 *     responses:
 *       200:
 *         description: OK - Preferences updated
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error - Failed to update preferences
 */
userManagementRouter.patch(
  '/:userId/preferences',
  authMiddleware,
  updatePreferences,
);
