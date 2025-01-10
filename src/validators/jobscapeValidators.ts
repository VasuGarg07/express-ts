import { z } from "zod";

export const applicantPreferenceSchema = z.object({
    expectedSalary: z.number().positive("Salary must be a positive number"),
    jobType: z.enum(["full-time", "part-time", "contractual", "freelance", "internship"]),
    locations: z.array(z.string().min(1, "Location cannot be empty")),
    shift: z.enum(["day", "night", "flexible"]).optional(),
    role: z.array(z.string()).optional(),
    industry: z.array(z.string()).optional(),
});


export const applicantSchema = z.object({
    fullName: z.string().min(1, "Full name is required"),
    contactEmail: z.string().email("Invalid email format"),
    phoneNumber: z.string().min(10).max(15, "Phone number must be 10-15 digits"),

    photoUrl: z.string().url("Invalid URL format").optional(),
    profileSummary: z.string().optional(),
    resumeURL: z.string().url("Invalid URL format"),
    skills: z.array(z.string().min(1, "Skill cannot be empty")),
    languages: z.array(z.string().min(1, "Language cannot be empty")),

    experience: z.array(
        z.object({
            title: z.string().min(1, "Title is required"),
            company: z.string().min(1, "Company is required"),
            duration: z.string().min(1, "Duration is required"),
            description: z.string().min(1, "Description is required"),
        })
    ).optional(),

    education: z.array(
        z.object({
            degree: z.string().min(1, "Degree is required"),
            institution: z.string().min(1, "Institution is required"),
            year: z.string().min(4).max(4, "Year must be 4 digits"),
        })
    ).optional(),

    socialLinks: z.object({
        twitter: z.string().url("Invalid URL format").optional(),
        youtube: z.string().url("Invalid URL format").optional(),
        github: z.string().url("Invalid URL format").optional(),
        linkedin: z.string().url("Invalid URL format").optional(),
        website: z.string().url("Invalid URL format").optional(),
    }).partial().optional(),
}).extend({
    preference: applicantPreferenceSchema, // Use the standalone preference validator
});

export const applicantUpdateSchema = applicantSchema.partial();

export const employerSchema = z.object({
    companyName: z.string().min(1, "Company name is required"),
    logoURL: z.string().url("Invalid URL format"),
    contactNumber: z.string().min(10).max(15, "Contact number must be 10-15 digits"),
    email: z.string().email('Invalid email address'),
    industry: z.string().min(1, "Industry is required"),
    address: z.string().min(1, "Address is required"),
    employeeStrength: z.string().min(1, "Employee Strength is required"),
    yearOfEstablishMent: z.string().min(1, "Year of Establishment is required"),
    websiteUrl: z.string().url("Invalid URL format").optional(),
    companyOverview: z.string().optional(),
    companyVision: z.string().optional(),

    socialLinks: z.object({
        facebook: z.string().url("Invalid URL format").optional(),
        twitter: z.string().url("Invalid URL format").optional(),
        instagram: z.string().url("Invalid URL format").optional(),
        linkedin: z.string().url("Invalid URL format").optional(),
        youtube: z.string().url("Invalid URL format").optional(),
    }).partial().optional(),
});
export const employerUpdateSchema = employerSchema.partial();

export const jobSchema = z.object({
    // primary attributes
    title: z.string().min(1, "Title is required"),
    location: z.string().min(1, "Location is required"),
    jobLevel: z.enum(["internship", "entry-level", "mid-level", "senior-level", "lead", "manager"]),
    skillsRequired: z.array(z.string().min(1, "Skill cannot be empty")),
    experienceRequired: z.string().min(1, "Experience is required"),
    salaryRange: z.string().min(1, "Salary range is required"),
    employmentType: z.enum(["full-time", "part-time", "contractual", "freelance", "internship"]),
    shiftType: z.enum(["day", "night", "flexible"]),
    vacancies: z.number().positive("Vacancies must be greater than zero"),

    // secondary attributes
    tags: z.array(z.string()).optional(),
    description: z.string().optional(),
    responsibilities: z.array(z.string()).optional(),
    requirements: z.array(z.string()).optional(),
    benefits: z.array(z.string()).optional(),
    applicationDeadline: z.number().int().positive("Deadline must be a valid Unix timestamp"),

    // used for soft delete
    isArchived: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
});
export const jobUpdateSchema = jobSchema.partial();

export const updateApplicationStatusSchema = z.object({
    applicationId: z.string().nonempty("Application ID is required"),
    jobId: z.string().nonempty("Job ID is required"),
    status: z
        .enum(["pending", "shortlisted", "rejected", "contacted", "hired"])
        .optional(),
    feedback: z.string().optional(),
    notes: z.string().optional(),
    interviewDate: z
        .number()
        .int("Interview date must be a valid timestamp")
        .positive("Interview date must be a positive value")
        .optional(),
});
