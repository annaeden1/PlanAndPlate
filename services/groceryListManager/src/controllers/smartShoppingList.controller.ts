import { Request, Response } from 'express';
import { generateSmartShoppingList } from '../services/smartShoppingList.service';
import {
  InventoryEntry,
  SpoonacularRecipeInput,
} from '../types/smartShoppingList.types';

export const generateSmartList = async (req: Request, res: Response): Promise<void> => {
  try {
    const { recipes, inventory } = req.body as {
      recipes?: SpoonacularRecipeInput[];
      inventory?: InventoryEntry[];
    };

    if (!Array.isArray(recipes) || recipes.length === 0) {
      res.status(400).json({ error: 'recipes must be a non-empty array' });
      return;
    }

    const result = await generateSmartShoppingList(recipes, inventory ?? []);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate smart shopping list', details: String(err) });
  }
};
