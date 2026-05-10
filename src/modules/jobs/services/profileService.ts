import { eq } from 'drizzle-orm';
import { db } from '../../../config/postgres';
import { applicants, employers } from '../schema';
import { ApiError } from '../../../utils/ApiError';
import { ApplicantInput, EmployerInput } from '../validators/jobValidators';

export const fetchProfile = async (role: string, profileId: string) => {
  let profile;
  const id = Number(profileId);

  if (role === 'applicant') {
    [profile] = await db.select().from(applicants).where(eq(applicants.id, id));
  } else if (role === 'employer') {
    [profile] = await db.select().from(employers).where(eq(employers.id, id));
  } else {
    throw new ApiError(400, 'Invalid role');
  }

  if (!profile) {
    throw new ApiError(404, 'Profile not found');
  }
  return { role, profile };
};

export const registerNewApplicant = async (userId: string, data: Partial<ApplicantInput>) => {
  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const [existing] = await db.select().from(applicants).where(eq(applicants.userId, userId));
  if (existing) {
    throw new ApiError(400, 'Applicant profile already exists');
  }

  const [applicant] = await db
    .insert(applicants)
    .values({ userId, ...data } as typeof applicants.$inferInsert)
    .returning();
  return applicant;
};

export const registerNewEmployer = async (userId: string, data: Partial<EmployerInput>) => {
  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const [existing] = await db.select().from(employers).where(eq(employers.userId, userId));
  if (existing) {
    throw new ApiError(400, 'Employer profile already exists');
  }

  const [employer] = await db
    .insert(employers)
    .values({ userId, ...data } as typeof employers.$inferInsert)
    .returning();
  return employer;
};

export const editProfile = async (
  role: string,
  profileId: string,
  data: Partial<ApplicantInput> | Partial<EmployerInput>
) => {
  const id = Number(profileId);
  let updated;

  if (role === 'applicant') {
    [updated] = await db
      .update(applicants)
      .set({ ...data, updatedAt: new Date() } as Partial<typeof applicants.$inferInsert>)
      .where(eq(applicants.id, id))
      .returning();
  } else if (role === 'employer') {
    [updated] = await db
      .update(employers)
      .set({ ...data, updatedAt: new Date() } as Partial<typeof employers.$inferInsert>)
      .where(eq(employers.id, id))
      .returning();
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

  const id = Number(profileId);

  if (role === 'applicant') {
    const [deleted] = await db.delete(applicants).where(eq(applicants.id, id)).returning();
    if (!deleted) {
      throw new ApiError(404, 'Profile not found');
    }
    return 'Applicant account deleted successfully';
  }

  if (role === 'employer') {
    const [deleted] = await db.delete(employers).where(eq(employers.id, id)).returning();
    if (!deleted) {
      throw new ApiError(404, 'Profile not found');
    }
    return 'Employer account deleted successfully';
  }

  throw new ApiError(400, 'Invalid role');
};
