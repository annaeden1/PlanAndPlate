import { Request, Response } from 'express';
import * as GroceryService from '../services/groceryList.service';
import { IGroceryItem } from '../models/groceryList.model';
import { normalizeAisle } from '../config/categories';

// GET /grocerylist/users/:userId/products?productName=
// Returns flat list (for search), or grouped list when no filter
export const searchProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { productName } = req.query as { productName?: string };

    if (productName) {
      // Search → return flat list
      const items = await GroceryService.searchProducts(userId, productName);
      res.status(200).json(items);
    } else {
      // No filter → return grouped by category (for the main cart UI)
      const groups = await GroceryService.getGroceryList(userId);
      res.status(200).json(groups);
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products', details: String(err) });
  }
};

// GET /grocerylist/users/:userId/products/:productName
export const getProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, productName } = req.params;
    const item = await GroceryService.getProduct(userId, productName);
    if (!item) {
      res.status(404).json({ error: `Product "${productName}" not found in list` });
      return;
    }
    res.status(200).json(item);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get product', details: String(err) });
  }
};

// POST /grocerylist/users/:userId/products
export const addProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { name, quantity, unit, aisle } = req.body as {
      name: string;
      quantity: number;
      unit: string;
      aisle?: string;   // optional — if provided by client, use it; else default to 'Other'
    };

    if (!name || quantity == null || !unit) {
      res.status(400).json({ error: 'name, quantity, and unit are required' });
      return;
    }

    const newItem: IGroceryItem = {
      name: name.toLowerCase().trim(),
      quantity: Number(quantity),
      unit: unit.toLowerCase().trim(),
      category: normalizeAisle(aisle ?? ''),
    };

    const groups = await GroceryService.addProducts(userId, [newItem]);
    res.status(201).json(groups);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add product', details: String(err) });
  }
};

// POST /grocerylist/users/:userId/recipes/:recipeId/ingredients
export const importRecipeIngredients = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, recipeId } = req.params;
    const { mealPlanId } = req.body as { mealPlanId?: string };

    const groups = await GroceryService.importRecipeIngredients(userId, recipeId, mealPlanId);
    res.status(201).json(groups);
  } catch (err) {
    res.status(500).json({ error: 'Failed to import recipe ingredients', details: String(err) });
  }
};

// DELETE /grocerylist/users/:userId/products/:productName
export const removeProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, productName } = req.params;
    const groups = await GroceryService.removeProduct(userId, productName);
    res.status(200).json(groups);
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove product', details: String(err) });
  }
};

// DELETE /grocerylist/users/:userId/products
export const clearGroceryList = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    await GroceryService.clearGroceryList(userId);
    res.status(200).json({ message: 'Grocery list cleared' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear grocery list', details: String(err) });
  }
};
