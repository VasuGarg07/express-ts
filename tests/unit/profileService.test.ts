import * as profileService from '../../src/modules/jobs/services/profileService';
import { db } from '../../src/config/postgres';

// profileService only ever touches `db` through drizzle's chainable query builder
// (insert/update/delete/select -> values/set/where/from -> returning). Mock that
// chain shape directly instead of the underlying pg driver.
jest.mock('../../src/config/postgres', () => {
  const mockReturning = jest.fn();
  const mockSelectWhere = jest.fn();

  const mockValues = jest.fn(() => ({ returning: mockReturning }));
  const mockSet = jest.fn(() => ({ where: jest.fn(() => ({ returning: mockReturning })) }));
  const mockDeleteWhere = jest.fn(() => ({ returning: mockReturning }));
  const mockFrom = jest.fn(() => ({ where: mockSelectWhere }));

  return {
    __esModule: true,
    db: {
      insert: jest.fn(() => ({ values: mockValues })),
      update: jest.fn(() => ({ set: mockSet })),
      delete: jest.fn(() => ({ where: mockDeleteWhere })),
      select: jest.fn(() => ({ from: mockFrom })),
    },
    __mocks: { mockReturning, mockSelectWhere, mockValues, mockSet, mockDeleteWhere, mockFrom },
  };
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { __mocks } = require('../../src/config/postgres');
const { mockReturning, mockSelectWhere, mockSet, mockDeleteWhere } = __mocks;

describe('profileService', () => {
  const userId = 'user-1';
  const profileId = '1';

  // ==================== fetchProfile ====================
  describe('fetchProfile', () => {
    it('should return applicant profile when role is applicant', async () => {
      const profile = { id: 1, fullName: 'Alice' };
      mockSelectWhere.mockResolvedValueOnce([profile]);

      const result = await profileService.fetchProfile('applicant', profileId);

      expect(result).toEqual({ role: 'applicant', profile });
      expect(db.select).toHaveBeenCalled();
    });

    it('should return employer profile when role is employer', async () => {
      const profile = { id: 1, companyName: 'Acme' };
      mockSelectWhere.mockResolvedValueOnce([profile]);

      const result = await profileService.fetchProfile('employer', profileId);

      expect(result).toEqual({ role: 'employer', profile });
    });

    it('should throw 400 for invalid role', async () => {
      await expect(profileService.fetchProfile('admin', profileId)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Invalid role',
      });
    });

    it('should throw 404 when profile not found', async () => {
      mockSelectWhere.mockResolvedValueOnce([]);

      await expect(profileService.fetchProfile('applicant', profileId)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Profile not found',
      });
    });
  });

  // ==================== registerNewApplicant ====================
  describe('registerNewApplicant', () => {
    it('should create a new applicant profile', async () => {
      mockSelectWhere.mockResolvedValueOnce([]);
      mockReturning.mockResolvedValueOnce([{ id: 1, userId, fullName: 'Alice' }]);

      const result = await profileService.registerNewApplicant(userId, { fullName: 'Alice' } as any);

      expect(result).toMatchObject({ userId, fullName: 'Alice' });
      expect(db.insert).toHaveBeenCalled();
    });

    it('should throw 401 when userId is missing', async () => {
      await expect(profileService.registerNewApplicant('', {} as any)).rejects.toMatchObject({
        statusCode: 401,
        message: 'Unauthorized',
      });
    });

    it('should throw 400 when applicant already exists', async () => {
      mockSelectWhere.mockResolvedValueOnce([{ id: 1 }]);

      await expect(profileService.registerNewApplicant(userId, {} as any)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Applicant profile already exists',
      });
      expect(db.insert).not.toHaveBeenCalled();
    });
  });

  // ==================== registerNewEmployer ====================
  describe('registerNewEmployer', () => {
    it('should create a new employer profile', async () => {
      mockSelectWhere.mockResolvedValueOnce([]);
      mockReturning.mockResolvedValueOnce([{ id: 1, userId, companyName: 'Acme' }]);

      const result = await profileService.registerNewEmployer(userId, { companyName: 'Acme' } as any);

      expect(result).toMatchObject({ userId, companyName: 'Acme' });
      expect(db.insert).toHaveBeenCalled();
    });

    it('should throw 401 when userId is missing', async () => {
      await expect(profileService.registerNewEmployer('', {} as any)).rejects.toMatchObject({
        statusCode: 401,
        message: 'Unauthorized',
      });
    });

    it('should throw 400 when employer already exists', async () => {
      mockSelectWhere.mockResolvedValueOnce([{ id: 1 }]);

      await expect(profileService.registerNewEmployer(userId, {} as any)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Employer profile already exists',
      });
      expect(db.insert).not.toHaveBeenCalled();
    });
  });

  // ==================== editProfile ====================
  describe('editProfile', () => {
    it('should update applicant profile when role is applicant', async () => {
      const updated = { id: 1, fullName: 'Alice Updated' };
      mockReturning.mockResolvedValueOnce([updated]);

      const result = await profileService.editProfile('applicant', profileId, {
        fullName: 'Alice Updated',
      } as any);

      expect(result).toEqual(updated);
      expect(db.update).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ fullName: 'Alice Updated', updatedAt: expect.any(Date) })
      );
    });

    it('should update employer profile when role is employer', async () => {
      const updated = { id: 1, companyName: 'Acme Inc' };
      mockReturning.mockResolvedValueOnce([updated]);

      const result = await profileService.editProfile('employer', profileId, {
        companyName: 'Acme Inc',
      } as any);

      expect(result).toEqual(updated);
    });

    it('should throw 400 for invalid role', async () => {
      await expect(
        profileService.editProfile('admin', profileId, {} as any)
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'Invalid role',
      });
    });

    it('should throw 404 when profile not found', async () => {
      mockReturning.mockResolvedValueOnce([]);

      await expect(
        profileService.editProfile('applicant', profileId, {} as any)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Profile not found',
      });
    });
  });

  // ==================== deleteUserAccount ====================
  describe('deleteUserAccount', () => {
    it('should delete applicant account', async () => {
      mockReturning.mockResolvedValueOnce([{ id: 1 }]);

      const result = await profileService.deleteUserAccount('applicant', profileId, profileId);

      expect(result).toBe('Applicant account deleted successfully');
      expect(db.delete).toHaveBeenCalled();
      expect(mockDeleteWhere).toHaveBeenCalled();
    });

    it('should delete employer account', async () => {
      mockReturning.mockResolvedValueOnce([{ id: 1 }]);

      const result = await profileService.deleteUserAccount('employer', profileId, profileId);

      expect(result).toBe('Employer account deleted successfully');
      expect(db.delete).toHaveBeenCalled();
    });

    it('should throw 403 when paramId does not match profileId', async () => {
      await expect(
        profileService.deleteUserAccount('applicant', profileId, 'other-id')
      ).rejects.toMatchObject({
        statusCode: 403,
        message: 'Unauthorized to delete this account',
      });
      expect(db.delete).not.toHaveBeenCalled();
    });

    it('should throw 404 when applicant profile not found', async () => {
      mockReturning.mockResolvedValueOnce([]);

      await expect(
        profileService.deleteUserAccount('applicant', profileId, profileId)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Profile not found',
      });
    });

    it('should throw 404 when employer profile not found', async () => {
      mockReturning.mockResolvedValueOnce([]);

      await expect(
        profileService.deleteUserAccount('employer', profileId, profileId)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Profile not found',
      });
    });

    it('should throw 400 for invalid role', async () => {
      await expect(
        profileService.deleteUserAccount('admin', profileId, profileId)
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'Invalid role',
      });
    });
  });
});
