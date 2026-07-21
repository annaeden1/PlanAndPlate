import request from 'supertest';
import mongoose from 'mongoose';
import { Express } from 'express';
import jwt from 'jsonwebtoken';
import { initApp } from '../../index';
import * as priceComparisonService from '../../services/priceComparison/priceComparison.service';
import { NotFoundError } from '../../types/errors';

jest.mock('../../services/priceComparison/priceComparison.service');

const mockedService = priceComparisonService as jest.Mocked<
  typeof priceComparisonService
>;

const TEST_USER_ID = 'u1';
const token = jwt.sign(
  { userId: TEST_USER_ID },
  process.env.JWT_SECRET || 'secretkey',
);

describe('GET /grocerylist/users/:userId/price-comparison', () => {
  let app: Express;

  beforeAll(async () => {
    app = await initApp();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(() => jest.resetAllMocks());

  it('returns 401 without a token', async () => {
    const res = await request(app).get(
      `/grocerylist/users/${TEST_USER_ID}/price-comparison`,
    );
    expect(res.status).toBe(401);
  });

  it('returns 200 with the ranked comparison result', async () => {
    mockedService.comparePrices.mockResolvedValue({
      currency: 'ILS',
      chains: [
        {
          chain: 'rami-levy',
          displayName: 'רמי לוי',
          items: [],
          missing: ['milk'],
          subtotal: 0,
          estimatedDelivery: 35.9,
          total: 35.9,
        },
      ],
      pricesAsOf: '2026-07-13T00:00:00.000Z',
      disclaimer: 'המחירים הם הערכה בלבד',
    });

    const res = await request(app)
      .get(`/grocerylist/users/${TEST_USER_ID}/price-comparison`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.chains).toHaveLength(1);
    expect(res.body.chains[0].chain).toBe('rami-levy');
    expect(mockedService.comparePrices).toHaveBeenCalledWith(TEST_USER_ID);
  });

  it('returns 404 when the grocery list is empty', async () => {
    mockedService.comparePrices.mockRejectedValue(
      new NotFoundError('Grocery list is empty'),
    );

    const res = await request(app)
      .get(`/grocerylist/users/${TEST_USER_ID}/price-comparison`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('returns 502 on upstream failure', async () => {
    mockedService.comparePrices.mockRejectedValue(new Error('catalog down'));

    const res = await request(app)
      .get(`/grocerylist/users/${TEST_USER_ID}/price-comparison`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(502);
  });
});
