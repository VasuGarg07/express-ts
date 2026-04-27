import * as applicantService from '../../src/modules/jobs/applicantService';
import { Applicant } from '../../src/modules/jobs/applicantModel';
import { Employer } from '../../src/modules/jobs/employerModel';
import { Job } from '../../src/modules/jobs/jobModel';
import { Types } from 'mongoose';

jest.mock('../../src/modules/jobs/applicantModel');
jest.mock('../../src/modules/jobs/employerModel');
jest.mock('../../src/modules/jobs/jobModel');

describe('applicantService', () => {

  const validId = new Types.ObjectId().toString();
  const invalidId = 'bad';

  // ==================== fetchJobs ====================
  describe('fetchJobs', () => {
    it('should return paginated jobs with default page/limit', async () => {
      const jobs = [{ id: 'j1', title: 'Engineer' }];
      (Job.aggregate as jest.Mock).mockResolvedValue(jobs);
      (Job.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await applicantService.fetchJobs({});

      expect(result).toEqual({
        jobs,
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });
    });

    it('should apply search filter when provided', async () => {
      (Job.aggregate as jest.Mock).mockResolvedValue([]);
      (Job.countDocuments as jest.Mock).mockResolvedValue(0);

      await applicantService.fetchJobs({ search: 'react' });

      expect(Job.countDocuments).toHaveBeenCalledWith({
        isArchived: false,
        title: { $regex: 'react', $options: 'i' },
      });
    });

    it('should apply location filter when provided', async () => {
      (Job.aggregate as jest.Mock).mockResolvedValue([]);
      (Job.countDocuments as jest.Mock).mockResolvedValue(0);

      await applicantService.fetchJobs({ location: 'remote' });

      expect(Job.countDocuments).toHaveBeenCalledWith({
        isArchived: false,
        location: { $regex: 'remote', $options: 'i' },
      });
    });

    it('should respect custom pagination params', async () => {
      (Job.aggregate as jest.Mock).mockResolvedValue([]);
      (Job.countDocuments as jest.Mock).mockResolvedValue(50);

      const result = await applicantService.fetchJobs({ page: '3', limit: '5' });

      expect(result.pagination).toEqual({ page: 3, limit: 5, total: 50, totalPages: 10 });
    });
  });

  // ==================== fetchJobDetails ====================
  describe('fetchJobDetails', () => {
    it('should return job details when found', async () => {
      const job = { _id: validId, title: 'Engineer', companyName: 'Acme' };
      (Job.aggregate as jest.Mock).mockResolvedValue([job]);

      const result = await applicantService.fetchJobDetails(validId);

      expect(result).toEqual(job);
    });

    it('should throw 400 for invalid ObjectId', async () => {
      await expect(applicantService.fetchJobDetails(invalidId)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Invalid job ID',
      });
    });

    it('should throw 404 when no job found', async () => {
      (Job.aggregate as jest.Mock).mockResolvedValue([]);

      await expect(applicantService.fetchJobDetails(validId)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Job not found',
      });
    });
  });

  // ==================== applyForJob ====================
  describe('applyForJob', () => {
    const profileId = new Types.ObjectId().toString();
    const jobId = new Types.ObjectId().toString();

    it('should add application to both applicant and job', async () => {
      const job = {
        _id: jobId,
        applications: [],
        save: jest.fn().mockResolvedValue({}),
      };
      const applicant = {
        _id: profileId,
        applications: [],
        save: jest.fn().mockResolvedValue({}),
      };

      (Job.findOne as jest.Mock).mockResolvedValue(job);
      (Applicant.findById as jest.Mock).mockResolvedValue(applicant);

      await applicantService.applyForJob(profileId, jobId, 'Cover letter text');

      expect(applicant.applications).toHaveLength(1);
      expect(job.applications).toHaveLength(1);
      expect(applicant.save).toHaveBeenCalled();
      expect(job.save).toHaveBeenCalled();
    });

    it('should throw 400 for invalid job ID', async () => {
      await expect(
        applicantService.applyForJob(profileId, invalidId, 'cover')
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 404 when job not found', async () => {
      (Job.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        applicantService.applyForJob(profileId, jobId, 'cover')
      ).rejects.toMatchObject({ statusCode: 404, message: 'Job not found' });
    });

    it('should throw 404 when applicant profile not found', async () => {
      (Job.findOne as jest.Mock).mockResolvedValue({ _id: jobId, applications: [] });
      (Applicant.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        applicantService.applyForJob(profileId, jobId, 'cover')
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Applicant profile not found',
      });
    });

    it('should throw 400 when already applied to the job', async () => {
      const job = { _id: jobId, applications: [], save: jest.fn() };
      const applicant = {
        _id: profileId,
        applications: [{ jobId: { toString: () => jobId }, coverLetter: 'old' }],
        save: jest.fn(),
      };

      (Job.findOne as jest.Mock).mockResolvedValue(job);
      (Applicant.findById as jest.Mock).mockResolvedValue(applicant);

      await expect(
        applicantService.applyForJob(profileId, jobId, 'cover')
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'Already applied to this job',
      });
    });
  });

  // ==================== fetchMyApplications ====================
  describe('fetchMyApplications', () => {
    it('should return formatted applications when applicant exists', async () => {
      const applicant = {
        applications: [
          {
            jobId: {
              _id: 'j1',
              title: 'Eng',
              location: 'NYC',
              employmentType: 'full-time',
              salaryRange: '100k',
              postedBy: { companyName: 'Acme', logoURL: 'logo.png' },
            },
            appliedAt: new Date('2024-01-01'),
            coverLetter: 'Hi',
          },
        ],
      };

      (Applicant.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(applicant),
      });

      const result = await applicantService.fetchMyApplications('user-1');

      expect(result).toEqual([
        {
          id: 'j1',
          title: 'Eng',
          location: 'NYC',
          employmentType: 'full-time',
          salaryRange: '100k',
          companyName: 'Acme',
          logoURL: 'logo.png',
          appliedAt: new Date('2024-01-01').getTime(),
          coverLetter: 'Hi',
        },
      ]);
    });

    it('should return empty array when applicant has no applications', async () => {
      (Applicant.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue({ applications: [] }),
      });

      const result = await applicantService.fetchMyApplications('user-1');
      expect(result).toEqual([]);
    });

    it('should throw 404 when applicant not found', async () => {
      (Applicant.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(applicantService.fetchMyApplications('user-1')).rejects.toMatchObject({
        statusCode: 404,
        message: 'Applicant profile not found',
      });
    });
  });

  // ==================== toggleSavedJob ====================
  describe('toggleSavedJob', () => {
    const profileId = new Types.ObjectId().toString();
    const jobId = new Types.ObjectId().toString();

    it('should save the job when not previously saved', async () => {
      const applicant = {
        savedJobs: [],
        save: jest.fn().mockResolvedValue({}),
      };

      (Job.findOne as jest.Mock).mockResolvedValue({ _id: jobId });
      (Applicant.findById as jest.Mock).mockResolvedValue(applicant);

      const result = await applicantService.toggleSavedJob(profileId, jobId);

      expect(result).toEqual({ message: 'Job saved successfully', saved: true });
      expect(applicant.savedJobs).toHaveLength(1);
      expect(applicant.save).toHaveBeenCalled();
    });

    it('should unsave the job when previously saved', async () => {
      const applicant = {
        savedJobs: [{ toString: () => jobId }],
        save: jest.fn().mockResolvedValue({}),
      };

      (Job.findOne as jest.Mock).mockResolvedValue({ _id: jobId });
      (Applicant.findById as jest.Mock).mockResolvedValue(applicant);

      const result = await applicantService.toggleSavedJob(profileId, jobId);

      expect(result).toEqual({ message: 'Job removed from saved', saved: false });
      expect(applicant.savedJobs).toHaveLength(0);
    });

    it('should throw 400 for invalid ObjectId', async () => {
      await expect(
        applicantService.toggleSavedJob(profileId, invalidId)
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 404 when job not found', async () => {
      (Job.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        applicantService.toggleSavedJob(profileId, jobId)
      ).rejects.toMatchObject({ statusCode: 404, message: 'Job not found' });
    });

    it('should throw 404 when applicant not found', async () => {
      (Job.findOne as jest.Mock).mockResolvedValue({ _id: jobId });
      (Applicant.findById as jest.Mock).mockResolvedValue(null);

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
      const applicant = {
        savedJobs: [
          {
            _id: 'j1',
            title: 'Eng',
            location: 'NYC',
            employmentType: 'full-time',
            salaryRange: '100k',
            postedBy: { companyName: 'Acme', logoURL: 'logo.png' },
          },
        ],
      };

      (Applicant.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(applicant),
      });

      const result = await applicantService.fetchSavedJobs('user-1');

      expect(result).toEqual([
        {
          id: 'j1',
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
      (Applicant.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue({ savedJobs: [] }),
      });

      const result = await applicantService.fetchSavedJobs('user-1');
      expect(result).toEqual([]);
    });

    it('should throw 404 when applicant not found', async () => {
      (Applicant.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(applicantService.fetchSavedJobs('user-1')).rejects.toMatchObject({
        statusCode: 404,
        message: 'Applicant profile not found',
      });
    });
  });

  // ==================== fetchCompanies ====================
  describe('fetchCompanies', () => {
    it('should return paginated companies', async () => {
      const companies = [{ id: 'c1', companyName: 'Acme' }];
      (Employer.aggregate as jest.Mock).mockResolvedValue(companies);
      (Employer.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await applicantService.fetchCompanies({});

      expect(result).toEqual({
        companies,
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });
    });

    it('should apply search filter when provided', async () => {
      (Employer.aggregate as jest.Mock).mockResolvedValue([]);
      (Employer.countDocuments as jest.Mock).mockResolvedValue(0);

      await applicantService.fetchCompanies({ search: 'acme' });

      expect(Employer.countDocuments).toHaveBeenCalledWith({
        companyName: { $regex: 'acme', $options: 'i' },
      });
    });
  });

  // ==================== fetchCompanyDetails ====================
  describe('fetchCompanyDetails', () => {
    const companyId = new Types.ObjectId().toString();

    it('should return company with formatted active jobs', async () => {
      const company = { _id: companyId, companyName: 'Acme', logoURL: 'logo.png' };
      const jobs = [
        {
          _id: 'j1',
          title: 'Eng',
          location: 'NYC',
          employmentType: 'full-time',
          salaryRange: '100k',
          createdAt: new Date(),
        },
      ];

      (Employer.findById as jest.Mock).mockResolvedValue(company);
      (Job.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(jobs),
        }),
      });

      const result = await applicantService.fetchCompanyDetails(companyId);

      expect(result.company).toEqual(company);
      expect(result.jobCount).toBe(1);
      expect(result.jobs[0]).toMatchObject({
        id: 'j1',
        title: 'Eng',
        companyName: 'Acme',
      });
    });

    it('should throw 400 for invalid ObjectId', async () => {
      await expect(applicantService.fetchCompanyDetails(invalidId)).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it('should throw 404 when company not found', async () => {
      (Employer.findById as jest.Mock).mockResolvedValue(null);

      await expect(applicantService.fetchCompanyDetails(companyId)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Company not found',
      });
    });
  });
});