import * as authService from '../../src/modules/auth/authService';
import User from '../../src/modules/auth/userModel';
import RefreshToken from '../../src/modules/auth/refreshTokenModel';
import * as utilities from '../../src/utils/utilities';
import jwt from 'jsonwebtoken';
import { ERROR_STRINGS } from '../../src/utils/response.string';

jest.mock('../../src/modules/auth/userModel');
jest.mock('../../src/modules/auth/refreshTokenModel');
jest.mock('../../src/utils/utilities');
jest.mock('jsonwebtoken');

describe('authService', () => {

  // ==================== generateTestToken ====================
  describe('generateTestToken', () => {
    it('should return an access token signed with given payload', () => {
      (jwt.sign as jest.Mock).mockReturnValue('test-access-token');

      const result = authService.generateTestToken('user-1', 'alice', 'alice@example.com');

      expect(result).toEqual({ accessToken: 'test-access-token' });
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 'user-1', username: 'alice', email: 'alice@example.com' },
        expect.any(String),
        { expiresIn: '1d' }
      );
    });
  });

  // ==================== registerUser ====================
  describe('registerUser', () => {
    it('should create a new user when no existing user is found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (utilities.hashData as jest.Mock)
        .mockResolvedValueOnce('hashed-password')
        .mockResolvedValueOnce('hashed-answer');

      const mockSave = jest.fn().mockResolvedValue({
        _id: 'user-id-123',
        username: 'alice',
        email: 'alice@example.com',
      });
      (User as any).mockImplementation(() => ({ save: mockSave }));

      const result = await authService.registerUser(
        'alice',
        'alice@example.com',
        'password123',
        'Pet name?',
        'Fluffy'
      );

      expect(result).toEqual({ id: 'user-id-123' });
      expect(User.findOne).toHaveBeenCalledTimes(1);
      expect(utilities.hashData).toHaveBeenCalledTimes(2);
      expect(utilities.hashData).toHaveBeenNthCalledWith(1, 'password123');
      expect(utilities.hashData).toHaveBeenNthCalledWith(2, 'Fluffy');
      expect(mockSave).toHaveBeenCalled();
    });

    it('should throw 409 when user already exists', async () => {
      (User.findOne as jest.Mock).mockResolvedValue({
        _id: 'existing-id',
        username: 'alice',
      });

      await expect(
        authService.registerUser('alice', 'alice@example.com', 'pw', 'q', 'a')
      ).rejects.toMatchObject({
        statusCode: 409,
        message: 'User Already Exists',
        data: { id: 'existing-id' },
      });
    });
  });

  // ==================== loginUser ====================
  describe('loginUser', () => {
    const mockUser = {
      _id: 'user-1',
      username: 'alice',
      email: 'alice@example.com',
      password: 'hashed-password',
    };

    it('should return tokens for valid credentials', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (utilities.compareData as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');
      (RefreshToken.create as jest.Mock).mockResolvedValue({});

      const result = await authService.loginUser('alice', 'password123');

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(RefreshToken.create).toHaveBeenCalledTimes(1);
      expect(RefreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'refresh-token',
          userId: 'user-1',
        })
      );
    });

    it('should throw 400 when username is missing', async () => {
      await expect(authService.loginUser('', 'password')).rejects.toMatchObject({
        statusCode: 400,
        message: ERROR_STRINGS.InvalidCreds,
      });
    });

    it('should throw 400 when password is missing', async () => {
      await expect(authService.loginUser('alice', '')).rejects.toMatchObject({
        statusCode: 400,
        message: ERROR_STRINGS.InvalidCreds,
      });
    });

    it('should throw 404 when user does not exist', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.loginUser('ghost', 'password')
      ).rejects.toMatchObject({
        statusCode: 404,
        message: ERROR_STRINGS.InvalidCreds,
      });
    });

    it('should throw 401 when password is invalid', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (utilities.compareData as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.loginUser('alice', 'wrong-password')
      ).rejects.toMatchObject({
        statusCode: 401,
        message: ERROR_STRINGS.InvalidCreds,
      });
    });
  });

  // ==================== changeUserPassword ====================
  describe('changeUserPassword', () => {
    it('should update password when security answer is correct', async () => {
      const mockSave = jest.fn().mockResolvedValue({});
      const mockUser = {
        _id: 'user-1',
        password: 'old-hashed',
        securityAnswer: 'hashed-answer',
        save: mockSave,
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (utilities.compareData as jest.Mock).mockResolvedValue(true);
      (utilities.hashData as jest.Mock).mockResolvedValue('new-hashed-password');

      await authService.changeUserPassword('alice', 'Fluffy', 'newPassword123');

      expect(mockUser.password).toBe('new-hashed-password');
      expect(mockSave).toHaveBeenCalled();
      expect(utilities.hashData).toHaveBeenCalledWith('newPassword123');
    });

    it('should throw 404 when user does not exist', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.changeUserPassword('ghost', 'answer', 'newPw')
      ).rejects.toMatchObject({
        statusCode: 404,
        message: ERROR_STRINGS.InvalidCreds,
      });
    });

    it('should throw 401 when security answer is wrong', async () => {
      const mockUser = {
        _id: 'user-1',
        securityAnswer: 'hashed-answer',
        save: jest.fn(),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (utilities.compareData as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.changeUserPassword('alice', 'wrong-answer', 'newPw')
      ).rejects.toMatchObject({
        statusCode: 401,
        message: ERROR_STRINGS.InvalidCreds,
      });

      expect(mockUser.save).not.toHaveBeenCalled();
    });
  });

  // ==================== refreshTokens ====================
  describe('refreshTokens', () => {
    const mockUser = {
      _id: 'user-1',
      username: 'alice',
      email: 'alice@example.com',
    };

    it('should return new tokens when refresh token is valid', async () => {
      (RefreshToken.findOne as jest.Mock).mockResolvedValue({ token: 'old-refresh' });
      (jwt.verify as jest.Mock).mockReturnValue({ id: 'user-1' });
      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (RefreshToken.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');
      (RefreshToken.create as jest.Mock).mockResolvedValue({});

      const result = await authService.refreshTokens('old-refresh');

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
      expect(RefreshToken.deleteOne).toHaveBeenCalledWith({ token: 'old-refresh' });
      expect(RefreshToken.create).toHaveBeenCalledTimes(1);
    });

    it('should throw 400 when no refresh token is provided', async () => {
      await expect(authService.refreshTokens('')).rejects.toMatchObject({
        statusCode: 400,
        message: ERROR_STRINGS.NoRefToken,
      });
    });

    it('should throw 401 when refresh token is not in DB', async () => {
      (RefreshToken.findOne as jest.Mock).mockResolvedValue(null);

      await expect(authService.refreshTokens('unknown-token')).rejects.toMatchObject({
        statusCode: 401,
        message: ERROR_STRINGS.InvalidToken,
      });
    });

    it('should throw 401 and delete token when JWT verify fails', async () => {
      (RefreshToken.findOne as jest.Mock).mockResolvedValue({ token: 'expired' });
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('jwt expired');
      });
      (RefreshToken.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

      await expect(authService.refreshTokens('expired')).rejects.toMatchObject({
        statusCode: 401,
        message: ERROR_STRINGS.InvalidToken,
      });

      expect(RefreshToken.deleteOne).toHaveBeenCalledWith({ token: 'expired' });
    });

    it('should throw 404 when user from token does not exist', async () => {
      (RefreshToken.findOne as jest.Mock).mockResolvedValue({ token: 'valid' });
      (jwt.verify as jest.Mock).mockReturnValue({ id: 'ghost-user' });
      (User.findById as jest.Mock).mockResolvedValue(null);

      await expect(authService.refreshTokens('valid')).rejects.toMatchObject({
        statusCode: 404,
        message: ERROR_STRINGS.UserNotFound,
      });
    });
  });

  // ==================== logoutUser ====================
  describe('logoutUser', () => {
    it('should delete the refresh token', async () => {
      (RefreshToken.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

      await authService.logoutUser('some-refresh-token');

      expect(RefreshToken.deleteOne).toHaveBeenCalledWith({ token: 'some-refresh-token' });
    });

    it('should not throw when token does not exist (idempotent)', async () => {
      (RefreshToken.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 0 });

      await expect(authService.logoutUser('non-existent')).resolves.toBeUndefined();
    });
  });
});