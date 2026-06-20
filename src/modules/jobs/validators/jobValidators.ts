import { z } from "zod";

// Shared Schemas
const experienceSchema = z.object({
    title: z.string().min(1, "Title is required"),
    company: z.string().min(1, "Company is required"),
    duration: z.string().min(1, "Duration is required"),
    description: z.string().min(1, "Description is required")
});

const educationSchema = z.object({
    degree: z.string().min(1, "Degree is required"),
    institution: z.string().min(1, "Institution is required"),
    year: z.string().length(4, "Year must be 4 digits")
});

const applicantSocialLinksSchema = z.object({
    twitter: z.string().url("Invalid URL").optional(),
    youtube: z.string().url("Invalid URL").optional(),
    github: z.string().url("Invalid URL").optional(),
    linkedin: z.string().url("Invalid URL").optional(),
    website: z.string().url("Invalid URL").optional()
}).partial().optional();

const employerSocialLinksSchema = z.object({
    facebook: z.string().url("Invalid URL").optional(),
    twitter: z.string().url("Invalid URL").optional(),
    instagram: z.string().url("Invalid URL").optional(),
    linkedin: z.string().url("Invalid URL").optional(),
    youtube: z.string().url("Invalid URL").optional()
}).partial().optional();

const preferenceSchema = z.object({
    expectedSalary: z.number().positive("Salary must be positive"),
    jobType: z.enum(['full-time', 'part-time', 'contractual', 'freelance', 'internship']),
    locations: z.array(z.string().min(1, "Location cannot be empty")).min(1, "At least one location required"),
    shift: z.enum(['day', 'night', 'flexible']).optional(),
    roles: z.array(z.string()).optional(),
    industries: z.array(z.string()).optional()
});

// Candidate Schemas
export const applicantSchema = z.object({
    fullName: z.string().min(1, "Full name is required"),
    contactEmail: z.string().email("Invalid email"),
    phoneNumber: z.string().min(10, "Phone must be at least 10 digits").max(15, "Phone must be at most 15 digits"),
    photoUrl: z.string().url("Invalid URL").optional(),
    profileSummary: z.string().optional(),
    resumeURL: z.string().url("Invalid resume URL"),
    skills: z.array(z.string().min(1, "Skill cannot be empty")).min(1, "At least one skill required"),
    languages: z.array(z.string().min(1, "Language cannot be empty")).min(1, "At least one language required"),
    experience: z.array(experienceSchema).optional(),
    education: z.array(educationSchema).optional(),
    preference: preferenceSchema,
    socialLinks: applicantSocialLinksSchema
});

export const applicantUpdateSchema = applicantSchema.partial();

// Employer Schema

export const employerSchema = z.object({
    companyName: z.string().min(1, "Company name is required"),
    logoURL: z.string().url("Invalid logo URL"),
    industry: z.string().min(1, "Industry is required"),
    address: z.string().min(1, "Address is required"),
    websiteUrl: z.string().url("Invalid website URL").optional(),
    employeeStrength: z.string().min(1, "Employee strength is required"),
    yearOfEstablishment: z.string().min(1, "Year of establishment is required"),
    contactEmail: z.string().email("Invalid email"),
    contactNumber: z.string().min(10, "Phone must be at least 10 digits").max(15, "Phone must be at most 15 digits"),
    companyOverview: z.string().optional(),
    companyVision: z.string().optional(),
    socialLinks: employerSocialLinksSchema
});

export const employerUpdateSchema = employerSchema.partial();

// Job Schemas
export const jobSchema = z.object({
    title: z.string().min(1, "Title is required"),
    location: z.string().min(1, "Location is required"),
    jobLevel: z.enum(['internship', 'entry-level', 'mid-level', 'senior-level', 'lead', 'manager']),
    vacancies: z.number().int().positive("Vacancies must be positive").default(1),
    employmentType: z.enum(['full-time', 'part-time', 'contractual', 'freelance', 'internship']),
    shiftType: z.enum(['day', 'night', 'flexible']),
    salaryRange: z.string().min(1, "Salary range is required"),
    experienceRequired: z.string().min(1, "Experience requirement is required"),
    description: z.string().min(1, "Description is required"),
    requirements: z.array(z.string().min(1, "Requirement cannot be empty")).min(1, "At least one requirement required"),
    responsibilities: z.array(z.string().min(1, "Responsibility cannot be empty")).optional(),
    benefits: z.array(z.string().min(1, "Benefit cannot be empty")).optional(),
    skillsRequired: z.array(z.string().min(1, "Skill cannot be empty")).min(1, "At least one skill required"),
    tags: z.array(z.string()).optional()
});

export const jobUpdateSchema = jobSchema.partial();

// Application Schema (jobId comes from the route param, not the body)
export const applyJobSchema = z.object({
    coverLetter: z.string().optional()
});

// Application status update (jobId comes from the route param)
export const applicationStatusSchema = z.object({
    applicantId: z.string().min(1, "Applicant ID is required"),
    status: z.enum(['pending', 'shortlisted', 'rejected', 'contacted', 'hired'])
});

// Inferred types
export type ApplicantInput = z.infer<typeof applicantSchema>;
export type EmployerInput = z.infer<typeof employerSchema>;
export type JobInput = z.infer<typeof jobSchema>;
export type JobUpdateInput = z.infer<typeof jobUpdateSchema>;
export type ApplicationStatusInput = z.infer<typeof applicationStatusSchema>;