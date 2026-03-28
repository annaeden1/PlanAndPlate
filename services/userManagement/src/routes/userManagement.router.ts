import express from 'express';
import { getAccountData, getPreferences, updatePassword } from '../controllers/userManagement.controller';

export const userManagementRouter = express.Router();

userManagementRouter.patch('/:email/password', updatePassword);

userManagementRouter.get('/:email/account', getAccountData);

userManagementRouter.get('/:email/preferences', getPreferences);