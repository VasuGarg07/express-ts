import mongoose from 'mongoose';
import { Applicant } from './applicantModel';
import { Employer } from './employerModel';
import { Job } from './jobModel';
import { ApiError } from '../../utils/ApiError';
import { validateObjectId } from '../../utils/utilities';

const getApplicantOrFail = async (profileId: string) => {
  const applicant = await Applicant.findById(profileId);
  if (!applicant) {
    throw new ApiError(404, 'Applicant profile not found');
  }
  return applicant;
};

const getActiveJobOrFail = async (id: string) => {
  const job = await Job.findOne({ _id: id, isArchived: false });
  if (!job) {
    throw new ApiError(404, 'Job not found');
  }
  return job;
};

export const fetchJobs = async (query: { page?: string; limit?: string; search?: string; location?: string }) => {
  const page = parseInt(query.page || '1');
  const limit = parseInt(query.limit || '10');
  const skip = (page - 1) * limit;

  const filter: any = { isArchived: false };
  if (query.search) filter.title = { $regex: query.search, $options: 'i' };
  if (query.location) filter.location = { $regex: query.location, $options: 'i' };

  const jobs = await Job.aggregate([
    { $match: filter },
    {
      $lookup: {
        from: 'employers',
        localField: 'postedBy',
        foreignField: '_id',
        as: 'employer',
      },
    },
    { $unwind: '$employer' },
    {
      $addFields: {
        applicationCount: { $size: '$applications' },
        companyName: '$employer.companyName',
        logoURL: '$employer.logoURL',
      },
    },
    {
      $project: {
        id: '$_id',
        title: 1,
        location: 1,
        employmentType: 1,
        salaryRange: 1,
        applicationCount: 1,
        companyName: 1,
        logoURL: 1,
        createdAt: 1,
        _id: 0,
      },
    },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
  ]);

  const total = await Job.countDocuments(filter);

  return {
    jobs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const fetchJobDetails = async (id: string) => {
  validateObjectId(id, 'Invalid job ID');

  const result = await Job.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(id), isArchived: false } },
    {
      $lookup: {
        from: 'employers',
        localField: 'postedBy',
        foreignField: '_id',
        as: 'employer',
      },
    },
    { $unwind: '$employer' },
    {
      $addFields: {
        applicationCount: { $size: '$applications' },
        companyName: '$employer.companyName',
        logoURL: '$employer.logoURL',
      },
    },
    { $project: { applications: 0, employer: 0, __v: 0 } },
  ]);

  if (!result.length) {
    throw new ApiError(404, 'Job not found');
  }
  return result[0];
};

export const applyForJob = async (profileId: string, jobId: string, coverLetter: string) => {
  validateObjectId(jobId, 'Invalid job ID');

  const job = await getActiveJobOrFail(jobId);
  const applicant = await getApplicantOrFail(profileId);

  const alreadyApplied = applicant.applications.some(app => app.jobId.toString() === jobId);
  if (alreadyApplied) {
    throw new ApiError(400, 'Already applied to this job');
  }

  const jobObjectId = new mongoose.Types.ObjectId(jobId);
  const profileObjectId = new mongoose.Types.ObjectId(profileId);
  const now = new Date();

  applicant.applications.push({ jobId: jobObjectId, coverLetter, appliedAt: now });
  job.applications.push({ applicantId: profileObjectId, coverLetter, appliedAt: now });

  await Promise.all([applicant.save(), job.save()]);
};

export const fetchMyApplications = async (profileId: string) => {
  const applicant = await Applicant.findById(profileId).populate({
    path: 'applications.jobId',
    select: 'title location employmentType salaryRange postedBy',
    populate: { path: 'postedBy', select: 'companyName logoURL' },
  });

  if (!applicant) {
    throw new ApiError(404, 'Applicant profile not found');
  }

  return applicant.applications.map((app: any) => ({
    id: app.jobId._id,
    title: app.jobId.title,
    location: app.jobId.location,
    employmentType: app.jobId.employmentType,
    salaryRange: app.jobId.salaryRange,
    companyName: app.jobId.postedBy.companyName,
    logoURL: app.jobId.postedBy.logoURL,
    appliedAt: app.appliedAt.getTime(),
    coverLetter: app.coverLetter,
  }));
};

export const toggleSavedJob = async (profileId: string, jobId: string) => {
  validateObjectId(jobId, 'Invalid job ID');
  await getActiveJobOrFail(jobId);
  const applicant = await getApplicantOrFail(profileId);

  const isSaved = applicant.savedJobs.some(savedId => savedId.toString() === jobId);

  if (isSaved) {
    applicant.savedJobs = applicant.savedJobs.filter(savedId => savedId.toString() !== jobId);
    await applicant.save();
    return { message: 'Job removed from saved', saved: false };
  }

  applicant.savedJobs.push(new mongoose.Types.ObjectId(jobId));
  await applicant.save();
  return { message: 'Job saved successfully', saved: true };
};

export const fetchSavedJobs = async (profileId: string) => {
  const applicant = await Applicant.findById(profileId).populate({
    path: 'savedJobs',
    match: { isArchived: false },
    select: 'title location employmentType salaryRange postedBy',
    populate: { path: 'postedBy', select: 'companyName logoURL' },
  });

  if (!applicant) {
    throw new ApiError(404, 'Applicant profile not found');
  }

  return applicant.savedJobs.map((job: any) => ({
    id: job._id,
    title: job.title,
    location: job.location,
    employmentType: job.employmentType,
    salaryRange: job.salaryRange,
    companyName: job.postedBy.companyName,
    logoURL: job.postedBy.logoURL,
  }));
};

export const fetchCompanies = async (query: { page?: string; limit?: string; search?: string }) => {
  const page = parseInt(query.page || '1');
  const limit = parseInt(query.limit || '10');
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (query.search) filter.companyName = { $regex: query.search, $options: 'i' };

  const companies = await Employer.aggregate([
    { $match: filter },
    {
      $lookup: {
        from: 'jobs',
        let: { employerId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$postedBy', '$$employerId'] },
                  { $eq: ['$isArchived', false] },
                ],
              },
            },
          },
        ],
        as: 'jobs',
      },
    },
    { $addFields: { activeJobsCount: { $size: '$jobs' } } },
    {
      $project: {
        id: '$_id',
        companyName: 1,
        logoURL: 1,
        address: 1,
        activeJobsCount: 1,
        _id: 0,
      },
    },
    { $skip: skip },
    { $limit: limit },
  ]);

  const total = await Employer.countDocuments(filter);

  return {
    companies,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const fetchCompanyDetails = async (id: string) => {
  validateObjectId(id, 'Invalid company ID');

  const company = await Employer.findById(id);
  if (!company) {
    throw new ApiError(404, 'Company not found');
  }

  const jobs = await Job.find({ postedBy: id, isArchived: false })
    .select('title location employmentType salaryRange createdAt')
    .lean();

  const formattedJobs = jobs.map(job => ({
    id: job._id,
    title: job.title,
    location: job.location,
    employmentType: job.employmentType,
    salaryRange: job.salaryRange,
    companyName: company.companyName,
    logoURL: company.logoURL,
  }));

  return { company, jobs: formattedJobs, jobCount: formattedJobs.length };
};