import { mergeIngredients, groupByCategory, updateInventoryQuantity } from '../../services/groceryList.service';
import { GroceryItem, GroceryItemGroup } from '../../types/groceryList.types';
import { NotFoundError } from '../../types/errors';
import { GroceryList } from '../../models/groceryList.model';

jest.mock('../../models/groceryList.model');

const mockedGroceryList = GroceryList as jest.Mocked<typeof GroceryList>;

describe('GroceryList Service - Unit Tests', () => {
  
  describe('mergeIngredients', () => {
    it('returns empty array when given empty array', () => {
      expect(mergeIngredients([])).toEqual([]);
    });

    it('sums quantities of items with the same name and unit', () => {
      const items: any[] = [
        { name: 'onion', quantity: 2, unit: 'piece', category: 'Produce' },
        { name: 'onion', quantity: 3, unit: 'piece', category: 'Produce' }
      ];
      
      const merged = mergeIngredients(items);
      expect(merged).toHaveLength(1);
      expect(merged[0]).toEqual(expect.objectContaining({ name: 'onion', quantity: 5, unit: 'piece', category: 'Produce' }));
    });

    it('keeps items separate if they have different units', () => {
      const items: any[] = [
        { name: 'onion', quantity: 2, unit: 'piece', category: 'Produce' },
        { name: 'onion', quantity: 500, unit: 'g', category: 'Produce' }
      ];
      
      const merged = mergeIngredients(items);
      expect(merged).toHaveLength(2);
    });

    it('normalizes name casing before merging', () => {
      const items: any[] = [
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
      const items: any[] = [
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
      const items: any[] = [
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
      const items: any[] = [
        { name: 'steak', quantity: 1, unit: 'piece', category: 'Meat' },
        { name: 'apple', quantity: 1, unit: 'piece', category: 'Produce' },
        { name: 'milk', quantity: 1, unit: 'l', category: 'Dairy' }
      ];

      const groups = groupByCategory(items);

      expect(groups.map(g => g.category)).toEqual(['Dairy', 'Meat', 'Produce']);
    });

    it('count field matches the number of items in each group', () => {
      const items: any[] = [
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
      const items: any[] = [
        { name: 'salmon', quantity: 2, unit: 'fillet', category: 'Seafood' },
      ];

      const groups = groupByCategory(items);

      expect(groups).toHaveLength(1);
      expect(groups[0].category).toBe('Seafood');
      expect(groups[0].count).toBe(1);
    });

    it('preserves all item fields in the grouped output', () => {
      const item: any = { name: 'pasta', quantity: 500, unit: 'g', category: 'Pasta and Rice' };
      const groups = groupByCategory([item]);

      expect(groups[0].items[0]).toEqual(item);
    });
  });

  describe('mergeIngredients — additional edge cases', () => {
    it('does not mutate the original array', () => {
      const items: any[] = [
        { name: 'salt', quantity: 1, unit: 'tsp', category: 'Spices and Seasonings' },
      ];
      const copy = [...items];
      mergeIngredients(items);
      expect(items).toEqual(copy);
    });

    it('handles a single item with no duplicates', () => {
      const items: any[] = [
        { name: 'garlic', quantity: 3, unit: 'clove', category: 'Produce' },
      ];
      const merged = mergeIngredients(items);
      expect(merged).toHaveLength(1);
      expect(merged[0].quantity).toBe(3);
    });

    it('treats items with completely different names as separate', () => {
      const items: any[] = [
        { name: 'butter', quantity: 100, unit: 'g', category: 'Dairy' },
        { name: 'cream', quantity: 200, unit: 'g', category: 'Dairy' },
        { name: 'cheese', quantity: 150, unit: 'g', category: 'Dairy' },
      ];
      const merged = mergeIngredients(items);
      expect(merged).toHaveLength(3);
    });

    it('merges tablespoon aliases (tbsp, tablespoon, tablespoons) into one entry', () => {
      const items: any[] = [
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
      const items: any[] = [
        { name: 'tomato', quantity: 2, unit: 'can', category: 'Canned and Jarred' },
        { name: 'tomato', quantity: 3, unit: 'piece', category: 'Produce' },
      ];
      const merged = mergeIngredients(items);
      expect(merged).toHaveLength(2);
    });

    it('uses the category from the first occurrence when merging', () => {
      const items: any[] = [
        { name: 'egg', quantity: 2, unit: 'piece', category: 'Dairy' },
        { name: 'egg', quantity: 4, unit: 'piece', category: 'Other' },
      ];
      const merged = mergeIngredients(items);
      expect(merged).toHaveLength(1);
      expect(merged[0].category).toBe('Dairy');
    });
  });

});

describe('updateInventoryQuantity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sets inventoryQuantity and returns grouped list', async () => {
    const mockItem = { name: 'milk', quantity: 2, unit: 'l', category: 'Dairy', inventoryQuantity: 0, checked: false };
    const mockList = { items: [mockItem], save: jest.fn().mockResolvedValue(undefined) };
    mockedGroceryList.findOne.mockResolvedValue(mockList as any);

    const result = await updateInventoryQuantity('user1', 'milk', 1);

    expect(mockItem.inventoryQuantity).toBe(1);
    expect(mockList.save).toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe('Dairy');
  });

  it('normalizes productName before lookup', async () => {
    const mockItem = { name: 'milk', quantity: 2, unit: 'l', category: 'Dairy', inventoryQuantity: 0, checked: false };
    const mockList = { items: [mockItem], save: jest.fn().mockResolvedValue(undefined) };
    mockedGroceryList.findOne.mockResolvedValue(mockList as any);

    await updateInventoryQuantity('user1', '  MILK  ', 3);

    expect(mockItem.inventoryQuantity).toBe(3);
  });

  it('throws NotFoundError when grocery list does not exist', async () => {
    mockedGroceryList.findOne.mockResolvedValue(null);

    await expect(updateInventoryQuantity('ghost', 'milk', 1)).rejects.toThrow(NotFoundError);
    await expect(updateInventoryQuantity('ghost', 'milk', 1)).rejects.toThrow('Grocery list not found');
  });

  it('throws NotFoundError when product not in list', async () => {
    const mockList = { items: [], save: jest.fn() };
    mockedGroceryList.findOne.mockResolvedValue(mockList as any);

    await expect(updateInventoryQuantity('user1', 'unicorn', 1)).rejects.toThrow(NotFoundError);
  });
});
