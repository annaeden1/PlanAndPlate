import { Request, Response } from 'express';
import * as GroceryController from '../../controllers/groceryList.controller';
import * as GroceryService from '../../services/groceryList.service';
import * as CategoriesConfig from '../../types/categories';
import { Category } from '../../types/categories';
import { GroceryItemGroup } from '../../types/groceryList.types';

jest.mock('../../services/groceryList.service');
jest.mock('../../types/categories');

const mockedService = GroceryService as jest.Mocked<typeof GroceryService>;
const mockedCategories = CategoriesConfig as jest.Mocked<typeof CategoriesConfig>;

const mockRes = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

describe('GroceryList Controller - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedCategories.normalizeAisle.mockReturnValue('Other');
  });

  describe('getAllProducts', () => {
    it('returns grouped list (200)', async () => {
      const mockGroups: GroceryItemGroup[] = [
        { category: 'Produce' as Category, count: 1, items: [{ name: 'apple', quantity: 1, unit: 'piece', category: 'Produce' as Category }] },
      ];
      mockedService.getGroceryList.mockResolvedValue(mockGroups);

      const req = { params: { userId: 'user1' } } as unknown as Request;
      const res = mockRes();

      await GroceryController.getAllProducts(req, res);

      expect(mockedService.getGroceryList).toHaveBeenCalledWith('user1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockGroups);
    });

    it('returns 500 when service throws', async () => {
      mockedService.getGroceryList.mockRejectedValue(new Error('DB error'));

      const req = { params: { userId: 'user1' } } as unknown as Request;
      const res = mockRes();

      await GroceryController.getAllProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('searchProducts', () => {
    it('returns flat list (200) when q query is provided', async () => {
      const mockItems = [{ name: 'apple', quantity: 1, unit: 'piece', category: 'Produce' as Category }];
      mockedService.searchProducts.mockResolvedValue(mockItems);

      const req = { params: { userId: 'user1' }, query: { q: 'app' } } as unknown as Request;
      const res = mockRes();

      await GroceryController.searchProducts(req, res);

      expect(mockedService.searchProducts).toHaveBeenCalledWith('user1', 'app');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockItems);
    });

    it('returns 400 when q query is missing', async () => {
      const req = { params: { userId: 'user1' }, query: {} } as unknown as Request;
      const res = mockRes();

      await GroceryController.searchProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 500 when service throws', async () => {
      mockedService.searchProducts.mockRejectedValue(new Error('DB error'));

      const req = { params: { userId: 'user1' }, query: { q: 'app' } } as unknown as Request;
      const res = mockRes();

      await GroceryController.searchProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getProduct', () => {
    it('returns product (200) when found', async () => {
      const mockItem = { name: 'milk', quantity: 2, unit: 'l', category: 'Dairy' as Category };
      mockedService.getProduct.mockResolvedValue(mockItem);

      const req = { params: { userId: 'user1', productName: 'milk' } } as unknown as Request;
      const res = mockRes();

      await GroceryController.getProduct(req, res);

      expect(mockedService.getProduct).toHaveBeenCalledWith('user1', 'milk');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockItem);
    });

    it('returns 404 when product not found', async () => {
      mockedService.getProduct.mockResolvedValue(null);

      const req = { params: { userId: 'user1', productName: 'unicorn' } } as unknown as Request;
      const res = mockRes();

      await GroceryController.getProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 500 when service throws', async () => {
      mockedService.getProduct.mockRejectedValue(new Error('DB error'));

      const req = { params: { userId: 'user1', productName: 'milk' } } as unknown as Request;
      const res = mockRes();

      await GroceryController.getProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('addProduct', () => {
    it('returns 400 when name is missing', async () => {
      const req = { params: { userId: 'user1' }, body: { quantity: 2, unit: 'kg' } } as unknown as Request;
      const res = mockRes();

      await GroceryController.addProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockedService.addProducts).not.toHaveBeenCalled();
    });

    it('returns 400 when quantity is missing', async () => {
      const req = { params: { userId: 'user1' }, body: { name: 'milk', unit: 'l' } } as unknown as Request;
      const res = mockRes();

      await GroceryController.addProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockedService.addProducts).not.toHaveBeenCalled();
    });

    it('returns 400 when unit is missing', async () => {
      const req = { params: { userId: 'user1' }, body: { name: 'milk', quantity: 2 } } as unknown as Request;
      const res = mockRes();

      await GroceryController.addProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockedService.addProducts).not.toHaveBeenCalled();
    });

    it('normalizes name/unit to lowercase and adds product (201)', async () => {
      const mockGroups: GroceryItemGroup[] = [{ category: 'Dairy' as Category, count: 1, items: [{ name: 'milk', quantity: 2, unit: 'l', category: 'Dairy' as Category }] }];
      mockedService.addProducts.mockResolvedValue(mockGroups);
      mockedCategories.normalizeAisle.mockReturnValue('Dairy');

      const req = {
        params: { userId: 'user1' },
        body: { name: 'MILK', quantity: 2, unit: 'L', aisle: 'dairy' },
      } as unknown as Request;
      const res = mockRes();

      await GroceryController.addProduct(req, res);

      expect(mockedService.addProducts).toHaveBeenCalledWith('user1', [
        { name: 'milk', quantity: 2, unit: 'l', category: 'Dairy' },
      ]);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockGroups);
    });

    it('calls normalizeAisle with empty string when aisle is not provided', async () => {
      mockedService.addProducts.mockResolvedValue([]);

      const req = {
        params: { userId: 'user1' },
        body: { name: 'item', quantity: 1, unit: 'piece' },
      } as unknown as Request;
      const res = mockRes();

      await GroceryController.addProduct(req, res);

      expect(mockedCategories.normalizeAisle).toHaveBeenCalledWith('');
    });

    it('returns 500 when service throws', async () => {
      mockedService.addProducts.mockRejectedValue(new Error('DB error'));

      const req = {
        params: { userId: 'user1' },
        body: { name: 'milk', quantity: 2, unit: 'l' },
      } as unknown as Request;
      const res = mockRes();

      await GroceryController.addProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('importRecipeIngredients', () => {
    it('imports ingredients and returns 201', async () => {
      const mockGroups: GroceryItemGroup[] = [
        { category: 'Produce' as Category, count: 1, items: [{ name: 'basil', quantity: 2, unit: 'leaf', category: 'Produce' as Category }] },
      ];
      mockedService.importRecipeIngredients.mockResolvedValue(mockGroups);

      const req = {
        params: { userId: 'user1', recipeId: 'recipe123' },
        body: { mealPlanId: 'plan456' },
      } as unknown as Request;
      const res = mockRes();

      await GroceryController.importRecipeIngredients(req, res);

      expect(mockedService.importRecipeIngredients).toHaveBeenCalledWith('user1', 'recipe123', 'plan456');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockGroups);
    });

    it('passes undefined mealPlanId when not in body', async () => {
      mockedService.importRecipeIngredients.mockResolvedValue([]);

      const req = {
        params: { userId: 'user1', recipeId: 'recipe123' },
        body: {},
      } as unknown as Request;
      const res = mockRes();

      await GroceryController.importRecipeIngredients(req, res);

      expect(mockedService.importRecipeIngredients).toHaveBeenCalledWith('user1', 'recipe123', undefined);
    });

    it('returns 500 when service throws', async () => {
      mockedService.importRecipeIngredients.mockRejectedValue(new Error('Spoonacular error'));

      const req = {
        params: { userId: 'user1', recipeId: 'recipe123' },
        body: {},
      } as unknown as Request;
      const res = mockRes();

      await GroceryController.importRecipeIngredients(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('removeProduct', () => {
    it('removes product and returns 200 with updated list', async () => {
      const mockGroups: GroceryItemGroup[] = [
        { category: 'Dairy' as Category, count: 1, items: [{ name: 'cheese', quantity: 1, unit: 'block', category: 'Dairy' as Category }] },
      ];
      mockedService.removeProduct.mockResolvedValue(mockGroups);

      const req = { params: { userId: 'user1', productName: 'milk' } } as unknown as Request;
      const res = mockRes();

      await GroceryController.removeProduct(req, res);

      expect(mockedService.removeProduct).toHaveBeenCalledWith('user1', 'milk');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockGroups);
    });

    it('returns 500 when service throws', async () => {
      mockedService.removeProduct.mockRejectedValue(new Error('DB error'));

      const req = { params: { userId: 'user1', productName: 'milk' } } as unknown as Request;
      const res = mockRes();

      await GroceryController.removeProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('clearGroceryList', () => {
    it('clears list and returns 200 with success message', async () => {
      mockedService.clearGroceryList.mockResolvedValue(undefined);

      const req = { params: { userId: 'user1' } } as unknown as Request;
      const res = mockRes();

      await GroceryController.clearGroceryList(req, res);

      expect(mockedService.clearGroceryList).toHaveBeenCalledWith('user1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Grocery list cleared' });
    });

    it('returns 500 when service throws', async () => {
      mockedService.clearGroceryList.mockRejectedValue(new Error('DB error'));

      const req = { params: { userId: 'user1' } } as unknown as Request;
      const res = mockRes();

      await GroceryController.clearGroceryList(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
