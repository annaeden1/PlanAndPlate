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

userManagementRouter.patch('/:userId/password', authMiddleware, updatePassword);

userManagementRouter.get('/:userId/account', authMiddleware, getAccountData);

userManagementRouter.patch(
  '/:userId/account',
  authMiddleware,
  updateAccountData,
);

userManagementRouter.get(
  '/:userId/preferences',
  authMiddleware,
  getPreferences,
);

userManagementRouter.patch(
  '/:userId/preferences',
  authMiddleware,
  updatePreferences,
);
