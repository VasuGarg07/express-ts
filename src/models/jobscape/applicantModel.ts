import mongoose, { Document, Schema, Types } from "mongoose";
import { handleDocTransform } from "../../utils/utilities";

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
    twitter: string,
    youtube: string
    github: string;
    linkedin: string;
    website: string;
}

export interface IPreference {
    expectedSalary: number;
    jobType: 'full-time' | 'part-time' | 'contractual' | 'freelance' | 'internship';
    locations: string[];
    shift?: 'day' | 'night' | 'flexible';
    role?: string[];
    industry?: string[];
}

export interface IApplicant extends Document {
    userId: Types.ObjectId; // Reference to the User schema
    fullName: string;
    contactEmail: string;
    phoneNumber: string;

    photoUrl?: string;
    profileSummary?: string;
    resumeURL: string;
    skills: string[];
    languages: string[];
    preference: IPreference;

    experience?: IExperience[];
    education?: IEducation[];
    socialLinks?: Partial<ISocialLinks>;
}


const applicantSchema = new Schema<IApplicant>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "users", required: true },
        fullName: { type: String, required: true },
        contactEmail: { type: String, required: true },
        phoneNumber: { type: String, required: true },
        photoUrl: { type: String },
        profileSummary: { type: String },
        resumeURL: { type: String, required: true },
        skills: { type: [String], required: true },
        languages: { type: [String], required: true },

        preference: {
            expectedSalary: { type: Number, required: true },
            jobType: {
                type: String,
                enum: ["full-time", "part-time", "contractual", "freelance", "internship"],
                required: true,
            },
            locations: { type: [String], required: true },
            shift: { type: String, enum: ["day", "night", "flexible"] },
            role: { type: [String] },
            industry: { type: [String] },
        },
        experience: [
            {
                title: { type: String, required: true },
                company: { type: String, required: true },
                duration: { type: String, required: true },
                description: { type: String, required: true },
            },
        ],
        education: [
            {
                degree: { type: String, required: true },
                institution: { type: String, required: true },
                year: { type: String, required: true },
            },
        ],
        socialLinks: {
            twitter: { type: String },
            youtube: { type: String },
            github: { type: String },
            linkedin: { type: String },
            website: { type: String },
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: handleDocTransform
        },
    }
);

export const Applicant = mongoose.model<IApplicant>("applicants", applicantSchema);
