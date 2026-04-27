import * as profileService from '../../src/modules/jobs/profileService';
import { Applicant } from '../../src/modules/jobs/applicantModel';
import { Employer } from '../../src/modules/jobs/employerModel';
import { Job } from '../../src/modules/jobs/jobModel';

jest.mock('../../src/modules/jobs/applicantModel');
jest.mock('../../src/modules/jobs/employerModel');
jest.mock('../../src/modules/jobs/jobModel');

describe('profileService', () => {

  const userId = 'user-1';
  const profileId = 'profile-1';

  // ==================== fetchProfile ====================
  describe('fetchProfile', () => {
    it('should return applicant profile when role is applicant', async () => {
      const profile = { _id: profileId, fullName: 'Alice' };
      (Applicant.findById as jest.Mock).mockResolvedValue(profile);

      const result = await profileService.fetchProfile('applicant', profileId);

      expect(result).toEqual({ role: 'applicant', profile });
      expect(Applicant.findById).toHaveBeenCalledWith(profileId);
    });

    it('should return employer profile when role is employer', async () => {
      const profile = { _id: profileId, companyName: 'Acme' };
      (Employer.findById as jest.Mock).mockResolvedValue(profile);

      const result = await profileService.fetchProfile('employer', profileId);

      expect(result).toEqual({ role: 'employer', profile });
      expect(Employer.findById).toHaveBeenCalledWith(profileId);
    });

    it('should throw 400 for invalid role', async () => {
      await expect(profileService.fetchProfile('admin', profileId)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Invalid role',
      });
    });

    it('should throw 404 when profile not found', async () => {
      (Applicant.findById as jest.Mock).mockResolvedValue(null);

      await expect(profileService.fetchProfile('applicant', profileId)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Profile not found',
      });
    });
  });

  // ==================== registerNewApplicant ====================
  describe('registerNewApplicant', () => {
    it('should create a new applicant profile', async () => {
      (Applicant.findOne as jest.Mock).mockResolvedValue(null);
      const mockSave = jest.fn().mockResolvedValue({});
      (Applicant as any).mockImplementation((d: any) => ({ ...d, save: mockSave }));

      const result = await profileService.registerNewApplicant(userId, { fullName: 'Alice' });

      expect(result).toMatchObject({ userId, fullName: 'Alice' });
      expect(mockSave).toHaveBeenCalled();
    });

    it('should throw 401 when userId is missing', async () => {
      await expect(profileService.registerNewApplicant('', {})).rejects.toMatchObject({
        statusCode: 401,
        message: 'Unauthorized',
      });
    });

    it('should throw 400 when applicant already exists', async () => {
      (Applicant.findOne as jest.Mock).mockResolvedValue({ _id: 'existing' });

      await expect(profileService.registerNewApplicant(userId, {})).rejects.toMatchObject({
        statusCode: 400,
        message: 'Applicant profile already exists',
      });
    });
  });

  // ==================== registerNewEmployer ====================
  describe('registerNewEmployer', () => {
    it('should create a new employer profile', async () => {
      (Employer.findOne as jest.Mock).mockResolvedValue(null);
      const mockSave = jest.fn().mockResolvedValue({});
      (Employer as any).mockImplementation((d: any) => ({ ...d, save: mockSave }));

      const result = await profileService.registerNewEmployer(userId, { companyName: 'Acme' });

      expect(result).toMatchObject({ userId, companyName: 'Acme' });
      expect(mockSave).toHaveBeenCalled();
    });

    it('should throw 401 when userId is missing', async () => {
      await expect(profileService.registerNewEmployer('', {})).rejects.toMatchObject({
        statusCode: 401,
        message: 'Unauthorized',
      });
    });

    it('should throw 400 when employer already exists', async () => {
      (Employer.findOne as jest.Mock).mockResolvedValue({ _id: 'existing' });

      await expect(profileService.registerNewEmployer(userId, {})).rejects.toMatchObject({
        statusCode: 400,
        message: 'Employer profile already exists',
      });
    });
  });

  // ==================== editProfile ====================
  describe('editProfile', () => {
    it('should update applicant profile when role is applicant', async () => {
      const updated = { _id: profileId, fullName: 'Alice Updated' };
      (Applicant.findByIdAndUpdate as jest.Mock).mockResolvedValue(updated);

      const result = await profileService.editProfile('applicant', profileId, {
        fullName: 'Alice Updated',
      });

      expect(result).toEqual(updated);
      expect(Applicant.findByIdAndUpdate).toHaveBeenCalledWith(
        profileId,
        { fullName: 'Alice Updated' },
        { new: true, runValidators: true }
      );
    });

    it('should update employer profile when role is employer', async () => {
      const updated = { _id: profileId, companyName: 'Acme Inc' };
      (Employer.findByIdAndUpdate as jest.Mock).mockResolvedValue(updated);

      const result = await profileService.editProfile('employer', profileId, {
        companyName: 'Acme Inc',
      });

      expect(result).toEqual(updated);
    });

    it('should throw 400 for invalid role', async () => {
      await expect(
        profileService.editProfile('admin', profileId, {})
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'Invalid role',
      });
    });

    it('should throw 404 when profile not found', async () => {
      (Applicant.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      await expect(
        profileService.editProfile('applicant', profileId, {})
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Profile not found',
      });
    });
  });

  // ==================== deleteUserAccount ====================
  describe('deleteUserAccount', () => {
    it('should delete applicant and clean up job applications', async () => {
      (Applicant.findByIdAndDelete as jest.Mock).mockResolvedValue({ _id: profileId });
      (Job.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 3 });

      const result = await profileService.deleteUserAccount('applicant', profileId, profileId);

      expect(result).toBe('Applicant account deleted successfully');
      expect(Applicant.findByIdAndDelete).toHaveBeenCalledWith(profileId);
      expect(Job.updateMany).toHaveBeenCalledWith(
        { 'applications.applicantId': profileId },
        { $pull: { applications: { applicantId: profileId } } }
      );
    });

    it('should delete employer, all their jobs, and clean up applicants', async () => {
      const jobs = [{ _id: 'j1' }, { _id: 'j2' }];

      (Job.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(jobs),
        }),
      });
      (Job.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 2 });
      (Applicant.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 4 });
      (Employer.findByIdAndDelete as jest.Mock).mockResolvedValue({ _id: profileId });

      const result = await profileService.deleteUserAccount('employer', profileId, profileId);

      expect(result).toBe('Employer account deleted successfully');
      expect(Job.deleteMany).toHaveBeenCalledWith({ postedBy: profileId });
      expect(Applicant.updateMany).toHaveBeenCalledWith(
        {},
        {
          $pull: {
            savedJobs: { $in: ['j1', 'j2'] },
            applications: { jobId: { $in: ['j1', 'j2'] } },
          },
        }
      );
      expect(Employer.findByIdAndDelete).toHaveBeenCalledWith(profileId);
    });

    it('should throw 403 when paramId does not match profileId', async () => {
      await expect(
        profileService.deleteUserAccount('applicant', profileId, 'other-id')
      ).rejects.toMatchObject({
        statusCode: 403,
        message: 'Unauthorized to delete this account',
      });
    });

    it('should throw 404 when applicant profile not found', async () => {
      (Applicant.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      await expect(
        profileService.deleteUserAccount('applicant', profileId, profileId)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Profile not found',
      });
    });

    it('should throw 404 when employer profile not found', async () => {
      (Job.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      });
      (Job.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 0 });
      (Applicant.updateMany as jest.Mock).mockResolvedValue({});
      (Employer.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

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