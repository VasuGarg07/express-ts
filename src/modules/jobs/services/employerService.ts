import { Applicant } from '../models/applicantModel';
import { Job } from '../models/jobModel';
import { ApiError } from '../../../utils/ApiError';
import { validateObjectId } from '../../../utils/utilities';
import { JobInput, JobUpdateInput, ApplicationStatusInput } from '../validators/jobValidators';

export const fetchMyJobs = async (profileId: string) => {
  const jobs = await Job.find({ postedBy: profileId })
    .select('-applications')
    .sort({ createdAt: -1 })
  return { jobs, count: jobs.length };
};

export const createJob = async (profileId: string, data: Partial<JobInput>) => {
  const job = new Job({ postedBy: profileId, ...data });
  await job.save();
  return job;
};

export const fetchJobWithApplications = async (profileId: string, jobId: string) => {
  validateObjectId(jobId, 'Invalid job ID');

  const job = await Job.findOne({ _id: jobId, postedBy: profileId }).populate({
    path: 'applications.applicantId',
    select: 'fullName contactEmail phoneNumber photoUrl resumeURL socialLinks',
  });

  if (!job) {
    throw new ApiError(404, 'Job not found or unauthorized');
  }
  return job;
};

export const editJob = async (profileId: string, jobId: string, data: JobUpdateInput) => {
  validateObjectId(jobId, 'Invalid job ID');

  const job = await Job.findOneAndUpdate(
    { _id: jobId, postedBy: profileId },
    data,
    { new: true, runValidators: true }
  );

  if (!job) {
    throw new ApiError(404, 'Job not found or unauthorized');
  }
  return job;
};

export const removeJob = async (profileId: string, jobId: string) => {
  validateObjectId(jobId, 'Invalid job ID');

  const job = await Job.findOneAndDelete({ _id: jobId, postedBy: profileId });
  if (!job) {
    throw new ApiError(404, 'Job not found or unauthorized');
  }

  await Applicant.updateMany(
    {},
    {
      $pull: {
        savedJobs: job._id,
        applications: { jobId: job._id },
      },
    }
  );
};

export const toggleArchive = async (profileId: string, jobId: string) => {
  validateObjectId(jobId, 'Invalid job ID');

  const job = await Job.findOne({ _id: jobId, postedBy: profileId });
  if (!job) {
    throw new ApiError(404, 'Job not found or unauthorized');
  }

  job.isArchived = !job.isArchived;
  await job.save();

  return { isArchived: job.isArchived, status: job.isArchived ? 'archived' : 'unarchived' };
};

export const updateApplicationStatus = async (
  profileId: string,
  jobId: string,
  data: ApplicationStatusInput
) => {
  validateObjectId(jobId, 'Invalid job ID');
  validateObjectId(data.applicantId, 'Invalid applicant ID');

  const job = await Job.findOne({ _id: jobId, postedBy: profileId });
  if (!job) {
    throw new ApiError(404, 'Job not found or unauthorized');
  }

  const application = job.applications.find(
    app => app.applicantId.toString() === data.applicantId
  );
  if (!application) {
    throw new ApiError(404, 'Application not found');
  }

  application.status = data.status;
  await job.save();

  // Keep the applicant's copy in sync
  await Applicant.updateOne(
    { _id: data.applicantId, 'applications.jobId': jobId },
    { $set: { 'applications.$.status': data.status } }
  );

  return { applicantId: data.applicantId, status: data.status };
};