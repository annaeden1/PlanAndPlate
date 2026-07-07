import jwt from 'jsonwebtoken';
import express from 'express';
import request from 'supertest';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

const authMiddleware = require('../middlewares/auth.middleware').default;
const protectedPath = "/protected";

const app = express();
app.use(express.json());
app.get(protectedPath, authMiddleware, (req: any, res: any) => {
  res.json({ userId: req.user._id });
});

describe('auth.middleware', () => {
  const SECRET = process.env.JWT_SECRET || 'secretkey';

  it('passes through and sets req.user with a valid token', async () => {
    const token = jwt.sign({ userId: 'user-123' }, SECRET);
    const res = await request(app)
      .get(protectedPath)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.userId).toBe('user-123');
  });

  it('returns 401 when Authorization header is missing', async () => {
    const res = await request(app).get(protectedPath);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('returns 401 when Authorization header is empty', async () => {
    const res = await request(app).get(protectedPath).set('Authorization', '');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('returns 401 when Authorization header does not start with "Bearer "', async () => {
    const res = await request(app)
      .get(protectedPath)
      .set('Authorization', 'Basic sometoken');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('returns 401 when token is invalid / tampered', async () => {
    const res = await request(app)
      .get(protectedPath)
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('returns 401 when token is expired', async () => {
    const token = jwt.sign({ userId: 'user-1' }, SECRET, { expiresIn: -1 });
    const res = await request(app)
      .get(protectedPath)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('returns 401 when Bearer token is missing after Bearer prefix', async () => {
    const res = await request(app)
      .get(protectedPath)
      .set('Authorization', 'Bearer ');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });
});
