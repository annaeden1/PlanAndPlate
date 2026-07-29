import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { findUserByFilter, saveUser } from '../dal/authentication.repository';
import { hashPassword } from '../utils/password';
import { findUserAndUpdateFields } from '../dal/userManagement.repository';
import type { UserUpdatePayload } from '../types/userManagement.types';

export const updatePassword = async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const { oldPassword, newPassword } = req.body;

  if (!userId || !newPassword || !oldPassword) {
    return res
      .status(400)
      .json({ error: 'User Id and password (old and new) are required' });
  }

  if (newPassword.length < 6) {
    return res
      .status(400)
      .json({ error: 'New password must be at least 6 characters long' });
  }

  try {
    const user = await findUserByFilter({ _id: userId });
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    const matchPassword: boolean = await bcrypt.compare(
      oldPassword,
      user.passwordHash,
    );

    if (!matchPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    user.passwordHash = await hashPassword(newPassword);

    await saveUser(user);

    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (err) {
    return res
      .status(500)
      .json({ error: 'Failed to update password', details: err });
  }
};

export const getAccountData = async (req: Request, res: Response) => {
  const userId = req.params.userId;

  try {
    const user = await findUserByFilter({ _id: userId });
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    const accountData = {
      email: user.email,
      name: user.name,
      image: user.image,
    };

    res.status(200).json(accountData);
  } catch (err) {
    return res
      .status(500)
      .json({ error: 'Failed to retreive data', details: err });
  }
};

export const updateAccountData = async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const { name } = req.body;

  try {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const updatePayload: Record<string, string> = { name: name.trim() };

    const updatedUser = await findUserAndUpdateFields(userId, updatePayload);

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json({
      accountData: {
        email: updatedUser.email,
        name: updatedUser.name,
      },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ error: 'Failed to update account data', details: err });
  }
};

export const getPreferences = async (req: Request, res: Response) => {
  const userId = req.params.userId;

  try {
    const user = await findUserByFilter({ _id: userId });
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    const userPreferences = user.preferences;
    res.status(200).json({ userPreferences });
  } catch (err) {
    return res
      .status(500)
      .json({ error: 'Failed to retreive data', details: err });
  }
};

export const updatePreferences = async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const { preferences } = req.body;

  if (!preferences || typeof preferences !== 'object' || Array.isArray(preferences)) {
    return res
      .status(400)
      .json({ error: 'Request body must include a "preferences" object' });
  }

  try {
    const updatePayload: UserUpdatePayload = {};

    for (const [key, value] of Object.entries(preferences)) {
      updatePayload[`preferences.${key}`] = value as UserUpdatePayload[string];
    }

    const updatedUser = await findUserAndUpdateFields(userId, updatePayload);

    if (!updatedUser) {
      throw new Error('User not found');
    }

    res.status(200).json({ updatedUser });
  } catch (err) {
    return res
      .status(500)
      .json({ error: 'Failed to update preferences', details: err });
  }
};
