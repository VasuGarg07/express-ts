import mongoose, { Document, Schema, Types } from "mongoose";
import { handleDocTransform } from "../../../utils/utilities";

const experienceSchema = new Schema({
    title: { type: String, required: true },
    company: { type: String, required: true },
    duration: { type: String, required: true },
    description: { type: String, required: true }
}, { _id: false });

const educationSchema = new Schema({
    degree: { type: String, required: true },
    institution: { type: String, required: true },
    year: { type: String, required: true }
}, { _id: false });

const socialLinksSchema = new Schema({
    twitter: { type: String },
    youtube: { type: String },
    github: { type: String },
    linkedin: { type: String },
    website: { type: String }
}, { _id: false });

const preferenceSchema = new Schema({
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

const applicationSchema = new Schema({
    jobId: { type: Schema.Types.ObjectId, ref: 'jobs', required: true },
    coverLetter: { type: String },
    status: {
        type: String,
        enum: ['pending', 'shortlisted', 'rejected', 'contacted', 'hired'],
        default: 'pending'
    },
    appliedAt: { type: Date, default: Date.now }
}, { _id: false });

const applicantSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'users', required: true, unique: true },
    fullName: { type: String, required: true },
    contactEmail: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    photoUrl: { type: String },
    profileSummary: { type: String },
    resumeURL: { type: String, required: true },
    skills: { type: [String], required: true },
    languages: { type: [String], required: true },
    experience: [experienceSchema],
    education: [educationSchema],
    preference: { type: preferenceSchema, required: true },
    socialLinks: socialLinksSchema,

    // User Actions
    savedJobs: [{ type: Schema.Types.ObjectId, ref: 'jobs' }],
    applications: [applicationSchema]
}, {
    timestamps: true,
    toJSON: { transform: handleDocTransform }
});

export const Applicant = mongoose.model('applicants', applicantSchema);