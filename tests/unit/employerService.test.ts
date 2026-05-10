import * as employerService from '../../src/modules/jobs/services/employerService';
import { db } from '../../src/config/postgres';

// Same generic "thenable" chain pattern as applicantService.test.ts: every drizzle
// method (from, leftJoin, where, orderBy, limit, offset, values, set, returning)
// chains indefinitely off one object per operation type, resolving via a shared
// mock controllable per test with mockResolvedValueOnce.
jest.mock('../../src/config/postgres', () => {
  const mockSelectResult = jest.fn();
  const mockInsertResult = jest.fn();
  const mockUpdateResult = jest.fn();
  const mockDeleteResult = jest.fn();

  const makeChain = (resolver: jest.Mock) => {
    const chain: any = {};
    ['from', 'leftJoin', 'where', 'orderBy', 'limit', 'offset', 'values', 'set', 'returning'].forEach((method) => {
      chain[method] = jest.fn(() => chain);
    });
    chain.then = (resolve: any, reject: any) => Promise.resolve(resolver()).then(resolve, reject);
    return chain;
  };

  const selectChain = makeChain(mockSelectResult);
  const insertChain = makeChain(mockInsertResult);
  const updateChain = makeChain(mockUpdateResult);
  const deleteChain = makeChain(mockDeleteResult);

  return {
    __esModule: true,
    db: {
      select: jest.fn(() => selectChain),
      insert: jest.fn(() => insertChain),
      update: jest.fn(() => updateChain),
      delete: jest.fn(() => deleteChain),
    },
    __mocks: {
      mockSelectResult, mockInsertResult, mockUpdateResult, mockDeleteResult,
      selectChain, insertChain, updateChain, deleteChain,
    },
  };
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { __mocks } = require('../../src/config/postgres');
const { mockSelectResult, mockInsertResult, mockUpdateResult, mockDeleteResult, insertChain, updateChain } = __mocks;

describe('employerService', () => {
  const profileId = '1';
  const jobId = '2';
  const invalidId = 'bad';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== fetchMyJobs ====================
  describe('fetchMyJobs', () => {
    it('should return jobs and count for the employer', async () => {
      const jobs = [
        { id: 1, title: 'Engineer' },
        { id: 2, title: 'Designer' },
      ];
      mockSelectResult.mockResolvedValueOnce(jobs);

      const result = await employerService.fetchMyJobs(profileId);

      expect(result).toEqual({ jobs, count: 2 });
      expect(db.select).toHaveBeenCalled();
    });

    it('should return empty list when employer has no jobs', async () => {
      mockSelectResult.mockResolvedValueOnce([]);

      const result = await employerService.fetchMyJobs(profileId);
      expect(result).toEqual({ jobs: [], count: 0 });
    });
  });

  // ==================== createJob ====================
  describe('createJob', () => {
    it('should create and return a new job', async () => {
      const data = { title: 'Engineer', location: 'NYC' };
      const created = { id: 1, postedBy: Number(profileId), ...data };
      mockInsertResult.mockResolvedValueOnce([created]);

      const result = await employerService.createJob(profileId, data as any);

      expect(result).toEqual(created);
      expect(insertChain.values).toHaveBeenCalledWith({ postedBy: Number(profileId), ...data });
    });
  });

  // ==================== fetchJobWithApplications ====================
  describe('fetchJobWithApplications', () => {
    it('should return job with its applications when employer owns it', async () => {
      const job = { id: Number(jobId), title: 'Engineer' };
      const applications = [{ applicantId: 5, status: 'pending', fullName: 'Alice' }];
      mockSelectResult.mockResolvedValueOnce([job]);
      mockSelectResult.mockResolvedValueOnce(applications);

      const result = await employerService.fetchJobWithApplications(profileId, jobId);

      expect(result).toEqual({ ...job, applications });
    });

    it('should throw 400 for invalid job ID', async () => {
      await expect(
        employerService.fetchJobWithApplications(profileId, invalidId)
      ).rejects.toMatchObject({ statusCode: 400, message: 'Invalid job ID' });
    });

    it('should throw 404 when job not found or not owned', async () => {
      mockSelectResult.mockResolvedValueOnce([]);

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
      const updated = { id: Number(jobId), title: 'Updated' };
      mockUpdateResult.mockResolvedValueOnce([updated]);

      const result = await employerService.editJob(profileId, jobId, { title: 'Updated' } as any);

      expect(result).toEqual(updated);
      expect(updateChain.set).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Updated', updatedAt: expect.any(Date) })
      );
    });

    it('should throw 400 for invalid job ID', async () => {
      await expect(
        employerService.editJob(profileId, invalidId, {} as any)
      ).rejects.toMatchObject({ statusCode: 400, message: 'Invalid job ID' });
    });

    it('should throw 404 when job not found or not owned', async () => {
      mockUpdateResult.mockResolvedValueOnce([]);

      await expect(
        employerService.editJob(profileId, jobId, {} as any)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Job not found or unauthorized',
      });
    });
  });

  // ==================== removeJob ====================
  describe('removeJob', () => {
    it('should delete the job (cascade handles related rows)', async () => {
      mockDeleteResult.mockResolvedValueOnce([{ id: Number(jobId) }]);

      await employerService.removeJob(profileId, jobId);

      expect(db.delete).toHaveBeenCalled();
    });

    it('should throw 400 for invalid job ID', async () => {
      await expect(
        employerService.removeJob(profileId, invalidId)
      ).rejects.toMatchObject({ statusCode: 400, message: 'Invalid job ID' });
    });

    it('should throw 404 when job not found or not owned', async () => {
      mockDeleteResult.mockResolvedValueOnce([]);

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
      mockSelectResult.mockResolvedValueOnce([{ id: Number(jobId), isArchived: false }]);
      mockUpdateResult.mockResolvedValueOnce(undefined);

      const result = await employerService.toggleArchive(profileId, jobId);

      expect(result).toEqual({ isArchived: true, status: 'archived' });
    });

    it('should unarchive an archived job', async () => {
      mockSelectResult.mockResolvedValueOnce([{ id: Number(jobId), isArchived: true }]);
      mockUpdateResult.mockResolvedValueOnce(undefined);

      const result = await employerService.toggleArchive(profileId, jobId);

      expect(result).toEqual({ isArchived: false, status: 'unarchived' });
    });

    it('should throw 400 for invalid job ID', async () => {
      await expect(
        employerService.toggleArchive(profileId, invalidId)
      ).rejects.toMatchObject({ statusCode: 400, message: 'Invalid job ID' });
    });

    it('should throw 404 when job not found or not owned', async () => {
      mockSelectResult.mockResolvedValueOnce([]);

      await expect(
        employerService.toggleArchive(profileId, jobId)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Job not found or unauthorized',
      });
    });
  });

  // ==================== updateApplicationStatus ====================
  describe('updateApplicationStatus', () => {
    const applicantId = '5';

    it('should update the application status when job is owned by employer', async () => {
      mockSelectResult.mockResolvedValueOnce([{ id: Number(jobId) }]);
      mockUpdateResult.mockResolvedValueOnce([{ id: 1, status: 'shortlisted' }]);

      const result = await employerService.updateApplicationStatus(profileId, jobId, {
        applicantId,
        status: 'shortlisted',
      } as any);

      expect(result).toEqual({ applicantId, status: 'shortlisted' });
    });

    it('should throw 400 for invalid job ID', async () => {
      await expect(
        employerService.updateApplicationStatus(profileId, invalidId, { applicantId, status: 'shortlisted' } as any)
      ).rejects.toMatchObject({ statusCode: 400, message: 'Invalid job ID' });
    });

    it('should throw 400 for invalid applicant ID', async () => {
      await expect(
        employerService.updateApplicationStatus(profileId, jobId, { applicantId: invalidId, status: 'shortlisted' } as any)
      ).rejects.toMatchObject({ statusCode: 400, message: 'Invalid applicant ID' });
    });

    it('should throw 404 when job not found or not owned', async () => {
      mockSelectResult.mockResolvedValueOnce([]);

      await expect(
        employerService.updateApplicationStatus(profileId, jobId, { applicantId, status: 'shortlisted' } as any)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Job not found or unauthorized',
      });
    });

    it('should throw 404 when application not found', async () => {
      mockSelectResult.mockResolvedValueOnce([{ id: Number(jobId) }]);
      mockUpdateResult.mockResolvedValueOnce([]);

      await expect(
        employerService.updateApplicationStatus(profileId, jobId, { applicantId, status: 'shortlisted' } as any)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Application not found',
      });
    });
  });
});
