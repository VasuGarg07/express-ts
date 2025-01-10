import mongoose, { Document, Schema, Types } from "mongoose";
import { handleDocTransform } from "../../utils/utilities";

export interface IApplication extends Document {
    jobId: Types.ObjectId;
    applicantId: Types.ObjectId;
    status: "pending" | "shortlisted" | "rejected" | "contacted" | "hired";
    coverLetter?: string;
    interviewDate?: number; // in seconds 
    feedback?: string;
    notes?: string;
}

const applicationSchema = new Schema<IApplication>(
    {
        jobId: { type: Schema.Types.ObjectId, ref: "jobs", required: true },
        applicantId: { type: Schema.Types.ObjectId, ref: "applicants", required: true },
        status: {
            type: String,
            enum: ["pending", "shortlisted", "rejected", "contacted", "hired"],
            default: "pending",
        },
        coverLetter: { type: String },
        interviewDate: { type: Number }, // in seconds
        feedback: { type: String },
        notes: { type: String },
    },
    {
        timestamps: true,
        toJSON: {
            transform: handleDocTransform,
        },
    }
);

export const Application = mongoose.model<IApplication>("applications", applicationSchema);
