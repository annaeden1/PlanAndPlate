import { mergeIngredients, groupByCategory } from '../../services/groceryList.service';
import { GroceryItem, GroceryItemGroup } from '../../types/groceryList.types';

describe('GroceryList Service - Unit Tests', () => {
  
  describe('mergeIngredients', () => {
    it('returns empty array when given empty array', () => {
      expect(mergeIngredients([])).toEqual([]);
    });

    it('sums quantities of items with the same name and unit', () => {
      const items: GroceryItem[] = [
        { name: 'onion', quantity: 2, unit: 'piece', category: 'Produce' },
        { name: 'onion', quantity: 3, unit: 'piece', category: 'Produce' }
      ];
      
      const merged = mergeIngredients(items);
      expect(merged).toHaveLength(1);
      expect(merged[0]).toEqual({ name: 'onion', quantity: 5, unit: 'piece', category: 'Produce' });
    });

    it('keeps items separate if they have different units', () => {
      const items: GroceryItem[] = [
        { name: 'onion', quantity: 2, unit: 'piece', category: 'Produce' },
        { name: 'onion', quantity: 500, unit: 'g', category: 'Produce' }
      ];
      
      const merged = mergeIngredients(items);
      expect(merged).toHaveLength(2);
    });

    it('normalizes name casing before merging', () => {
      const items: GroceryItem[] = [
        { name: 'Tomato', quantity: 1, unit: 'piece', category: 'Produce' },
        { name: 'tomato ', quantity: 2, unit: 'piece', category: 'Produce' },
        { name: ' TOMATO', quantity: 3, unit: 'piece', category: 'Produce' }
      ];
      
      const merged = mergeIngredients(items);
      expect(merged).toHaveLength(1);
      expect(merged[0].quantity).toBe(6);
      expect(merged[0].name).toBe('tomato');
    });

    it('collapses unit aliases', () => {
      const items: GroceryItem[] = [
        { name: 'flour', quantity: 100, unit: 'g', category: 'Baking' },
        { name: 'flour', quantity: 200, unit: 'grams', category: 'Baking' },
        { name: 'flour', quantity: 50, unit: 'gram', category: 'Baking' }
      ];
      
      const merged = mergeIngredients(items);
      expect(merged).toHaveLength(1);
      expect(merged[0].quantity).toBe(350);
      expect(merged[0].unit).toBe('g');
    });
  });

  describe('groupByCategory', () => {
    it('returns empty array when given empty array', () => {
      expect(groupByCategory([])).toEqual([]);
    });

    it('groups items correctly according to their category', () => {
      const items: GroceryItem[] = [
        { name: 'milk', quantity: 1, unit: 'l', category: 'Dairy' },
        { name: 'cheese', quantity: 200, unit: 'g', category: 'Dairy' },
        { name: 'apple', quantity: 3, unit: 'piece', category: 'Produce' }
      ];

      const groups = groupByCategory(items);

      expect(groups).toHaveLength(2);

      const dairyGroup = groups.find(g => g.category === 'Dairy');
      expect(dairyGroup).toBeDefined();
      expect(dairyGroup?.count).toBe(2);
      expect(dairyGroup?.items).toHaveLength(2);

      const produceGroup = groups.find(g => g.category === 'Produce');
      expect(produceGroup).toBeDefined();
      expect(produceGroup?.count).toBe(1);
    });

    it('sorts the resulting groups alphabetically by category name', () => {
      const items: GroceryItem[] = [
        { name: 'steak', quantity: 1, unit: 'piece', category: 'Meat' },
        { name: 'apple', quantity: 1, unit: 'piece', category: 'Produce' },
        { name: 'milk', quantity: 1, unit: 'l', category: 'Dairy' }
      ];

      const groups = groupByCategory(items);

      expect(groups.map(g => g.category)).toEqual(['Dairy', 'Meat', 'Produce']);
    });

    it('count field matches the number of items in each group', () => {
      const items: GroceryItem[] = [
        { name: 'chicken', quantity: 1, unit: 'kg', category: 'Poultry' },
        { name: 'turkey', quantity: 2, unit: 'kg', category: 'Poultry' },
        { name: 'duck', quantity: 1, unit: 'piece', category: 'Poultry' },
      ];

      const groups = groupByCategory(items);

      expect(groups).toHaveLength(1);
      expect(groups[0].count).toBe(3);
      expect(groups[0].items).toHaveLength(3);
    });

    it('handles a single item in its own group', () => {
      const items: GroceryItem[] = [
        { name: 'salmon', quantity: 2, unit: 'fillet', category: 'Seafood' },
      ];

      const groups = groupByCategory(items);

      expect(groups).toHaveLength(1);
      expect(groups[0].category).toBe('Seafood');
      expect(groups[0].count).toBe(1);
    });

    it('preserves all item fields in the grouped output', () => {
      const item: GroceryItem = { name: 'pasta', quantity: 500, unit: 'g', category: 'Pasta and Rice' };
      const groups = groupByCategory([item]);

      expect(groups[0].items[0]).toEqual(item);
    });
  });

  describe('mergeIngredients — additional edge cases', () => {
    it('does not mutate the original array', () => {
      const items: GroceryItem[] = [
        { name: 'salt', quantity: 1, unit: 'tsp', category: 'Spices and Seasonings' },
      ];
      const copy = [...items];
      mergeIngredients(items);
      expect(items).toEqual(copy);
    });

    it('handles a single item with no duplicates', () => {
      const items: GroceryItem[] = [
        { name: 'garlic', quantity: 3, unit: 'clove', category: 'Produce' },
      ];
      const merged = mergeIngredients(items);
      expect(merged).toHaveLength(1);
      expect(merged[0].quantity).toBe(3);
    });

    it('treats items with completely different names as separate', () => {
      const items: GroceryItem[] = [
        { name: 'butter', quantity: 100, unit: 'g', category: 'Dairy' },
        { name: 'cream', quantity: 200, unit: 'g', category: 'Dairy' },
        { name: 'cheese', quantity: 150, unit: 'g', category: 'Dairy' },
      ];
      const merged = mergeIngredients(items);
      expect(merged).toHaveLength(3);
    });

    it('merges tablespoon aliases (tbsp, tablespoon, tablespoons) into one entry', () => {
      const items: GroceryItem[] = [
        { name: 'olive oil', quantity: 1, unit: 'tablespoon', category: 'Oil, Vinegar, Salad Dressing' },
        { name: 'olive oil', quantity: 2, unit: 'tablespoons', category: 'Oil, Vinegar, Salad Dressing' },
        { name: 'olive oil', quantity: 1, unit: 'tbsp', category: 'Oil, Vinegar, Salad Dressing' },
      ];
      const merged = mergeIngredients(items);
      expect(merged).toHaveLength(1);
      expect(merged[0].quantity).toBe(4);
      expect(merged[0].unit).toBe('tbsp');
    });

    it('keeps can and piece as separate units for the same ingredient', () => {
      const items: GroceryItem[] = [
        { name: 'tomato', quantity: 2, unit: 'can', category: 'Canned and Jarred' },
        { name: 'tomato', quantity: 3, unit: 'piece', category: 'Produce' },
      ];
      const merged = mergeIngredients(items);
      expect(merged).toHaveLength(2);
    });

    it('uses the category from the first occurrence when merging', () => {
      const items: GroceryItem[] = [
        { name: 'egg', quantity: 2, unit: 'piece', category: 'Dairy' },
        { name: 'egg', quantity: 4, unit: 'piece', category: 'Other' },
      ];
      const merged = mergeIngredients(items);
      expect(merged).toHaveLength(1);
      expect(merged[0].category).toBe('Dairy');
    });
  });

});
