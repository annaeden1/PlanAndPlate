import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authController from '../controllers/auth.controller';
import * as authRepository from '../dal/authentication.repository';
import * as passwordUtils from '../utils/password';

jest.mock('../dal/authentication.repository');
jest.mock('../utils/password');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('Auth Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {
      body: {},
      headers: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
    process.env.JWT_SECRET = 'testsecret';
    process.env.JWT_REFRESH_TOKEN_SECRET = 'refreshsecret';
  });

  describe('signup', () => {
    it('should return 400 if name, email, or password is missing', async () => {
      mockRequest.body = { email: 'test@test.com' };

      await authController.signup(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'name, email and password are required',
      });
    });

    it('should return 400 if password is less than 6 characters', async () => {
      mockRequest.body = {
        name: 'Test User',
        email: 'test@test.com',
        password: '12345',
      };

      await authController.signup(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Password must be at least 6 characters long',
      });
    });

    it('should create user and return tokens on success', async () => {
      const mockUser = {
        _id: 'userid123',
        name: 'Test User',
        email: 'test@test.com',
        passwordHash: 'hashed',
        tokens: [],
      };

      mockRequest.body = {
        name: 'Test User',
        email: 'test@test.com',
        password: 'password123',
      };

      (passwordUtils.hashPassword as jest.Mock).mockResolvedValue('hashed');
      (authRepository.createUser as jest.Mock).mockResolvedValue(mockUser);
      (authRepository.saveUser as jest.Mock).mockResolvedValue(mockUser);

      await authController.signup(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(authRepository.createUser).toHaveBeenCalled();
    });

    it('should return 400 on database error', async () => {
      mockRequest.body = {
        name: 'Test User',
        email: 'test@test.com',
        password: 'password123',
      };

      (passwordUtils.hashPassword as jest.Mock).mockResolvedValue('hashed');
      (authRepository.createUser as jest.Mock).mockRejectedValue(
        new Error('DB Error'),
      );

      await authController.signup(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Failed to register the user' }),
      );
    });
  });

  describe('signin', () => {
    it('should return 400 if email or password is missing', async () => {
      mockRequest.body = { email: 'test@test.com' };

      await authController.signin(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Email and password are required',
      });
    });

    it('should return 400 if user not found', async () => {
      mockRequest.body = {
        email: 'notfound@test.com',
        password: 'password123',
      };

      (authRepository.findUserByFilter as jest.Mock).mockResolvedValue(null);

      await authController.signin(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid email or password',
      });
    });

    it('should return 401 if password does not match', async () => {
      const mockUser = {
        _id: 'userid123',
        email: 'test@test.com',
        passwordHash: 'hashed',
        tokens: [],
      };

      mockRequest.body = {
        email: 'test@test.com',
        password: 'wrongpassword',
      };

      (authRepository.findUserByFilter as jest.Mock).mockResolvedValue(
        mockUser,
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await authController.signin(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid email or password',
      });
    });

    it('should sign in user and return tokens on success', async () => {
      const mockUser = {
        _id: 'userid123',
        email: 'test@test.com',
        passwordHash: 'hashed',
        tokens: [],
        save: jest.fn(),
      };

      mockRequest.body = {
        email: 'test@test.com',
        password: 'password123',
      };

      (authRepository.findUserByFilter as jest.Mock).mockResolvedValue(
        mockUser,
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (authRepository.saveUser as jest.Mock).mockResolvedValue(mockUser);

      await authController.signin(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should return 400 if refresh token is missing', async () => {
      mockRequest.headers = {};

      await authController.logout(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Refresh token is required',
      });
    });

    it('should return 401 if user not found', async () => {
      mockRequest.headers = {
        authorization: 'Bearer validtoken',
      };

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'userid123' });
      (authRepository.findUserByFilter as jest.Mock).mockResolvedValue(null);

      await authController.logout(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Failed to logout',
      });
    });

    it('should logout successfully', async () => {
      const mockUser = {
        _id: 'userid123',
        tokens: ['validtoken'],
      };

      mockRequest.headers = {
        authorization: 'Bearer validtoken',
      };

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'userid123' });
      (authRepository.findUserByFilter as jest.Mock).mockResolvedValue(
        mockUser,
      );
      (authRepository.saveUser as jest.Mock).mockResolvedValue(mockUser);

      await authController.logout(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(authRepository.saveUser).toHaveBeenCalled();
    });

    it('should return 500 on error', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalidtoken',
      };

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authController.logout(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Failed to logout' }),
      );
    });
  });

  describe('refreshToken', () => {
    it('should return 401 if refresh token is missing', async () => {
      mockRequest.body = {};

      await authController.refreshToken(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Refresh token is required',
      });
    });

    it('should return 401 if user not found', async () => {
      mockRequest.body = { refreshToken: 'validtoken' };

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'userid123' });
      (authRepository.findUserByFilter as jest.Mock).mockResolvedValue(null);

      await authController.refreshToken(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid refresh token',
      });
    });

    it('should refresh token successfully', async () => {
      const mockUser = {
        _id: 'userid123',
        tokens: ['oldtoken'],
      };

      mockRequest.body = { refreshToken: 'oldtoken' };

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'userid123' });
      (authRepository.findUserByFilter as jest.Mock).mockResolvedValue(
        mockUser,
      );
      (authRepository.saveUser as jest.Mock).mockResolvedValue(mockUser);

      await authController.refreshToken(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should return 500 on error', async () => {
      mockRequest.body = { refreshToken: 'token' };

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('JWT Error');
      });

      await authController.refreshToken(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Failed to refresh token' }),
      );
    });
  });

  describe('verify', () => {
    it('should return 400 if user not found', async () => {
      const mockAuthRequest = {
        user: { _id: 'userid123' },
      } as any;

      (authRepository.findUserByFilter as jest.Mock).mockResolvedValue(null);

      await authController.verify(mockAuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
      });
    });

    it('should return 200 and verify user on success', async () => {
      const mockUser = { _id: 'userid123', email: 'test@test.com' };
      const mockAuthRequest = {
        user: { _id: 'userid123' },
      } as any;

      (authRepository.findUserByFilter as jest.Mock).mockResolvedValue(
        mockUser,
      );

      await authController.verify(mockAuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith('User Authorized');
    });

    it('should return 500 on error', async () => {
      const mockAuthRequest = {
        user: { _id: 'userid123' },
      } as any;

      (authRepository.findUserByFilter as jest.Mock).mockRejectedValue(
        new Error('DB Error'),
      );

      await authController.verify(mockAuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Failed to verify user' }),
      );
    });
  });
});
