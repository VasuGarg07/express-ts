import mongoose, { Schema } from "mongoose";
import { handleDocTransform } from "../../../utils/utilities";

const jobApplicationSchema = new Schema({
    applicantId: { type: Schema.Types.ObjectId, ref: 'applicants', required: true },
    coverLetter: { type: String },
    status: {
        type: String,
        enum: ['pending', 'shortlisted', 'rejected', 'contacted', 'hired'],
        default: 'pending'
    },
    appliedAt: { type: Date, default: Date.now }
}, { _id: false });

const jobSchema = new Schema({
    postedBy: { type: Schema.Types.ObjectId, ref: 'employers', required: true },
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
    description: { type: String, required: true },
    requirements: { type: [String], required: true },
    responsibilities: { type: [String] },
    benefits: { type: [String] },
    skillsRequired: { type: [String], required: true },
    tags: { type: [String] },
    isArchived: { type: Boolean, default: false },

    // Applications
    applications: [jobApplicationSchema]
}, {
    timestamps: true,
    toJSON: { transform: handleDocTransform }
});

export const Job = mongoose.model('jobs', jobSchema);