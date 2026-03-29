import { Router } from 'express';
import {
  getAccountData,
  getPreferences,
  updatePassword,
} from '../controllers/userManagement.controller';
import authMiddleware from '../middlewares/auth.middleware';

export const userManagementRouter = Router();

userManagementRouter.patch('/:userId/password', authMiddleware, updatePassword);

userManagementRouter.get('/:userId/account', authMiddleware, getAccountData);

userManagementRouter.get('/:userId/preferences', authMiddleware, getPreferences);
