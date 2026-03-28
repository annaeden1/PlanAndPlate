import express from 'express';
import {
  getAccountData,
  getPreferences,
  updatePassword,
} from '../controllers/userManagement.controller';
import authMiddleware from '../middlewares/auth.middleware';

export const userManagementRouter = express.Router();

userManagementRouter.patch('/:email/password', authMiddleware, updatePassword);

userManagementRouter.get('/:email/account', authMiddleware, getAccountData);

userManagementRouter.get('/:email/preferences', authMiddleware, getPreferences);
