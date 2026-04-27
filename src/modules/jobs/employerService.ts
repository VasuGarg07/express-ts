import { Applicant } from './applicantModel';
import { Job } from './jobModel';
import { ApiError } from '../../utils/ApiError';
import { validateObjectId } from '../../utils/utilities';

export const fetchMyJobs = async (profileId: string) => {
  const jobs = await Job.find({ postedBy: profileId })
    .select('-applications')
    .sort({ createdAt: -1 })
    .lean();
  return { jobs, count: jobs.length };
};

export const createJob = async (profileId: string, data: any) => {
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

export const editJob = async (profileId: string, jobId: string, data: any) => {
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