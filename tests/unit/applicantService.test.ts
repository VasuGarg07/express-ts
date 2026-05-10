import * as applicantService from '../../src/modules/jobs/services/applicantService';
import { db } from '../../src/config/postgres';

// applicantService touches `db` through drizzle's chainable query builder across
// select/insert/update/delete, including leftJoin/orderBy/limit/offset combinations.
// A single generic "thenable" chain per operation lets every method (from, leftJoin,
// where, orderBy, limit, offset, values, set, returning) chain indefinitely and resolve
// via a shared per-operation mock, controlled per test with mockResolvedValueOnce /
// mockRejectedValueOnce on that call's terminal resolver.
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
const { mockSelectResult, mockInsertResult, selectChain, insertChain } = __mocks;

describe('applicantService', () => {
  const profileId = '1';
  const jobId = '2';
  const invalidId = 'bad';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== fetchJobs ====================
  describe('fetchJobs', () => {
    it('should return paginated jobs with default page/limit', async () => {
      const jobs = [{ id: 1, title: 'Engineer' }];
      mockSelectResult.mockResolvedValueOnce(jobs);
      mockSelectResult.mockResolvedValueOnce([{ total: 1 }]);

      const result = await applicantService.fetchJobs({});

      expect(result).toEqual({
        jobs,
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });
    });

    it('should apply search filter when provided', async () => {
      mockSelectResult.mockResolvedValueOnce([]);
      mockSelectResult.mockResolvedValueOnce([{ total: 0 }]);

      await applicantService.fetchJobs({ search: 'react' });

      expect(selectChain.where).toHaveBeenCalled();
    });

    it('should apply location filter when provided', async () => {
      mockSelectResult.mockResolvedValueOnce([]);
      mockSelectResult.mockResolvedValueOnce([{ total: 0 }]);

      await applicantService.fetchJobs({ location: 'remote' });

      expect(selectChain.where).toHaveBeenCalled();
    });

    it('should respect custom pagination params', async () => {
      mockSelectResult.mockResolvedValueOnce([]);
      mockSelectResult.mockResolvedValueOnce([{ total: 50 }]);

      const result = await applicantService.fetchJobs({ page: '3', limit: '5' });

      expect(result.pagination).toEqual({ page: 3, limit: 5, total: 50, totalPages: 10 });
    });
  });

  // ==================== fetchJobDetails ====================
  describe('fetchJobDetails', () => {
    it('should return job details when found', async () => {
      const job = { id: 2, title: 'Engineer', companyName: 'Acme' };
      mockSelectResult.mockResolvedValueOnce([job]);

      const result = await applicantService.fetchJobDetails(jobId);

      expect(result).toEqual(job);
    });

    it('should throw 400 for invalid job id', async () => {
      await expect(applicantService.fetchJobDetails(invalidId)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Invalid job ID',
      });
    });

    it('should throw 404 when no job found', async () => {
      mockSelectResult.mockResolvedValueOnce([]);

      await expect(applicantService.fetchJobDetails(jobId)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Job not found',
      });
    });
  });

  // ==================== applyForJob ====================
  describe('applyForJob', () => {
    it('should insert the application', async () => {
      mockInsertResult.mockResolvedValueOnce(undefined);

      await applicantService.applyForJob(profileId, jobId, 'Cover letter text');

      expect(db.insert).toHaveBeenCalled();
      expect(insertChain.values).toHaveBeenCalledWith({
        jobId: Number(jobId),
        applicantId: Number(profileId),
        coverLetter: 'Cover letter text',
      });
    });

    it('should throw 400 for invalid job ID', async () => {
      await expect(
        applicantService.applyForJob(profileId, invalidId, 'cover')
      ).rejects.toMatchObject({ statusCode: 400, message: 'Invalid job ID' });
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('should throw 400 when already applied to the job', async () => {
      mockInsertResult.mockRejectedValueOnce({ code: '23505' });

      await expect(
        applicantService.applyForJob(profileId, jobId, 'cover')
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'Already applied to this job',
      });
    });

    it('should rethrow unexpected insert errors', async () => {
      const dbError = new Error('connection lost');
      mockInsertResult.mockRejectedValueOnce(dbError);

      await expect(
        applicantService.applyForJob(profileId, jobId, 'cover')
      ).rejects.toBe(dbError);
    });
  });

  // ==================== fetchMyApplications ====================
  describe('fetchMyApplications', () => {
    it('should return formatted applications when applicant exists', async () => {
      const appliedAt = new Date('2024-01-01');
      mockSelectResult.mockResolvedValueOnce([{ id: 1 }]);
      mockSelectResult.mockResolvedValueOnce([
        {
          id: 1,
          title: 'Eng',
          location: 'NYC',
          employmentType: 'full-time',
          salaryRange: '100k',
          companyName: 'Acme',
          logoURL: 'logo.png',
          appliedAt,
          coverLetter: 'Hi',
          status: 'pending',
        },
      ]);

      const result = await applicantService.fetchMyApplications(profileId);

      expect(result).toEqual([
        {
          id: 1,
          title: 'Eng',
          location: 'NYC',
          employmentType: 'full-time',
          salaryRange: '100k',
          companyName: 'Acme',
          logoURL: 'logo.png',
          appliedAt: appliedAt.getTime(),
          coverLetter: 'Hi',
          status: 'pending',
        },
      ]);
    });

    it('should return empty array when applicant has no applications', async () => {
      mockSelectResult.mockResolvedValueOnce([{ id: 1 }]);
      mockSelectResult.mockResolvedValueOnce([]);

      const result = await applicantService.fetchMyApplications(profileId);
      expect(result).toEqual([]);
    });

    it('should throw 404 when applicant not found', async () => {
      mockSelectResult.mockResolvedValueOnce([]);

      await expect(applicantService.fetchMyApplications(profileId)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Applicant profile not found',
      });
    });
  });

  // ==================== toggleSavedJob ====================
  describe('toggleSavedJob', () => {
    it('should save the job when not previously saved', async () => {
      mockSelectResult.mockResolvedValueOnce([{ id: Number(jobId) }]); // job active
      mockSelectResult.mockResolvedValueOnce([{ id: Number(profileId) }]); // applicant exists
      mockSelectResult.mockResolvedValueOnce([]); // not already saved
      mockInsertResult.mockResolvedValueOnce(undefined);

      const result = await applicantService.toggleSavedJob(profileId, jobId);

      expect(result).toEqual({ message: 'Job saved successfully', saved: true });
      expect(db.insert).toHaveBeenCalled();
    });

    it('should unsave the job when previously saved', async () => {
      mockSelectResult.mockResolvedValueOnce([{ id: Number(jobId) }]);
      mockSelectResult.mockResolvedValueOnce([{ id: Number(profileId) }]);
      mockSelectResult.mockResolvedValueOnce([{ id: 5 }]); // already saved

      const result = await applicantService.toggleSavedJob(profileId, jobId);

      expect(result).toEqual({ message: 'Job removed from saved', saved: false });
      expect(db.delete).toHaveBeenCalled();
    });

    it('should throw 400 for invalid job id', async () => {
      await expect(
        applicantService.toggleSavedJob(profileId, invalidId)
      ).rejects.toMatchObject({ statusCode: 400, message: 'Invalid job ID' });
    });

    it('should throw 404 when job not found', async () => {
      mockSelectResult.mockResolvedValueOnce([]);

      await expect(
        applicantService.toggleSavedJob(profileId, jobId)
      ).rejects.toMatchObject({ statusCode: 404, message: 'Job not found' });
    });

    it('should throw 404 when applicant not found', async () => {
      mockSelectResult.mockResolvedValueOnce([{ id: Number(jobId) }]);
      mockSelectResult.mockResolvedValueOnce([]);

      await expect(
        applicantService.toggleSavedJob(profileId, jobId)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Applicant profile not found',
      });
    });
  });

  // ==================== fetchSavedJobs ====================
  describe('fetchSavedJobs', () => {
    it('should return formatted saved jobs', async () => {
      mockSelectResult.mockResolvedValueOnce([{ id: Number(profileId) }]);
      mockSelectResult.mockResolvedValueOnce([
        {
          id: 1,
          title: 'Eng',
          location: 'NYC',
          employmentType: 'full-time',
          salaryRange: '100k',
          companyName: 'Acme',
          logoURL: 'logo.png',
        },
      ]);

      const result = await applicantService.fetchSavedJobs(profileId);

      expect(result).toEqual([
        {
          id: 1,
          title: 'Eng',
          location: 'NYC',
          employmentType: 'full-time',
          salaryRange: '100k',
          companyName: 'Acme',
          logoURL: 'logo.png',
        },
      ]);
    });

    it('should return empty array when no saved jobs', async () => {
      mockSelectResult.mockResolvedValueOnce([{ id: Number(profileId) }]);
      mockSelectResult.mockResolvedValueOnce([]);

      const result = await applicantService.fetchSavedJobs(profileId);
      expect(result).toEqual([]);
    });

    it('should throw 404 when applicant not found', async () => {
      mockSelectResult.mockResolvedValueOnce([]);

      await expect(applicantService.fetchSavedJobs(profileId)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Applicant profile not found',
      });
    });
  });

  // ==================== fetchCompanies ====================
  describe('fetchCompanies', () => {
    it('should return paginated companies', async () => {
      const companies = [{ id: 1, companyName: 'Acme' }];
      mockSelectResult.mockResolvedValueOnce(companies);
      mockSelectResult.mockResolvedValueOnce([{ total: 1 }]);

      const result = await applicantService.fetchCompanies({});

      expect(result).toEqual({
        companies,
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });
    });

    it('should apply search filter when provided', async () => {
      mockSelectResult.mockResolvedValueOnce([]);
      mockSelectResult.mockResolvedValueOnce([{ total: 0 }]);

      await applicantService.fetchCompanies({ search: 'acme' });

      expect(selectChain.where).toHaveBeenCalled();
    });
  });

  // ==================== fetchCompanyDetails ====================
  describe('fetchCompanyDetails', () => {
    it('should return company with formatted active jobs', async () => {
      const company = { id: 1, companyName: 'Acme', logoURL: 'logo.png' };
      const jobs = [
        { id: 1, title: 'Eng', location: 'NYC', employmentType: 'full-time', salaryRange: '100k' },
      ];

      mockSelectResult.mockResolvedValueOnce([company]);
      mockSelectResult.mockResolvedValueOnce(jobs);

      const result = await applicantService.fetchCompanyDetails('1');

      expect(result.company).toEqual(company);
      expect(result.jobCount).toBe(1);
      expect(result.jobs[0]).toMatchObject({
        id: 1,
        title: 'Eng',
        companyName: 'Acme',
      });
    });

    it('should throw 400 for invalid company id', async () => {
      await expect(applicantService.fetchCompanyDetails(invalidId)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Invalid company ID',
      });
    });

    it('should throw 404 when company not found', async () => {
      mockSelectResult.mockResolvedValueOnce([]);

      await expect(applicantService.fetchCompanyDetails('1')).rejects.toMatchObject({
        statusCode: 404,
        message: 'Company not found',
      });
    });
  });
});
