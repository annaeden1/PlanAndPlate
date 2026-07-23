import {
  normalizeUnit,
  mergeIngredients,
  importFromRecipeDB,
  getGroceryList,
  searchProducts,
  getProduct,
  addProducts,
  importRecipeIngredients,
  removeProduct,
  clearGroceryList,
  removeBoughtItems,
  toggleItem,
} from '../../services/groceryList.service';
import { GroceryList } from '../../models/groceryList.model';
import { Recipe } from '../../models/recipe.model';

jest.mock('../../models/groceryList.model');
jest.mock('../../models/recipe.model');

const mockedGL = GroceryList as jest.Mocked<typeof GroceryList>;
const mockedRecipe = Recipe as jest.Mocked<typeof Recipe>;

const item = (overrides: Record<string, unknown> = {}): any => ({
  name: 'milk',
  quantity: 1,
  unit: 'l',
  category: 'Dairy',
  inventoryQuantity: 0,
  checked: false,
  recipeCount: 1,
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

describe('normalizeUnit', () => {
  it('collapses spelling/plural aliases to a canonical unit', () => {
    expect(normalizeUnit('grams')).toBe('g');
    expect(normalizeUnit('gram')).toBe('g');
    expect(normalizeUnit('tablespoons')).toBe('tbsp');
    expect(normalizeUnit('LITRE')).toBe('l');
  });

  it('lowercases and trims unmapped units without changing them', () => {
    expect(normalizeUnit('  Cup ')).toBe('cup');
    expect(normalizeUnit('fillet')).toBe('fillet');
  });

  it('returns an empty string for null/undefined units', () => {
    expect(normalizeUnit(undefined as unknown as string)).toBe('');
    expect(normalizeUnit(null as unknown as string)).toBe('');
  });
});

describe('mergeIngredients recipeCount accumulation', () => {
  it('sums defined recipeCount values when merging duplicates', () => {
    const merged = mergeIngredients([
      item({ name: 'egg', unit: 'piece', quantity: 2, recipeCount: 1 }),
      item({ name: 'egg', unit: 'piece', quantity: 3, recipeCount: 2 }),
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0].recipeCount).toBe(3);
    expect(merged[0].quantity).toBe(5);
  });
});

describe('importFromRecipeDB', () => {
  it('throws when the recipe does not exist', async () => {
    mockedRecipe.findById.mockResolvedValue(null as never);
    await expect(importFromRecipeDB('r1')).rejects.toThrow('Recipe "r1" not found');
  });

  it('throws when the recipe has no ingredients array', async () => {
    mockedRecipe.findById.mockResolvedValue({ instructions: {} } as never);
    await expect(importFromRecipeDB('r2')).rejects.toThrow('has no ingredients');
  });

  it('throws when the recipe has no instructions field at all', async () => {
    mockedRecipe.findById.mockResolvedValue({} as never);
    await expect(importFromRecipeDB('r2b')).rejects.toThrow('has no ingredients');
  });

  it('throws when the ingredients array is empty', async () => {
    mockedRecipe.findById.mockResolvedValue({
      instructions: { ingredients: [] },
    } as never);
    await expect(importFromRecipeDB('r3')).rejects.toThrow('has no ingredients');
  });

  it('maps ingredients into normalized grocery items', async () => {
    mockedRecipe.findById.mockResolvedValue({
      instructions: {
        ingredients: [
          { name: '  Onion ', amount: 2, unit: 'piece', aisle: 'Produce' },
          { name: 'Salt', amount: 1, unit: 'tsp' },
        ],
      },
    } as never);

    const result = await importFromRecipeDB('r4');

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(
      expect.objectContaining({
        name: 'onion',
        quantity: 2,
        unit: 'piece',
        inventoryQuantity: 0,
        checked: false,
        recipeCount: 1,
      }),
    );
    // Missing aisle falls back to a normalized empty aisle.
    expect(result[1].name).toBe('salt');
  });
});

describe('getGroceryList', () => {
  it('returns [] when the user has no list', async () => {
    mockedGL.findOne.mockResolvedValue(null as never);
    expect(await getGroceryList('u1')).toEqual([]);
  });

  it('returns the grouped list when it exists', async () => {
    mockedGL.findOne.mockResolvedValue({ items: [item()] } as never);
    const groups = await getGroceryList('u1');
    expect(groups).toHaveLength(1);
    expect(groups[0].category).toBe('Dairy');
  });
});

describe('searchProducts', () => {
  it('returns [] when there is no list', async () => {
    mockedGL.findOne.mockResolvedValue(null as never);
    expect(await searchProducts('u1', 'milk')).toEqual([]);
  });

  it('returns all items when no product name is given', async () => {
    const items = [item(), item({ name: 'bread', category: 'Bakery' })];
    mockedGL.findOne.mockResolvedValue({ items } as never);
    expect(await searchProducts('u1')).toBe(items);
  });

  it('filters items by (normalized) product name', async () => {
    const items = [item({ name: 'whole milk' }), item({ name: 'bread' })];
    mockedGL.findOne.mockResolvedValue({ items } as never);
    const result = await searchProducts('u1', '  MILK ');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('whole milk');
  });
});

describe('getProduct', () => {
  it('returns null when there is no list', async () => {
    mockedGL.findOne.mockResolvedValue(null as never);
    expect(await getProduct('u1', 'milk')).toBeNull();
  });

  it('returns the matching item', async () => {
    mockedGL.findOne.mockResolvedValue({ items: [item()] } as never);
    expect(await getProduct('u1', '  MILK ')).toEqual(item());
  });

  it('returns null when the item is not present', async () => {
    mockedGL.findOne.mockResolvedValue({ items: [item()] } as never);
    expect(await getProduct('u1', 'bread')).toBeNull();
  });
});

describe('addProducts', () => {
  it('merges into an existing list and returns grouped items', async () => {
    mockedGL.findOne.mockResolvedValue({ items: [item({ quantity: 1 })] } as never);
    mockedGL.findOneAndUpdate.mockResolvedValue({
      items: [item({ quantity: 3 })],
    } as never);

    const groups = await addProducts('u1', [item({ quantity: 2 })]);

    expect(mockedGL.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: 'u1' },
      { $set: { items: [expect.objectContaining({ name: 'milk', quantity: 3 })] } },
      { upsert: true, new: true },
    );
    expect(groups[0].items[0].quantity).toBe(3);
  });

  it('creates a new list when none exists', async () => {
    mockedGL.findOne.mockResolvedValue(null as never);
    mockedGL.findOneAndUpdate.mockResolvedValue({ items: [item()] } as never);

    const groups = await addProducts('u1', [item()]);
    expect(groups).toHaveLength(1);
  });
});

describe('importRecipeIngredients', () => {
  beforeEach(() => {
    mockedRecipe.findById.mockResolvedValue({
      instructions: {
        ingredients: [{ name: 'egg', amount: 2, unit: 'piece', aisle: 'Dairy' }],
      },
    } as never);
  });

  it('imports recipe ingredients into an empty list', async () => {
    mockedGL.findOne.mockResolvedValue(null as never);
    mockedGL.findOneAndUpdate.mockResolvedValue({
      items: [item({ name: 'egg', unit: 'piece' })],
    } as never);

    const groups = await importRecipeIngredients('u1', 'r1');
    expect(groups).toHaveLength(1);
    expect(mockedGL.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: 'u1' },
      { $set: expect.objectContaining({ items: expect.any(Array) }) },
      { upsert: true, new: true },
    );
  });

  it('stores mealPlanId when provided', async () => {
    mockedGL.findOne.mockResolvedValue({ items: [] } as never);
    mockedGL.findOneAndUpdate.mockResolvedValue({ items: [] } as never);

    await importRecipeIngredients('u1', 'r1', 'mp-9');

    const setArg = mockedGL.findOneAndUpdate.mock.calls[0][1] as { $set: Record<string, unknown> };
    expect(setArg.$set.mealPlanId).toBe('mp-9');
  });
});

describe('removeProduct', () => {
  it('returns the grouped list after removal', async () => {
    mockedGL.findOneAndUpdate.mockResolvedValue({ items: [item()] } as never);
    const groups = await removeProduct('u1', '  MILK ');
    expect(mockedGL.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: 'u1' },
      { $pull: { items: { name: 'milk' } } },
      { new: true },
    );
    expect(groups).toHaveLength(1);
  });

  it('returns [] when no list is returned', async () => {
    mockedGL.findOneAndUpdate.mockResolvedValue(null as never);
    expect(await removeProduct('u1', 'milk')).toEqual([]);
  });
});

describe('clearGroceryList', () => {
  it('empties the items array', async () => {
    mockedGL.findOneAndUpdate.mockResolvedValue({} as never);
    await clearGroceryList('u1');
    expect(mockedGL.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: 'u1' },
      { $set: { items: [] } },
    );
  });
});

describe('removeBoughtItems', () => {
  it('pulls the normalized names and returns the grouped list', async () => {
    mockedGL.findOneAndUpdate.mockResolvedValue({ items: [item()] } as never);
    const groups = await removeBoughtItems('u1', ['  Bread ', 'EGG']);
    expect(mockedGL.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: 'u1' },
      { $pull: { items: { name: { $in: ['bread', 'egg'] } } } },
      { new: true },
    );
    expect(groups).toHaveLength(1);
  });

  it('returns [] when no list is returned', async () => {
    mockedGL.findOneAndUpdate.mockResolvedValue(null as never);
    expect(await removeBoughtItems('u1', ['bread'])).toEqual([]);
  });
});

describe('toggleItem', () => {
  it('throws when the list does not exist', async () => {
    mockedGL.findOne.mockResolvedValue(null as never);
    await expect(toggleItem('u1', 'milk')).rejects.toThrow('Grocery list not found');
  });

  it('throws when the product is not in the list', async () => {
    mockedGL.findOne.mockResolvedValue({ items: [], save: jest.fn() } as never);
    await expect(toggleItem('u1', 'milk')).rejects.toThrow('Product "milk" not found');
  });

  it('toggles the checked flag and saves', async () => {
    const target = item({ checked: false });
    const save = jest.fn().mockResolvedValue(undefined);
    mockedGL.findOne.mockResolvedValue({ items: [target], save } as never);

    const groups = await toggleItem('u1', '  MILK ');

    expect(target.checked).toBe(true);
    expect(save).toHaveBeenCalled();
    expect(groups).toHaveLength(1);
  });
});
