import mongoose, { Document, Schema, Types } from "mongoose";
import { handleDocTransform } from "../../utils/utilities";

export interface IJobDetails {
    tags: string[];
    description: string;
    responsibilities: string[];
    requirements: string[];
    benefits: string[];
}

export interface IJob extends Partial<IJobDetails>, Document {
    postedBy: Types.ObjectId;
    title: string;
    location: string;
    jobLevel: "internship" | "entry-level" | "mid-level" | "senior-level" | "lead" | "manager";

    skillsRequired: string[];
    experienceRequired: string;
    salaryRange: string;
    employmentType: "full-time" | "part-time" | "contractual" | "freelance" | "internship";
    shiftType: 'day' | 'night' | 'flexible';
    vacancies: number;

    applicationDeadline?: number; // in seconds
    isFeatured?: boolean;
    isArchived?: boolean;
}


const jobSchema = new Schema<IJob>(
    {
        postedBy: { type: Schema.Types.ObjectId, ref: "employers", required: true },
        title: { type: String, required: true },
        location: { type: String, required: true },
        jobLevel: {
            type: String,
            enum: ["internship", "entry-level", "mid-level", "senior-level", "lead", "manager"],
            required: true
        },

        tags: { type: [String] },
        description: { type: String },
        responsibilities: { type: [String] },
        requirements: { type: [String] },
        benefits: { type: [String] },

        skillsRequired: { type: [String], required: true },
        experienceRequired: { type: String, required: true },
        salaryRange: { type: String, required: true },
        employmentType: {
            type: String,
            enum: ["full-time", "part-time", "contractual", "freelance", "internship"],
            required: true,
        },
        shiftType: {
            type: String,
            enum: ["day", "night", "flexible"],
            required: true,
        },
        vacancies: { type: Number, default: 1 },

        applicationDeadline: { type: Number },
        isArchived: { type: Boolean, default: false },
        isFeatured: { type: Boolean, default: false },
    },
    {
        timestamps: true,
        toJSON: {
            transform: handleDocTransform,
        },
    }
);

export const Job = mongoose.model<IJob>("jobs", jobSchema);
