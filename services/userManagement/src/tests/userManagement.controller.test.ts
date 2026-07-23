import { Request, Response } from 'express';
import {
  updatePassword,
  getAccountData,
  updateAccountData,
  getPreferences,
  updatePreferences,
} from '../controllers/userManagement.controller';
import * as authRepository from '../dal/authentication.repository';
import * as userManagementRepository from '../dal/userManagement.repository';
import * as passwordUtils from '../utils/password';
import bcrypt from 'bcrypt';

jest.mock('../dal/authentication.repository');
jest.mock('../dal/userManagement.repository');
jest.mock('../utils/password');
jest.mock('bcrypt');

describe('UserManagement Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {
      params: {},
      body: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
  });

  describe('updatePassword', () => {
    it('should return 400 if userId, oldPassword, or newPassword is missing', async () => {
      mockRequest.params = { userId: 'user123' };
      mockRequest.body = { oldPassword: 'old' };

      await updatePassword(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('User Id and password'),
        }),
      );
    });

    it('should return 400 if new password is less than 6 characters', async () => {
      mockRequest.params = { userId: 'user123' };
      mockRequest.body = {
        oldPassword: 'oldpass123',
        newPassword: '12345',
      };

      await updatePassword(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'New password must be at least 6 characters long',
        }),
      );
    });

    it('should return 404 if user not found', async () => {
      mockRequest.params = { userId: 'user123' };
      mockRequest.body = {
        oldPassword: 'oldpass123',
        newPassword: 'newpass123',
      };

      (authRepository.findUserByFilter as jest.Mock).mockResolvedValue(null);

      await updatePassword(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User not found.',
      });
    });

    it('should return 401 if old password does not match', async () => {
      const mockUser = {
        _id: 'user123',
        passwordHash: 'hashedold',
      };

      mockRequest.params = { userId: 'user123' };
      mockRequest.body = {
        oldPassword: 'wrongpassword',
        newPassword: 'newpass123',
      };

      (authRepository.findUserByFilter as jest.Mock).mockResolvedValue(
        mockUser,
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await updatePassword(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid password',
      });
    });

    it('should update password successfully', async () => {
      const mockUser = {
        _id: 'user123',
        passwordHash: 'hashedold',
      };

      mockRequest.params = { userId: 'user123' };
      mockRequest.body = {
        oldPassword: 'oldpass123',
        newPassword: 'newpass123',
      };

      (authRepository.findUserByFilter as jest.Mock).mockResolvedValue(
        mockUser,
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (passwordUtils.hashPassword as jest.Mock).mockResolvedValue('hashednew');
      (authRepository.saveUser as jest.Mock).mockResolvedValue(mockUser);

      await updatePassword(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Password updated successfully.',
      });
    });

    it('should return 500 on error', async () => {
      mockRequest.params = { userId: 'user123' };
      mockRequest.body = {
        oldPassword: 'oldpass123',
        newPassword: 'newpass123',
      };

      (authRepository.findUserByFilter as jest.Mock).mockRejectedValue(
        new Error('DB Error'),
      );

      await updatePassword(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Failed to update password',
        }),
      );
    });
  });

  describe('getAccountData', () => {
    it('should return 404 if user not found', async () => {
      mockRequest.params = { userId: 'user123' };

      (authRepository.findUserByFilter as jest.Mock).mockResolvedValue(null);

      await getAccountData(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User not found.',
      });
    });

    it('should return account data successfully', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@test.com',
        name: 'Test User',
        image: 'image.jpg',
      };

      mockRequest.params = { userId: 'user123' };

      (authRepository.findUserByFilter as jest.Mock).mockResolvedValue(
        mockUser,
      );

      await getAccountData(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        email: 'test@test.com',
        name: 'Test User',
        image: 'image.jpg',
      });
    });

    it('should return 500 on error', async () => {
      mockRequest.params = { userId: 'user123' };

      (authRepository.findUserByFilter as jest.Mock).mockRejectedValue(
        new Error('DB Error'),
      );

      await getAccountData(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Failed to retreive data',
        }),
      );
    });
  });

  describe('updateAccountData', () => {
    it('should return 400 if name is missing or empty', async () => {
      mockRequest.params = { userId: 'user123' };
      mockRequest.body = { name: '   ' };

      await updateAccountData(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Name is required',
      });
    });

    it('should return 400 if name is not a string', async () => {
      mockRequest.params = { userId: 'user123' };
      mockRequest.body = { name: 123 };

      await updateAccountData(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Name is required',
      });
    });

    it('should return 404 if user not found', async () => {
      mockRequest.params = { userId: 'user123' };
      mockRequest.body = { name: 'Updated Name' };

      (
        userManagementRepository.findUserAndUpdateFields as jest.Mock
      ).mockResolvedValue(null);

      await updateAccountData(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User not found.',
      });
    });

    it('should update account data successfully', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@test.com',
        name: 'Updated Name',
      };

      mockRequest.params = { userId: 'user123' };
      mockRequest.body = { name: 'Updated Name' };

      (
        userManagementRepository.findUserAndUpdateFields as jest.Mock
      ).mockResolvedValue(mockUser);

      await updateAccountData(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        accountData: {
          email: 'test@test.com',
          name: 'Updated Name',
        },
      });
    });

    it('should return 500 on error', async () => {
      mockRequest.params = { userId: 'user123' };
      mockRequest.body = { name: 'Updated Name' };

      (
        userManagementRepository.findUserAndUpdateFields as jest.Mock
      ).mockRejectedValue(new Error('DB Error'));

      await updateAccountData(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Failed to update account data',
        }),
      );
    });
  });

  describe('getPreferences', () => {
    it('should return 404 if user not found', async () => {
      mockRequest.params = { userId: 'user123' };

      (authRepository.findUserByFilter as jest.Mock).mockResolvedValue(null);

      await getPreferences(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User not found.',
      });
    });

    it('should return user preferences successfully', async () => {
      const mockUser = {
        _id: 'user123',
        preferences: {
          theme: 'dark',
          notifications: true,
        },
      };

      mockRequest.params = { userId: 'user123' };

      (authRepository.findUserByFilter as jest.Mock).mockResolvedValue(
        mockUser,
      );

      await getPreferences(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        userPreferences: {
          theme: 'dark',
          notifications: true,
        },
      });
    });

    it('should return 500 on error', async () => {
      mockRequest.params = { userId: 'user123' };

      (authRepository.findUserByFilter as jest.Mock).mockRejectedValue(
        new Error('DB Error'),
      );

      await getPreferences(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Failed to retreive data',
        }),
      );
    });
  });

  describe('updatePreferences', () => {
    it('should return 500 if user not found', async () => {
      mockRequest.params = { userId: 'user123' };
      mockRequest.body = {
        preferences: {
          theme: 'light',
        },
      };

      (
        userManagementRepository.findUserAndUpdateFields as jest.Mock
      ).mockResolvedValue(null);

      await updatePreferences(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Failed to update preferences',
        }),
      );
    });

    it('should update preferences successfully', async () => {
      const mockUser = {
        _id: 'user123',
        preferences: {
          theme: 'light',
          notifications: true,
        },
      };

      mockRequest.params = { userId: 'user123' };
      mockRequest.body = {
        preferences: {
          theme: 'light',
        },
      };

      (
        userManagementRepository.findUserAndUpdateFields as jest.Mock
      ).mockResolvedValue(mockUser);

      await updatePreferences(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        updatedUser: mockUser,
      });
    });

    it('should return 500 on error', async () => {
      mockRequest.params = { userId: 'user123' };
      mockRequest.body = {
        preferences: {
          theme: 'light',
        },
      };

      (
        userManagementRepository.findUserAndUpdateFields as jest.Mock
      ).mockRejectedValue(new Error('DB Error'));

      await updatePreferences(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Failed to update preferences',
        }),
      );
    });
  });
});
