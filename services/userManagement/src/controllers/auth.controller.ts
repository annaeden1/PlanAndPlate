import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthRequest, Tokens } from '../utils/types';
import {
  createUser,
  findUserByFilter,
  saveUser,
} from '../dal/authentication.repository';
import { hashPassword } from '../utils/password';

const signup = async (req: Request, res: Response) => {
  const { name, email, password, image, preferences } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: 'name, email and password are required' });
  }

  try {
    const encryptedPassword: string = await hashPassword(password);
    const newUser = await createUser({
      name,
      email,
      passwordHash: encryptedPassword,
      preferences,
      image,
    });

    const tokens: Tokens = generateToken(newUser._id.toString());

    newUser.tokens.push(tokens.refreshToken);

    await saveUser(newUser);

    res.status(201).json({ tokens });
  } catch (err) {
    return res
      .status(400)
      .json({ error: 'Failed to register the user', details: err });
  }
};

const signin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const currUser = await findUserByFilter({ email });
    if (!currUser) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const matchPassword: boolean = await bcrypt.compare(
      password,
      currUser.passwordHash,
    );
    if (!matchPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const tokens: Tokens = generateToken(currUser._id.toString());

    currUser.tokens.push(tokens.refreshToken);

    await saveUser(currUser);

    res.status(201).json({ tokens });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to login', details: err });
  }
};

const logout = async (req: Request, res: Response) => {
  const authHeader = req.headers['authorization'];
  const refreshToken = authHeader && authHeader.split(' ')[1];

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  const secret: string = process.env.JWT_REFRESH_TOKEN_SECRET || 'secretkey';

  try {
    const decoded: any = jwt.verify(refreshToken, secret);
    const currUser = await findUserByFilter({ _id: decoded.userId });

    if (!currUser) {
      return res.status(400).json({ error: 'Failed to logout' });
    }

    if (!currUser.tokens.includes(refreshToken)) {
      currUser.tokens = [];
      await saveUser(currUser);
      return res.status(400).json({ error: 'Failed to logout' });
    }

    currUser.tokens = currUser.tokens.filter((token) => token !== refreshToken);
    await saveUser(currUser);
    return res.status(200).send();
  } catch (err) {
    return res.status(500).json({ error: 'Failed to logout', details: err });
  }
};

const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token is required' });
  }

  try {
    const secret: string = process.env.JWT_REFRESH_TOKEN_SECRET || 'secretkey';
    const decoded: any = jwt.verify(refreshToken, secret);

    const currUser = await findUserByFilter({ _id: decoded.userId });
    if (!currUser) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    if (!currUser.tokens.includes(refreshToken)) {
      currUser.tokens = [];
      await saveUser(currUser);
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const tokens: Tokens = generateToken(currUser._id.toString());
    currUser.tokens = currUser.tokens.filter((token) => token !== refreshToken);
    currUser.tokens.push(tokens.refreshToken);
    await saveUser(currUser);
    res.status(200).json(tokens);
  } catch (err) {
    return res
      .status(500)
      .json({ error: 'Failed to refresh token', details: err });
  }
};

const verify = async (req: AuthRequest, res: Response) => {
  const userId = req.user?._id;

  try {
    const currUser = await findUserByFilter({ _id: userId });
    if (!currUser) {
      return res.status(400).json({ error: 'Unauthorized' });
    }

    res.status(200).json('User Authorized');
  } catch (err) {
    return res
      .status(500)
      .json({ error: 'Failed to verify user', details: err });
  }
};

const generateToken = (userId: string): Tokens => {
  const secret: string = process.env.JWT_SECRET || 'secretkey';
  const refreshTokenSecret: string =
    process.env.JWT_REFRESH_TOKEN_SECRET || 'secretkey';

  const exp: number = parseInt(process.env.JWT_EXPIRES_IN || '3600');
  const token: string = jwt.sign({ userId }, secret, {
    expiresIn: exp,
  });

  const refreshexp: number = parseInt(
    process.env.JWT_REFRESH_EXPIRES_IN || '86400',
  );
  const refreshToken: string = jwt.sign({ userId }, refreshTokenSecret, {
    expiresIn: refreshexp,
  });

  return { token, refreshToken };
};

export default {
  signup,
  signin,
  logout,
  refreshToken,
  verify,
};
