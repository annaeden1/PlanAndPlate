import request from 'supertest';
import mongoose from 'mongoose';
import { Express } from 'express';

// Bypass JWT auth for integration routing tests — auth is covered by its own unit test.
jest.mock('../../middlewares/auth.middleware', () => ({
  __esModule: true,
  default: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

import { initApp } from '../../index';
import { GroceryList } from '../../models/groceryList.model';
import { Recipe } from '../../models/recipe.model';

// userId is an ObjectId in the schema, so the test user must be a valid ObjectId.
const TEST_USER_ID = new mongoose.Types.ObjectId().toString();

describe('GroceryList API - Integration Tests', () => {
  let app: Express;

  beforeAll(async () => {
    process.env.SPOONACULAR_API_KEY = 'test-key';
    app = await initApp();
  });

  afterEach(async () => {
    await GroceryList.deleteMany({ userId: TEST_USER_ID });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /grocerylist/users/:userId/products', () => {
    it('returns empty array when list is empty', async () => {
      const res = await request(app).get(`/grocerylist/users/${TEST_USER_ID}/products`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns grouped list when products exist', async () => {
      await request(app)
        .post(`/grocerylist/users/${TEST_USER_ID}/products`)
        .send({ name: 'milk', quantity: 2, unit: 'l', aisle: 'dairy' });

      const res = await request(app).get(`/grocerylist/users/${TEST_USER_ID}/products`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].category).toBe('Dairy');
      expect(res.body[0].items).toHaveLength(1);
      expect(res.body[0].items[0].name).toBe('milk');
    });
  });

  describe('GET /grocerylist/users/:userId/products/search', () => {
    it('returns 400 when the name query is missing', async () => {
      const res = await request(app).get(`/grocerylist/users/${TEST_USER_ID}/products/search`);
      expect(res.status).toBe(400);
    });

    it('filters products by name when the name query is provided', async () => {
      await request(app).post(`/grocerylist/users/${TEST_USER_ID}/products`).send({ name: 'apple', quantity: 3, unit: 'piece' });
      await request(app).post(`/grocerylist/users/${TEST_USER_ID}/products`).send({ name: 'banana', quantity: 5, unit: 'piece' });

      const res = await request(app).get(`/grocerylist/users/${TEST_USER_ID}/products/search?name=app`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('apple');
    });
  });

  describe('POST /grocerylist/users/:userId/products', () => {
    it('returns 400 if required fields are missing', async () => {
      const res = await request(app)
        .post(`/grocerylist/users/${TEST_USER_ID}/products`)
        .send({ name: 'milk' });

      expect(res.status).toBe(400);
    });

    it('adds a product and returns grouped list', async () => {
      const res = await request(app)
        .post(`/grocerylist/users/${TEST_USER_ID}/products`)
        .send({ name: 'tomato', quantity: 4, unit: 'piece', aisle: 'produce' });

      expect(res.status).toBe(201);
      expect(res.body[0].category).toBe('Produce');
      expect(res.body[0].items[0].name).toBe('tomato');
    });

    it('merges quantities when adding the same product', async () => {
      await request(app).post(`/grocerylist/users/${TEST_USER_ID}/products`).send({ name: 'egg', quantity: 6, unit: 'piece' });
      const res = await request(app).post(`/grocerylist/users/${TEST_USER_ID}/products`).send({ name: 'egg', quantity: 6, unit: 'piece' });

      expect(res.status).toBe(201);
      expect(res.body[0].items[0].quantity).toBe(12);
    });
  });

  describe('GET /grocerylist/users/:userId/products/:productName', () => {
    it('returns a specific product', async () => {
      await request(app).post(`/grocerylist/users/${TEST_USER_ID}/products`).send({ name: 'chicken', quantity: 1, unit: 'kg' });

      const res = await request(app).get(`/grocerylist/users/${TEST_USER_ID}/products/chicken`);
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('chicken');
      expect(res.body.quantity).toBe(1);
    });

    it('returns 404 if product not found', async () => {
      const res = await request(app).get(`/grocerylist/users/${TEST_USER_ID}/products/unicorn`);
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /grocerylist/users/:userId/products/:productName', () => {
    it('removes a specific product', async () => {
      await request(app).post(`/grocerylist/users/${TEST_USER_ID}/products`).send({ name: 'beef', quantity: 1, unit: 'kg' });
      await request(app).post(`/grocerylist/users/${TEST_USER_ID}/products`).send({ name: 'pork', quantity: 1, unit: 'kg' });

      const res = await request(app).delete(`/grocerylist/users/${TEST_USER_ID}/products/beef`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);

      const beefRes = await request(app).get(`/grocerylist/users/${TEST_USER_ID}/products/beef`);
      expect(beefRes.status).toBe(404);
    });
  });

  describe('DELETE /grocerylist/users/:userId/products', () => {
    it('clears the entire grocery list', async () => {
      await request(app).post(`/grocerylist/users/${TEST_USER_ID}/products`).send({ name: 'salt', quantity: 1, unit: 'kg' });

      const res = await request(app).delete(`/grocerylist/users/${TEST_USER_ID}/products`);
      expect(res.status).toBe(200);

      const listRes = await request(app).get(`/grocerylist/users/${TEST_USER_ID}/products`);
      expect(listRes.body).toEqual([]);
    });
  });

  describe('PATCH /grocerylist/users/:userId/products/:productName/inventory', () => {
    it('updates inventoryQuantity and returns 200', async () => {
      await request(app).post(`/grocerylist/users/${TEST_USER_ID}/products`).send({ name: 'milk', quantity: 2, unit: 'l', aisle: 'dairy' });

      const res = await request(app)
        .patch(`/grocerylist/users/${TEST_USER_ID}/products/milk/inventory`)
        .send({ inventoryQuantity: 1 });

      expect(res.status).toBe(200);
      const dairyGroup = res.body.find((g: { category: string }) => g.category === 'Dairy');
      expect(dairyGroup.items[0].inventoryQuantity).toBe(1);
    });

    it('returns 400 when inventoryQuantity is missing', async () => {
      const res = await request(app)
        .patch(`/grocerylist/users/${TEST_USER_ID}/products/milk/inventory`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('returns 400 when inventoryQuantity is negative', async () => {
      const res = await request(app)
        .patch(`/grocerylist/users/${TEST_USER_ID}/products/milk/inventory`)
        .send({ inventoryQuantity: -5 });

      expect(res.status).toBe(400);
    });

    it('returns 404 when product does not exist', async () => {
      const res = await request(app)
        .patch(`/grocerylist/users/${TEST_USER_ID}/products/unicorn/inventory`)
        .send({ inventoryQuantity: 1 });

      expect(res.status).toBe(404);
    });
  });

  describe('POST /grocerylist/users/:userId/recipes/:recipeId/ingredients', () => {
    let recipeId: string;

    beforeAll(async () => {
      // The service imports from the local Recipe collection (importFromRecipeDB),
      // so seed a recipe rather than mocking Spoonacular.
      const recipe = await Recipe.create({
        name: 'Caprese',
        instructions: {
          steps: [],
          ingredients: [
            { name: 'basil', amount: 2, unit: 'leaves', aisle: 'Produce' },
            { name: 'mozzarella', amount: 200, unit: 'g', aisle: 'cheese' },
          ],
        },
      });
      recipeId = (recipe._id as mongoose.Types.ObjectId).toString();
    });

    afterAll(async () => {
      await Recipe.deleteMany({ name: 'Caprese' });
    });

    it('imports ingredients from the recipe DB into the grocery list', async () => {
      const res = await request(app)
        .post(`/grocerylist/users/${TEST_USER_ID}/recipes/${recipeId}/ingredients`)
        .send({});

      expect(res.status).toBe(201);

      const allItems = res.body.flatMap((g: { items: { name: string; quantity: number }[] }) => g.items);
      const names = allItems.map((i: { name: string }) => i.name);
      expect(names).toContain('basil');
      expect(names).toContain('mozzarella');

      const mozzarella = allItems.find((i: { name: string }) => i.name === 'mozzarella');
      expect(mozzarella.quantity).toBe(200);
    });
  });
});
