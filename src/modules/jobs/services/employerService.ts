import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../../config/postgres';
import { jobs, jobApplications, applicants } from '../schema';
import { ApiError } from '../../../utils/ApiError';
import { JobInput, JobUpdateInput, ApplicationStatusInput } from '../validators/jobValidators';

const validateNumericId = (id: string, message: string) => {
  if (!id || isNaN(Number(id))) {
    throw new ApiError(400, message);
  }
};

export const fetchMyJobs = async (profileId: string) => {
  const jobsList = await db
    .select({
      id: jobs.id,
      title: jobs.title,
      location: jobs.location,
      jobLevel: jobs.jobLevel,
      vacancies: jobs.vacancies,
      employmentType: jobs.employmentType,
      shiftType: jobs.shiftType,
      salaryRange: jobs.salaryRange,
      experienceRequired: jobs.experienceRequired,
      description: jobs.description,
      requirements: jobs.requirements,
      responsibilities: jobs.responsibilities,
      benefits: jobs.benefits,
      skillsRequired: jobs.skillsRequired,
      tags: jobs.tags,
      isArchived: jobs.isArchived,
      createdAt: jobs.createdAt,
      updatedAt: jobs.updatedAt,
    })
    .from(jobs)
    .where(eq(jobs.postedBy, Number(profileId)))
    .orderBy(desc(jobs.createdAt));

  return { jobs: jobsList, count: jobsList.length };
};

export const createJob = async (profileId: string, data: Partial<JobInput>) => {
  const [job] = await db
    .insert(jobs)
    .values({ postedBy: Number(profileId), ...data } as typeof jobs.$inferInsert)
    .returning();
  return job;
};

export const fetchJobWithApplications = async (profileId: string, jobId: string) => {
  validateNumericId(jobId, 'Invalid job ID');

  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, Number(jobId)), eq(jobs.postedBy, Number(profileId))));

  if (!job) {
    throw new ApiError(404, 'Job not found or unauthorized');
  }

  const applications = await db
    .select({
      applicantId: jobApplications.applicantId,
      coverLetter: jobApplications.coverLetter,
      status: jobApplications.status,
      appliedAt: jobApplications.appliedAt,
      fullName: applicants.fullName,
      contactEmail: applicants.contactEmail,
      phoneNumber: applicants.phoneNumber,
      photoUrl: applicants.photoUrl,
      resumeURL: applicants.resumeURL,
      socialLinks: applicants.socialLinks,
    })
    .from(jobApplications)
    .leftJoin(applicants, eq(jobApplications.applicantId, applicants.id))
    .where(eq(jobApplications.jobId, Number(jobId)));

  return { ...job, applications };
};

export const editJob = async (profileId: string, jobId: string, data: JobUpdateInput) => {
  validateNumericId(jobId, 'Invalid job ID');

  const [job] = await db
    .update(jobs)
    .set({ ...data, updatedAt: new Date() } as Partial<typeof jobs.$inferInsert>)
    .where(and(eq(jobs.id, Number(jobId)), eq(jobs.postedBy, Number(profileId))))
    .returning();

  if (!job) {
    throw new ApiError(404, 'Job not found or unauthorized');
  }
  return job;
};

export const removeJob = async (profileId: string, jobId: string) => {
  validateNumericId(jobId, 'Invalid job ID');

  const [job] = await db
    .delete(jobs)
    .where(and(eq(jobs.id, Number(jobId)), eq(jobs.postedBy, Number(profileId))))
    .returning();

  if (!job) {
    throw new ApiError(404, 'Job not found or unauthorized');
  }
};

export const toggleArchive = async (profileId: string, jobId: string) => {
  validateNumericId(jobId, 'Invalid job ID');

  const [job] = await db
    .select({ id: jobs.id, isArchived: jobs.isArchived })
    .from(jobs)
    .where(and(eq(jobs.id, Number(jobId)), eq(jobs.postedBy, Number(profileId))));

  if (!job) {
    throw new ApiError(404, 'Job not found or unauthorized');
  }

  const isArchived = !job.isArchived;
  await db.update(jobs).set({ isArchived, updatedAt: new Date() }).where(eq(jobs.id, job.id));

  return { isArchived, status: isArchived ? 'archived' : 'unarchived' };
};

export const updateApplicationStatus = async (
  profileId: string,
  jobId: string,
  data: ApplicationStatusInput
) => {
  validateNumericId(jobId, 'Invalid job ID');
  validateNumericId(data.applicantId, 'Invalid applicant ID');

  const [job] = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(and(eq(jobs.id, Number(jobId)), eq(jobs.postedBy, Number(profileId))));

  if (!job) {
    throw new ApiError(404, 'Job not found or unauthorized');
  }

  const [application] = await db
    .update(jobApplications)
    .set({ status: data.status })
    .where(and(eq(jobApplications.jobId, Number(jobId)), eq(jobApplications.applicantId, Number(data.applicantId))))
    .returning();

  if (!application) {
    throw new ApiError(404, 'Application not found');
  }

  return { applicantId: data.applicantId, status: data.status };
};
