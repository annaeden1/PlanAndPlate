import { Router } from 'express';
import {
  getAccountData,
  getPreferences,
  updatePassword,
} from '../controllers/userManagement.controller';
import authMiddleware from '../middlewares/auth.middleware';

export const userManagementRouter = Router();

userManagementRouter.patch('/:email/password', authMiddleware, updatePassword);

userManagementRouter.get('/:email/account', authMiddleware, getAccountData);

userManagementRouter.get('/:email/preferences', authMiddleware, getPreferences);
