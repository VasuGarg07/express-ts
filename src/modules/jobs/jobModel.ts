import mongoose, { Document, Schema, Types } from "mongoose";
import { handleDocTransform } from "../../utils/utilities";

// ==================== INTERFACES ====================

export interface IJobApplication {
    applicantId: Types.ObjectId;
    coverLetter?: string;
    appliedAt: Date;
}

export interface IJob extends Document {
    postedBy: Types.ObjectId;

    // Basic Info
    title: string;
    location: string;
    jobLevel: 'internship' | 'entry-level' | 'mid-level' | 'senior-level' | 'lead' | 'manager';
    vacancies: number;

    // Employment Details
    employmentType: 'full-time' | 'part-time' | 'contractual' | 'freelance' | 'internship';
    shiftType: 'day' | 'night' | 'flexible';
    salaryRange: string;
    experienceRequired: string;

    // Content
    description: string;
    requirements: string;
    responsibilities?: string;
    benefits?: string;

    // Skills & Tags
    skillsRequired: string[];
    tags?: string[];

    // Status
    isArchived: boolean;

    // Applications
    applications: IJobApplication[];
}

// ==================== SCHEMA ====================

const jobApplicationSchema = new Schema<IJobApplication>({
    applicantId: { type: Schema.Types.ObjectId, ref: 'applicants', required: true },
    coverLetter: { type: String },
    appliedAt: { type: Date, default: Date.now }
}, { _id: false });

const jobSchema = new Schema<IJob>({
    postedBy: { type: Schema.Types.ObjectId, ref: 'employers', required: true },

    // Basic Info
    title: { type: String, required: true },
    location: { type: String, required: true },
    jobLevel: {
        type: String,
        enum: ['internship', 'entry-level', 'mid-level', 'senior-level', 'lead', 'manager'],
        required: true
    },
    vacancies: { type: Number, required: true, default: 1 },

    // Employment Details
    employmentType: {
        type: String,
        enum: ['full-time', 'part-time', 'contractual', 'freelance', 'internship'],
        required: true
    },
    shiftType: {
        type: String,
        enum: ['day', 'night', 'flexible'],
        required: true
    },
    salaryRange: { type: String, required: true },
    experienceRequired: { type: String, required: true },

    // Content
    description: { type: String, required: true },
    requirements: { type: String, required: true },
    responsibilities: { type: String },
    benefits: { type: String },

    // Skills & Tags
    skillsRequired: { type: [String], required: true },
    tags: { type: [String] },

    // Status
    isArchived: { type: Boolean, default: false },

    // Applications
    applications: [jobApplicationSchema]
}, {
    timestamps: true,
    toJSON: { transform: handleDocTransform }
});

export const Job = mongoose.model<IJob>('jobs', jobSchema);