import { Request, Response } from 'express';
import axios from 'axios';
import * as openFoodFactsService from '../services/openFoodFactsService';
import {
  checkPreferenceMatches,
  type UserPreferences,
  type PreferenceMatch,
} from '../services/preferenceMatchService';

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

    if (!product) {
      return res
        .status(404)
        .json({ error: 'Product not found in OpenFoodFacts' });
    }

    // Get user preferences from user management service
    let preferenceMatches: PreferenceMatch[] = [];
    try {
      const userManagementUrl =
        process.env.USER_MANAGEMENT_URL || 'http://localhost:8000';
      const authorization = req.headers.authorization;
      const preferencesResponse = await axios.get(
        `${userManagementUrl}/userManagement/${userId}/preferences`,
        {
          headers: authorization ? { Authorization: authorization } : {},
        },
      );

      const userPreferences: UserPreferences =
        preferencesResponse.data.userPreferences || {};
      preferenceMatches = checkPreferenceMatches(product, userPreferences);
    } catch (error) {
      // If we can't get preferences, just skip the matching
      console.log('Could not fetch user preferences:', error);
    }

    return res.json({
      nutritionData: product,
      preferenceMatches,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: 'Failed to process barcode', message: error });
  }
};
