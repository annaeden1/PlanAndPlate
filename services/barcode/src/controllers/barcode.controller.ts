import { Request, Response } from 'express';
import axios from 'axios';
import * as openFoodFactsService from '../services/openFoodFactsService';
import { checkPreferenceMatches } from '../services/preferenceMatchService';
import { generateAlternativeSuggestions } from '../services/alternativeProductsService';
import { type ProductAlternative } from '../utils/types/alternatives';
import {
  type PreferenceMatch,
  type UserPreferences,
} from '../utils/types/preferences';

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
    let userPreferences: UserPreferences = {};
    let alternatives: ProductAlternative[] = [];
    let hasMismatch = false;

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

      userPreferences = preferencesResponse.data.userPreferences || {};
      preferenceMatches = checkPreferenceMatches(product, userPreferences);
      hasMismatch = preferenceMatches.some(
        (match) => match.status === 'mismatch',
      );
    } catch (error) {
      console.log('Could not fetch user preferences:', error);
    }

    if (hasMismatch) {
      console.log(
        `Preference mismatch detected for barcode ${barcode}. Building AI alternatives...`,
      );
      try {
        alternatives = await generateAlternativeSuggestions(
          product,
          userPreferences,
          preferenceMatches,
        );
      } catch (error) {
        console.log('Could not build alternative suggestions:', error);
      }
    } else {
      console.log(
        `No preference mismatch for barcode ${barcode}. Skipping AI alternatives.`,
      );
    }

    return res.json({
      nutritionData: product,
      preferenceMatches,
      alternatives,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: 'Failed to process barcode', message: error });
  }
};
