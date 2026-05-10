import { eq, and, ilike, desc, count, sql } from 'drizzle-orm';
import { db } from '../../../config/postgres';
import { applicants, employers, jobs, jobApplications, savedJobs } from '../schema';
import { ApiError } from '../../../utils/ApiError';

interface ListQuery {
  page?: string;
  limit?: string;
  search?: string;
  location?: string;
}

const validateNumericId = (id: string, message: string) => {
  if (!id || isNaN(Number(id))) {
    throw new ApiError(400, message);
  }
};

export const fetchJobs = async (query: ListQuery) => {
  const page = parseInt(query.page || '1');
  const limit = parseInt(query.limit || '10');
  const skip = (page - 1) * limit;

  const conditions = [eq(jobs.isArchived, false)];
  if (query.search) conditions.push(ilike(jobs.title, `%${query.search}%`));
  if (query.location) conditions.push(ilike(jobs.location, `%${query.location}%`));
  const whereClause = and(...conditions);

  const jobRows = await db
    .select({
      id: jobs.id,
      title: jobs.title,
      location: jobs.location,
      employmentType: jobs.employmentType,
      salaryRange: jobs.salaryRange,
      createdAt: jobs.createdAt,
      companyName: employers.companyName,
      logoURL: employers.logoURL,
      applicationCount: sql<number>`(select count(*)::int from ${jobApplications} where ${jobApplications.jobId} = ${jobs.id})`,
    })
    .from(jobs)
    .leftJoin(employers, eq(jobs.postedBy, employers.id))
    .where(whereClause)
    .orderBy(desc(jobs.createdAt))
    .limit(limit)
    .offset(skip);

  const [{ total }] = await db.select({ total: count() }).from(jobs).where(whereClause);

  return {
    jobs: jobRows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const fetchJobDetails = async (id: string) => {
  validateNumericId(id, 'Invalid job ID');

  const [row] = await db
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
      companyName: employers.companyName,
      logoURL: employers.logoURL,
      applicationCount: sql<number>`(select count(*)::int from ${jobApplications} where ${jobApplications.jobId} = ${jobs.id})`,
    })
    .from(jobs)
    .leftJoin(employers, eq(jobs.postedBy, employers.id))
    .where(and(eq(jobs.id, Number(id)), eq(jobs.isArchived, false)));

  if (!row) {
    throw new ApiError(404, 'Job not found');
  }
  return row;
};

export const applyForJob = async (profileId: string, jobId: string, coverLetter: string) => {
  validateNumericId(jobId, 'Invalid job ID');

  try {
    await db.insert(jobApplications).values({
      jobId: Number(jobId),
      applicantId: Number(profileId),
      coverLetter,
    });
  } catch (error: any) {
    if (error?.code === '23505') {
      throw new ApiError(400, 'Already applied to this job');
    }
    throw error;
  }
};

export const fetchMyApplications = async (profileId: string) => {
  const id = Number(profileId);

  const [applicant] = await db.select({ id: applicants.id }).from(applicants).where(eq(applicants.id, id));
  if (!applicant) {
    throw new ApiError(404, 'Applicant profile not found');
  }

  const rows = await db
    .select({
      id: jobs.id,
      title: jobs.title,
      location: jobs.location,
      employmentType: jobs.employmentType,
      salaryRange: jobs.salaryRange,
      companyName: employers.companyName,
      logoURL: employers.logoURL,
      appliedAt: jobApplications.appliedAt,
      coverLetter: jobApplications.coverLetter,
      status: jobApplications.status,
    })
    .from(jobApplications)
    .leftJoin(jobs, eq(jobApplications.jobId, jobs.id))
    .leftJoin(employers, eq(jobs.postedBy, employers.id))
    .where(eq(jobApplications.applicantId, id));

  return rows.map((row) => ({ ...row, appliedAt: row.appliedAt.getTime() }));
};

export const toggleSavedJob = async (profileId: string, jobId: string) => {
  validateNumericId(jobId, 'Invalid job ID');

  const jId = Number(jobId);
  const pId = Number(profileId);

  const [job] = await db.select({ id: jobs.id }).from(jobs).where(and(eq(jobs.id, jId), eq(jobs.isArchived, false)));
  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  const [applicant] = await db.select({ id: applicants.id }).from(applicants).where(eq(applicants.id, pId));
  if (!applicant) {
    throw new ApiError(404, 'Applicant profile not found');
  }

  const [existing] = await db
    .select()
    .from(savedJobs)
    .where(and(eq(savedJobs.applicantId, pId), eq(savedJobs.jobId, jId)));

  if (existing) {
    await db.delete(savedJobs).where(and(eq(savedJobs.applicantId, pId), eq(savedJobs.jobId, jId)));
    return { message: 'Job removed from saved', saved: false };
  }

  await db.insert(savedJobs).values({ applicantId: pId, jobId: jId });
  return { message: 'Job saved successfully', saved: true };
};

export const fetchSavedJobs = async (profileId: string) => {
  const id = Number(profileId);

  const [applicant] = await db.select({ id: applicants.id }).from(applicants).where(eq(applicants.id, id));
  if (!applicant) {
    throw new ApiError(404, 'Applicant profile not found');
  }

  const rows = await db
    .select({
      id: jobs.id,
      title: jobs.title,
      location: jobs.location,
      employmentType: jobs.employmentType,
      salaryRange: jobs.salaryRange,
      companyName: employers.companyName,
      logoURL: employers.logoURL,
    })
    .from(savedJobs)
    .leftJoin(jobs, eq(savedJobs.jobId, jobs.id))
    .leftJoin(employers, eq(jobs.postedBy, employers.id))
    .where(and(eq(savedJobs.applicantId, id), eq(jobs.isArchived, false)));

  return rows;
};

export const fetchCompanies = async (query: ListQuery) => {
  const page = parseInt(query.page || '1');
  const limit = parseInt(query.limit || '10');
  const skip = (page - 1) * limit;

  const conditions = [];
  if (query.search) conditions.push(ilike(employers.companyName, `%${query.search}%`));
  const whereClause = conditions.length ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: employers.id,
      companyName: employers.companyName,
      logoURL: employers.logoURL,
      address: employers.address,
      activeJobsCount: sql<number>`(select count(*)::int from ${jobs} where ${jobs.postedBy} = ${employers.id} and ${jobs.isArchived} = false)`,
    })
    .from(employers)
    .where(whereClause)
    .limit(limit)
    .offset(skip);

  const [{ total }] = await db.select({ total: count() }).from(employers).where(whereClause);

  return {
    companies: rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const fetchCompanyDetails = async (id: string) => {
  validateNumericId(id, 'Invalid company ID');

  const [company] = await db.select().from(employers).where(eq(employers.id, Number(id)));
  if (!company) {
    throw new ApiError(404, 'Company not found');
  }

  const jobRows = await db
    .select({
      id: jobs.id,
      title: jobs.title,
      location: jobs.location,
      employmentType: jobs.employmentType,
      salaryRange: jobs.salaryRange,
    })
    .from(jobs)
    .where(and(eq(jobs.postedBy, Number(id)), eq(jobs.isArchived, false)));

  const formattedJobs = jobRows.map((job) => ({
    ...job,
    companyName: company.companyName,
    logoURL: company.logoURL,
  }));

  return { company, jobs: formattedJobs, jobCount: formattedJobs.length };
};
