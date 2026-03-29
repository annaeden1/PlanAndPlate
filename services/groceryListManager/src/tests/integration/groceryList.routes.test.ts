import request from 'supertest';
import mongoose from 'mongoose';
import { Express } from 'express';
import axios from 'axios';
import { initApp } from '../../index';
import { GroceryList } from '../../models/groceryList.model';

jest.mock('axios');
const mockedAxios = jest.mocked(axios);

const TEST_USER_ID = 'test-user-123';

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
    it('returns 400 when q query is missing', async () => {
      const res = await request(app).get(`/grocerylist/users/${TEST_USER_ID}/products/search`);
      expect(res.status).toBe(400);
    });

    it('filters products by name when q query is provided', async () => {
      await request(app).post(`/grocerylist/users/${TEST_USER_ID}/products`).send({ name: 'apple', quantity: 3, unit: 'piece' });
      await request(app).post(`/grocerylist/users/${TEST_USER_ID}/products`).send({ name: 'banana', quantity: 5, unit: 'piece' });

      const res = await request(app).get(`/grocerylist/users/${TEST_USER_ID}/products/search?q=app`);
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

  describe('POST /grocerylist/users/:userId/recipes/:recipeId/ingredients', () => {
    it('imports ingredients from Spoonacular into the grocery list', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          extendedIngredients: [
            { name: 'basil', amount: 2, unit: 'leaves', aisle: 'Produce' },
            { name: 'mozzarella', amount: 200, unit: 'g', aisle: 'Cheese' },
          ]
        }
      });

      const res = await request(app).post(`/grocerylist/users/${TEST_USER_ID}/recipes/123/ingredients`).send({});
      if (res.status !== 201) console.error('Spoonacular test error:', res.body);
      expect(res.status).toBe(201);
      expect(res.body).toHaveLength(2);
      
      const produceGroup = res.body.find((g: any) => g.category === 'Produce');
      expect(produceGroup.items[0].name).toBe('basil');
      
      const dairyGroup = res.body.find((g: any) => g.category === 'Dairy');
      expect(dairyGroup.items[0].name).toBe('mozzarella');
      expect(dairyGroup.items[0].quantity).toBe(200);

      expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('api.spoonacular.com/recipes/123/information'));
    });
  });

});
