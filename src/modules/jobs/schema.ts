import { sql } from 'drizzle-orm';
import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  unique,
  check,
} from 'drizzle-orm/pg-core';

interface Experience {
  title: string;
  company: string;
  duration: string;
  description: string;
}

interface Education {
  degree: string;
  institution: string;
  year: string;
}

interface Preference {
  expectedSalary: number;
  jobType: string;
  locations: string[];
  shift?: string;
  roles?: string[];
  industries?: string[];
}

interface ApplicantSocialLinks {
  twitter?: string;
  youtube?: string;
  github?: string;
  linkedin?: string;
  website?: string;
}

interface EmployerSocialLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
}

export const employers = pgTable('employers', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 24 }).notNull().unique(),
  companyName: text('company_name').notNull(),
  logoURL: text('logo_url').notNull(),
  industry: text('industry').notNull(),
  address: text('address').notNull(),
  websiteUrl: text('website_url'),
  employeeStrength: text('employee_strength').notNull(),
  yearOfEstablishment: text('year_of_establishment').notNull(),
  contactEmail: text('contact_email').notNull().unique(),
  contactNumber: text('contact_number').notNull().unique(),
  companyOverview: text('company_overview'),
  companyVision: text('company_vision'),
  socialLinks: jsonb('social_links').$type<EmployerSocialLinks>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const applicants = pgTable('applicants', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 24 }).notNull().unique(),
  fullName: text('full_name').notNull(),
  contactEmail: text('contact_email').notNull(),
  phoneNumber: text('phone_number').notNull(),
  photoUrl: text('photo_url'),
  profileSummary: text('profile_summary'),
  resumeURL: text('resume_url').notNull(),
  skills: text('skills').array().notNull(),
  languages: text('languages').array().notNull(),
  experience: jsonb('experience').$type<Experience[]>(),
  education: jsonb('education').$type<Education[]>(),
  preference: jsonb('preference').$type<Preference>().notNull(),
  socialLinks: jsonb('social_links').$type<ApplicantSocialLinks>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const jobs = pgTable('jobs', {
  id: serial('id').primaryKey(),
  postedBy: integer('posted_by').notNull().references(() => employers.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  location: text('location').notNull(),
  jobLevel: text('job_level').notNull(),
  vacancies: integer('vacancies').notNull().default(1),
  employmentType: text('employment_type').notNull(),
  shiftType: text('shift_type').notNull(),
  salaryRange: text('salary_range').notNull(),
  experienceRequired: text('experience_required').notNull(),
  description: text('description').notNull(),
  requirements: text('requirements').array().notNull(),
  responsibilities: text('responsibilities').array(),
  benefits: text('benefits').array(),
  skillsRequired: text('skills_required').array().notNull(),
  tags: text('tags').array(),
  isArchived: boolean('is_archived').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  check('job_level_valid', sql`${table.jobLevel} IN ('internship', 'entry-level', 'mid-level', 'senior-level', 'lead', 'manager')`),
  check('employment_type_valid', sql`${table.employmentType} IN ('full-time', 'part-time', 'contractual', 'freelance', 'internship')`),
  check('shift_type_valid', sql`${table.shiftType} IN ('day', 'night', 'flexible')`),
]);

export const jobApplications = pgTable('job_applications', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  applicantId: integer('applicant_id').notNull().references(() => applicants.id, { onDelete: 'cascade' }),
  coverLetter: text('cover_letter'),
  status: text('status').notNull().default('pending'),
  appliedAt: timestamp('applied_at').notNull().defaultNow(),
}, (table) => [
  unique('job_applicant_unique').on(table.jobId, table.applicantId),
  check('application_status_valid', sql`${table.status} IN ('pending', 'shortlisted', 'rejected', 'contacted', 'hired')`),
]);

export const savedJobs = pgTable('saved_jobs', {
  id: serial('id').primaryKey(),
  applicantId: integer('applicant_id').notNull().references(() => applicants.id, { onDelete: 'cascade' }),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  savedAt: timestamp('saved_at').notNull().defaultNow(),
}, (table) => [
  unique('saved_job_unique').on(table.applicantId, table.jobId),
]);
