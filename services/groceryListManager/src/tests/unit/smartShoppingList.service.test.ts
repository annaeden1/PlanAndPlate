import {
  aggregateRequirements,
  applyInventory,
  generateSmartShoppingList,
} from '../../services/smartShoppingList.service';
import { SpoonacularRecipeInput } from '../../types/smartShoppingList.types';

const mockResolve = jest.fn();
jest.mock('../../services/marketMapping.service', () => ({
  resolveMarketPackages: (...args: unknown[]) => mockResolve(...args),
}));

describe('Smart Shopping List Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('aggregateRequirements', () => {
    it('sums identical ingredients across recipes', () => {
      const recipes: SpoonacularRecipeInput[] = [
        {
          recipeId: 'r1',
          ingredients: [{ name: 'Onion', amount: 2, unit: 'piece', aisle: 'produce' }],
        },
        {
          recipeId: 'r2',
          ingredients: [{ name: 'onion', amount: 3, unit: 'piece', aisle: 'produce' }],
        },
      ];
      const out = aggregateRequirements(recipes);
      expect(out.get('onion::piece')!.totalRequired).toBe(5);
    });

    it('keeps separate entries when units differ', () => {
      const recipes: SpoonacularRecipeInput[] = [
        {
          recipeId: 'r1',
          ingredients: [
            { name: 'flour', amount: 200, unit: 'g' },
            { name: 'flour', amount: 1, unit: 'cup' },
          ],
        },
      ];
      const out = aggregateRequirements(recipes);
      expect(out.size).toBe(2);
    });

    it('scales by servings ratio', () => {
      const recipes: SpoonacularRecipeInput[] = [
        {
          recipeId: 'r1',
          servingsOriginal: 2,
          servingsPlanned: 4,
          ingredients: [{ name: 'rice', amount: 100, unit: 'g' }],
        },
      ];
      const out = aggregateRequirements(recipes);
      expect(out.get('rice::g')!.totalRequired).toBe(200);
    });
  });

  describe('applyInventory', () => {
    it('computes deficit when inventory partially covers', () => {
      const required = aggregateRequirements([
        {
          recipeId: 'r1',
          ingredients: [{ name: 'tortilla', amount: 5, unit: 'piece' }],
        },
      ]);
      const out = applyInventory(required, [
        { name: 'tortilla', quantity: 4, unit: 'piece' },
      ]);
      expect(out[0].deficit).toBe(1);
    });

    it('zero deficit when inventory fully covers', () => {
      const required = aggregateRequirements([
        {
          recipeId: 'r1',
          ingredients: [{ name: 'tortilla', amount: 3, unit: 'piece' }],
        },
      ]);
      const out = applyInventory(required, [
        { name: 'tortilla', quantity: 4, unit: 'piece' },
      ]);
      expect(out[0].deficit).toBe(0);
    });
  });

  describe('generateSmartShoppingList — leftover math', () => {
    it('skips Gemini when inventory covers everything', async () => {
      const result = await generateSmartShoppingList(
        [
          {
            recipeId: 'r1',
            ingredients: [{ name: 'tortilla', amount: 3, unit: 'piece' }],
          },
        ],
        [{ name: 'tortilla', quantity: 4, unit: 'piece' }],
      );
      expect(result.toBuy).toHaveLength(0);
      expect(result.alreadyCovered).toHaveLength(1);
      expect(result.projectedInventory[0].quantity).toBe(1);
      expect(mockResolve).toHaveBeenCalledWith([]);
    });

    it('tortilla example: had 4, need 5 -> buy 1 pack of 6 -> leftover 5', async () => {
      mockResolve.mockResolvedValue(
        new Map([
          [
            'tortilla::piece',
            {
              name: 'tortilla',
              marketUnit: 'pack',
              marketQuantity: 1,
              marketSize: '6 pieces',
              marketSizeInRecipeUnits: 6,
            },
          ],
        ]),
      );

      const result = await generateSmartShoppingList(
        [
          {
            recipeId: 'r1',
            ingredients: [{ name: 'tortilla', amount: 5, unit: 'piece' }],
          },
        ],
        [{ name: 'tortilla', quantity: 4, unit: 'piece' }],
      );

      expect(result.toBuy).toHaveLength(1);
      const line = result.toBuy[0];
      expect(line.deficit).toBe(1);
      expect(line.marketQuantity).toBe(1);
      expect(line.totalAfterPurchase).toBe(10);
      expect(line.leftoverAfterCooking).toBe(5);
      expect(result.projectedInventory.find((i) => i.name === 'tortilla')!.quantity).toBe(5);
    });

    it('rounds up packages when deficit exceeds one unit', async () => {
      mockResolve.mockResolvedValue(
        new Map([
          [
            'chicken breast::g',
            {
              name: 'chicken breast',
              marketUnit: 'pack',
              marketQuantity: 1,
              marketSize: '500g',
              marketSizeInRecipeUnits: 500,
            },
          ],
        ]),
      );

      const result = await generateSmartShoppingList(
        [
          {
            recipeId: 'r1',
            ingredients: [{ name: 'chicken breast', amount: 1200, unit: 'g' }],
          },
        ],
        [],
      );

      const line = result.toBuy[0];
      expect(line.deficit).toBe(1200);
      expect(line.marketQuantity).toBe(3);
      expect(line.totalAfterPurchase).toBe(1500);
      expect(line.leftoverAfterCooking).toBe(300);
    });

    it('falls back to deficit when mapping unresolved', async () => {
      mockResolve.mockResolvedValue(
        new Map([
          [
            'mystery::piece',
            {
              name: 'mystery',
              marketUnit: null,
              marketQuantity: null,
              marketSize: null,
              marketSizeInRecipeUnits: null,
            },
          ],
        ]),
      );

      const result = await generateSmartShoppingList(
        [
          {
            recipeId: 'r1',
            ingredients: [{ name: 'mystery', amount: 2, unit: 'piece' }],
          },
        ],
        [],
      );

      const line = result.toBuy[0];
      expect(line.marketQuantity).toBe(1);
      expect(line.marketUnit).toBeNull();
      expect(line.totalAfterPurchase).toBe(2);
      expect(line.leftoverAfterCooking).toBe(0);
    });
  });
});
