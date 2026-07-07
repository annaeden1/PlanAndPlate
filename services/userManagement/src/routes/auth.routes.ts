import { Router } from 'express';
import authController from '../controllers/auth.controller';
import authMiddleware from '../middlewares/auth.middleware';

export const authRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Create a new user account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created - User registered successfully
 *       400:
 *         description: Bad Request - Invalid input
 *       500:
 *         description: Internal Server Error
 */
authRouter.post('/signup', authController.signup);

/**
 * @swagger
 * /auth/signin:
 *   post:
 *     summary: Sign in an existing user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK - Authentication successful
 *       400:
 *         description: Bad Request - Invalid credentials
 *       500:
 *         description: Internal Server Error
 */
authRouter.post('/signin', authController.signin);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout the authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK - Logged out successfully
 *       400:
 *         description: Bad Request - Refresh token is required
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error - Failed to logout
 */
authRouter.post('/logout', authMiddleware, authController.logout);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh authentication token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK - Token refreshed
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error - Failed to refresh token
 */
authRouter.post('/refresh-token', authController.refreshToken);

/**
 * @swagger
 * /auth/verify:
 *   get:
 *     summary: Verify authentication token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK - Token valid
 *       400:
 *         description: Bad Request - Unauthorized
 *       401:
 *         description: Unauthorized - Token invalid or missing
 *       500:
 *         description: Internal Server Error - Failed to verify user
 */
authRouter.get('/verify', authMiddleware, authController.verify);

/**
 * @swagger
 * /auth/google-signin:
 *   post:
 *     summary: Sign in or register using Google OAuth token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               credential:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK - Signed in with Google
 *       400:
 *         description: Bad Request
 */
authRouter.post('/google-signin', authController.googleSignin);
