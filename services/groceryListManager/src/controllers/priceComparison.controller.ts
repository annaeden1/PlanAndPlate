import { Request, Response } from 'express';
import { comparePrices } from '../services/priceComparison/priceComparison.service';
import { NotFoundError } from '../types/errors';

export const getPriceComparison = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { userId } = req.params;
    const result = await comparePrices(userId);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    console.error('Price comparison failed:', error);
    res.status(502).json({ error: 'Price comparison is unavailable right now' });
  }
};
