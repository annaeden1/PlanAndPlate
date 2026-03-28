import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../utils/types/auth';

const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token: string = authHeader.split(' ')[1];
  const secret: string = process.env.JWT_SECRET || 'secretkey';

  try {
    const decoded = jwt.verify(token, secret) as { userId: string };

    req.user = { _id: decoded.userId };

    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

export default authMiddleware;
