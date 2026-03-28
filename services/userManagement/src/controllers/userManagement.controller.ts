import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { findUserByFilter, saveUser } from '../dal/authentication.repository';

export const updatePassword = async (req: Request, res: Response) => {
  const email = req.params.email;
  const { oldPassword, newPassword } = req.body;

  if (!email || !newPassword || !oldPassword) {
    return res
      .status(400)
      .json({ error: 'Email and password (old and new) are required' });
  }

  try {
    const user = await findUserByFilter({ email });
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    const matchPassword: boolean = await bcrypt.compare(
      oldPassword,
      user.passwordHash,
    );

    if (!matchPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const salt: string = await bcrypt.genSalt(10);
    const encryptedPassword: string = await bcrypt.hash(newPassword, salt);
    user.passwordHash = encryptedPassword;

    await saveUser(user);

    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (err) {
    return res
      .status(500)
      .json({ error: 'Failed to update password', details: err });
  }
};

export const getAccountData = async (req: Request, res: Response) => {
  const email = req.params.email;

  try {
    const user = await findUserByFilter({ email });
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

export const getPreferences = async (req: Request, res: Response) => {
  const email = req.params.email;

  try {
    const user = await findUserByFilter({ email });
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
