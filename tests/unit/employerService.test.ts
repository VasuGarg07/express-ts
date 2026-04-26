import * as employerService from '../../src/modules/jobs/employerService';
import { Applicant } from '../../src/modules/jobs/applicantModel';
import { Job } from '../../src/modules/jobs/jobModel';
import { Types } from 'mongoose';

jest.mock('../../src/modules/jobs/applicantModel');
jest.mock('../../src/modules/jobs/jobModel');

describe('employerService', () => {

  const profileId = new Types.ObjectId().toString();
  const jobId = new Types.ObjectId().toString();
  const invalidId = 'bad';

  // ==================== fetchMyJobs ====================
  describe('fetchMyJobs', () => {
    it('should return jobs and count for the employer', async () => {
      const jobs = [
        { _id: 'j1', title: 'Engineer' },
        { _id: 'j2', title: 'Designer' },
      ];

      (Job.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(jobs),
          }),
        }),
      });

      const result = await employerService.fetchMyJobs(profileId);

      expect(result).toEqual({ jobs, count: 2 });
      expect(Job.find).toHaveBeenCalledWith({ postedBy: profileId });
    });

    it('should return empty list when employer has no jobs', async () => {
      (Job.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await employerService.fetchMyJobs(profileId);
      expect(result).toEqual({ jobs: [], count: 0 });
    });
  });

  // ==================== createJob ====================
  describe('createJob', () => {
    it('should create and save a new job', async () => {
      const data = { title: 'Engineer', location: 'NYC' };
      const mockSave = jest.fn().mockResolvedValue({});
      (Job as any).mockImplementation((d: any) => ({ ...d, save: mockSave }));

      const result = await employerService.createJob(profileId, data);

      expect(result).toMatchObject({ postedBy: profileId, ...data });
      expect(mockSave).toHaveBeenCalled();
    });
  });

  // ==================== fetchJobWithApplications ====================
  describe('fetchJobWithApplications', () => {
    it('should return job with populated applications when employer owns it', async () => {
      const job = { _id: jobId, title: 'Engineer', applications: [] };

      (Job.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(job),
      });

      const result = await employerService.fetchJobWithApplications(profileId, jobId);

      expect(result).toEqual(job);
      expect(Job.findOne).toHaveBeenCalledWith({ _id: jobId, postedBy: profileId });
    });

    it('should throw 400 for invalid ObjectId', async () => {
      await expect(
        employerService.fetchJobWithApplications(profileId, invalidId)
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 404 when job not found or not owned', async () => {
      (Job.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(
        employerService.fetchJobWithApplications(profileId, jobId)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Job not found or unauthorized',
      });
    });
  });

  // ==================== editJob ====================
  describe('editJob', () => {
    it('should update job when employer owns it', async () => {
      const updated = { _id: jobId, title: 'Updated' };
      (Job.findOneAndUpdate as jest.Mock).mockResolvedValue(updated);

      const result = await employerService.editJob(profileId, jobId, { title: 'Updated' });

      expect(result).toEqual(updated);
      expect(Job.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: jobId, postedBy: profileId },
        { title: 'Updated' },
        { new: true, runValidators: true }
      );
    });

    it('should throw 400 for invalid ObjectId', async () => {
      await expect(
        employerService.editJob(profileId, invalidId, {})
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 404 when job not found or not owned', async () => {
      (Job.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

      await expect(
        employerService.editJob(profileId, jobId, {})
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Job not found or unauthorized',
      });
    });
  });

  // ==================== removeJob ====================
  describe('removeJob', () => {
    it('should delete job and cascade clean up applicants', async () => {
      const job = { _id: jobId };
      (Job.findOneAndDelete as jest.Mock).mockResolvedValue(job);
      (Applicant.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 5 });

      await employerService.removeJob(profileId, jobId);

      expect(Job.findOneAndDelete).toHaveBeenCalledWith({ _id: jobId, postedBy: profileId });
      expect(Applicant.updateMany).toHaveBeenCalledWith(
        {},
        {
          $pull: {
            savedJobs: jobId,
            applications: { jobId },
          },
        }
      );
    });

    it('should throw 400 for invalid ObjectId', async () => {
      await expect(
        employerService.removeJob(profileId, invalidId)
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 404 when job not found or not owned', async () => {
      (Job.findOneAndDelete as jest.Mock).mockResolvedValue(null);

      await expect(
        employerService.removeJob(profileId, jobId)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Job not found or unauthorized',
      });
    });
  });

  // ==================== toggleArchive ====================
  describe('toggleArchive', () => {
    it('should archive an unarchived job', async () => {
      const job = { _id: jobId, isArchived: false, save: jest.fn().mockResolvedValue({}) };
      (Job.findOne as jest.Mock).mockResolvedValue(job);

      const result = await employerService.toggleArchive(profileId, jobId);

      expect(result).toEqual({ isArchived: true, status: 'archived' });
      expect(job.isArchived).toBe(true);
      expect(job.save).toHaveBeenCalled();
    });

    it('should unarchive an archived job', async () => {
      const job = { _id: jobId, isArchived: true, save: jest.fn().mockResolvedValue({}) };
      (Job.findOne as jest.Mock).mockResolvedValue(job);

      const result = await employerService.toggleArchive(profileId, jobId);

      expect(result).toEqual({ isArchived: false, status: 'unarchived' });
      expect(job.isArchived).toBe(false);
    });

    it('should throw 400 for invalid ObjectId', async () => {
      await expect(
        employerService.toggleArchive(profileId, invalidId)
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 404 when job not found or not owned', async () => {
      (Job.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        employerService.toggleArchive(profileId, jobId)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Job not found or unauthorized',
      });
    });
  });
});