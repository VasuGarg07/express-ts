import mongoose, { Document, Schema, Types } from "mongoose";
import { handleDocTransform } from "../../utils/utilities";

// ==================== INTERFACES ====================

export interface IExperience {
    title: string;
    company: string;
    duration: string;
    description: string;
}

export interface IEducation {
    degree: string;
    institution: string;
    year: string;
}

export interface ISocialLinks {
    twitter?: string;
    youtube?: string;
    github?: string;
    linkedin?: string;
    website?: string;
}

export interface IPreference {
    expectedSalary: number;
    jobType: 'full-time' | 'part-time' | 'contractual' | 'freelance' | 'internship';
    locations: string[];
    shift?: 'day' | 'night' | 'flexible';
    roles?: string[];
    industries?: string[];
}

export interface IApplication {
    jobId: Types.ObjectId;
    coverLetter?: string;
    appliedAt: Date;
}

export interface IApplicant extends Document {
    userId: Types.ObjectId;

    // Basic Info
    fullName: string;
    contactEmail: string;
    phoneNumber: string;
    photoUrl?: string;
    profileSummary?: string;

    // Professional
    resumeURL: string;
    skills: string[];
    languages: string[];
    experience?: IExperience[];
    education?: IEducation[];
    preference: IPreference;

    // Social
    socialLinks?: ISocialLinks;

    // User Actions
    savedJobs: Types.ObjectId[];
    applications: IApplication[];
}

// ==================== SCHEMA ====================

const experienceSchema = new Schema<IExperience>({
    title: { type: String, required: true },
    company: { type: String, required: true },
    duration: { type: String, required: true },
    description: { type: String, required: true }
}, { _id: false });

const educationSchema = new Schema<IEducation>({
    degree: { type: String, required: true },
    institution: { type: String, required: true },
    year: { type: String, required: true }
}, { _id: false });

const socialLinksSchema = new Schema<ISocialLinks>({
    twitter: { type: String },
    youtube: { type: String },
    github: { type: String },
    linkedin: { type: String },
    website: { type: String }
}, { _id: false });

const preferenceSchema = new Schema<IPreference>({
    expectedSalary: { type: Number, required: true },
    jobType: {
        type: String,
        enum: ['full-time', 'part-time', 'contractual', 'freelance', 'internship'],
        required: true
    },
    locations: { type: [String], required: true },
    shift: {
        type: String,
        enum: ['day', 'night', 'flexible']
    },
    roles: { type: [String] },
    industries: { type: [String] }
}, { _id: false });

const applicationSchema = new Schema<IApplication>({
    jobId: { type: Schema.Types.ObjectId, ref: 'jobs', required: true },
    coverLetter: { type: String },
    appliedAt: { type: Date, default: Date.now }
}, { _id: false });

const applicantSchema = new Schema<IApplicant>({
    userId: { type: Schema.Types.ObjectId, ref: 'users', required: true, unique: true },

    // Basic Info
    fullName: { type: String, required: true },
    contactEmail: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    photoUrl: { type: String },
    profileSummary: { type: String },

    // Professional
    resumeURL: { type: String, required: true },
    skills: { type: [String], required: true },
    languages: { type: [String], required: true },
    experience: [experienceSchema],
    education: [educationSchema],
    preference: { type: preferenceSchema, required: true },

    // Social
    socialLinks: socialLinksSchema,

    // User Actions
    savedJobs: [{ type: Schema.Types.ObjectId, ref: 'jobs' }],
    applications: [applicationSchema]
}, {
    timestamps: true,
    toJSON: { transform: handleDocTransform }
});

export const Applicant = mongoose.model<IApplicant>('applicants', applicantSchema);