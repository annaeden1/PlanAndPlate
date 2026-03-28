import { Request, Response } from 'express';
import * as openFoodFactsService from '../services/openFoodFactsService';

export const scanBarcode = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { barcode } = req.body;

  if (!barcode) {
    return res.status(400).json({ error: 'Barcode is required' });
  }

  try {
    const product = await openFoodFactsService.fetchProductByBarcode(
      barcode.toString(),
    );

    console.log(product);
    if (!product) {
      return res
        .status(404)
        .json({ error: 'Product not found in OpenFoodFacts' });
    }

    // TODO: Implement product matching with the user’s preferences
    const matchesPreferences = true;

    return res.json({
      nutritionData: product,
      matchesPreferences,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: 'Failed to process barcode', message: error });
  }
};
