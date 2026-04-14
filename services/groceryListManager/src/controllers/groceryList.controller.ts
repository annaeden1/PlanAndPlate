import { Request, Response } from 'express';
import * as GroceryService from '../services/groceryList.service';
import { GroceryItem } from '../types/groceryList.types';
import { normalizeAisle } from '../types/categories';

export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const groups = await GroceryService.getGroceryList(userId);
    res.status(200).json(groups);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products', details: String(err) });
  }
};

export const searchProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { name } = req.query as { name?: string };

    if (!name) {
      res.status(400).json({ error: 'Query parameter "name" is required' });
      return;
    }

    const items = await GroceryService.searchProducts(userId, name);
    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to search products', details: String(err) });
  }
};

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

export const addProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { name, quantity, unit, aisle } = req.body as {
      name: string;
      quantity: number;
      unit: string;
      aisle?: string;
    };

    if (!name || quantity == null || !unit) {
      res.status(400).json({ error: 'name, quantity, and unit are required' });
      return;
    }

    const newItem: GroceryItem = {
      name: name.toLowerCase().trim(),
      quantity: Number(quantity),
      unit: unit.toLowerCase().trim(),
      category: normalizeAisle(aisle ?? ''),
      inventoryQuantity: 0,
      checked: false,
    };

    const groups = await GroceryService.addProducts(userId, [newItem]);
    res.status(201).json(groups);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add product', details: String(err) });
  }
};

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

export const removeProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, productName } = req.params;
    const groups = await GroceryService.removeProduct(userId, productName);
    res.status(200).json(groups);
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove product', details: String(err) });
  }
};

export const removeBoughtItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { names } = req.body as { names?: string[] };

    if (!Array.isArray(names) || names.length === 0) {
      res.status(400).json({ error: 'names must be a non-empty array' });
      return;
    }

    const groups = await GroceryService.removeBoughtItems(userId, names);
    res.status(200).json(groups);
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove bought items', details: String(err) });
  }
};

export const toggleItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, productName } = req.params;
    const groups = await GroceryService.toggleItem(userId, productName);
    res.status(200).json(groups);
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle item', details: String(err) });
  }
};

export const clearGroceryList = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    await GroceryService.clearGroceryList(userId);
    res.status(200).json({ message: 'Grocery list cleared' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear grocery list', details: String(err) });
  }
};
