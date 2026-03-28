import { Router } from 'express';
import authController from '../controllers/auth.controller';
import authMiddleware from '../middlewares/auth.middleware';

export const authRouter = Router();

authRouter.post('/signup', authController.signup);

authRouter.post('/signin', authController.signin);

authRouter.post('/logout', authController.logout);

authRouter.post('/refresh-token', authController.refreshToken);

authRouter.get('/verify', authMiddleware, authController.verify);
