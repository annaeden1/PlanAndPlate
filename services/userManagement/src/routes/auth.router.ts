import express from 'express';
import authController from '../controllers/auth.controller';

export const authRouter = express.Router();

authRouter.post('/signup', authController.signup);

authRouter.post('/signin', authController.signin);

authRouter.post('/logout', authController.logout);

authRouter.post('/refresh-token', authController.refreshToken);
