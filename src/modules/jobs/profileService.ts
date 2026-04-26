import { Applicant } from './applicantModel';
import { Employer } from './employerModel';
import { Job } from './jobModel';
import { ApiError } from '../../utils/ApiError';

export const fetchProfile = async (role: string, profileId: string) => {
  let profile;
  if (role === 'applicant') profile = await Applicant.findById(profileId);
  else if (role === 'employer') profile = await Employer.findById(profileId);
  else throw new ApiError(400, 'Invalid role');

  if (!profile) {
    throw new ApiError(404, 'Profile not found');
  }
  return { role, profile };
};


export const registerNewApplicant = async (userId: string, data: any) => {
  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const existing = await Applicant.findOne({ userId });
  if (existing) {
    throw new ApiError(400, 'Applicant profile already exists');
  }

  const applicant = new Applicant({ userId, ...data });
  await applicant.save();
  return applicant;
};

export const registerNewEmployer = async (userId: string, data: any) => {
  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const existing = await Employer.findOne({ userId });
  if (existing) {
    throw new ApiError(400, 'Employer profile already exists');
  }

  const employer = new Employer({ userId, ...data });
  await employer.save();
  return employer;
};

export const editProfile = async (role: string, profileId: string, data: any) => {
  let updated;
  if (role === 'applicant') {
    updated = await Applicant.findByIdAndUpdate(profileId, data, { new: true, runValidators: true });
  } else if (role === 'employer') {
    updated = await Employer.findByIdAndUpdate(profileId, data, { new: true, runValidators: true });
  } else {
    throw new ApiError(400, 'Invalid role');
  }

  if (!updated) {
    throw new ApiError(404, 'Profile not found');
  }
  return updated;
};

export const deleteUserAccount = async (role: string, profileId: string, paramId: string) => {
  if (paramId !== profileId) {
    throw new ApiError(403, 'Unauthorized to delete this account');
  }

  if (role === 'applicant') {
    const deleted = await Applicant.findByIdAndDelete(profileId);
    if (!deleted) {
      throw new ApiError(404, 'Profile not found');
    }
    await Job.updateMany(
      { 'applications.applicantId': profileId },
      { $pull: { applications: { applicantId: profileId } } }
    );
    return 'Applicant account deleted successfully';
  }

  if (role === 'employer') {
    const jobs = await Job.find({ postedBy: profileId }).select('_id').lean();
    const jobIds = jobs.map(j => j._id);

    await Job.deleteMany({ postedBy: profileId });
    await Applicant.updateMany(
      {},
      {
        $pull: {
          savedJobs: { $in: jobIds },
          applications: { jobId: { $in: jobIds } },
        },
      }
    );

    const deleted = await Employer.findByIdAndDelete(profileId);
    if (!deleted) {
      throw new ApiError(404, 'Profile not found');
    }
    return 'Employer account deleted successfully';
  }

  throw new ApiError(400, 'Invalid role');
};