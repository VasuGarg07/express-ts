import mongoose, { Document, Schema, Types } from "mongoose";
import { handleDocTransform } from "../../utils/utilities";

export interface IJobDetails {
    description: string;
    responsibilities: string[];
    requirements: string[];
    benefits: string[];
}

export interface IJob extends Document, Partial<IJobDetails> {
    postedBy: Types.ObjectId;
    title: string;
    location: string;

    skillsRequired: string[];
    experienceRequired: string;
    salaryRange: string;
    employmentType: "full-time" | "part-time" | "contractual" | "freelance" | "internship";
    shiftType: 'day' | 'night' | 'flexible';

    applicationDeadline?: number; // in seconds
    isArchived?: boolean;
}


const jobSchema = new Schema<IJob>(
    {
        postedBy: { type: Schema.Types.ObjectId, ref: "employers", required: true },
        title: { type: String, required: true },
        location: { type: String, required: true },

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

        description: { type: String },
        responsibilities: { type: [String] },
        requirements: { type: [String] },
        benefits: { type: [String] },

        applicationDeadline: { type: Number },
        isArchived: { type: Boolean, default: false },
    },
    {
        timestamps: true,
        toJSON: {
            transform: handleDocTransform,
        },
    }
);

export const Job = mongoose.model<IJob>("jobs", jobSchema);
