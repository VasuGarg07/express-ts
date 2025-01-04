import mongoose, { Document, Schema, Types } from "mongoose";
import { handleDocTransform } from "../../utils/utilities";

export interface ISavedJob extends Document {
    applicantId: Types.ObjectId;
    jobId: Types.ObjectId;
}

const savedJobSchema = new Schema<ISavedJob>(
    {
        applicantId: { type: Schema.Types.ObjectId, ref: "applicants", required: true },
        jobId: { type: Schema.Types.ObjectId, ref: "jobs", required: true },
    },
    {
        timestamps: true,
        toJSON: {
            transform: handleDocTransform,
        },
    }
);

export const SavedJob = mongoose.model<ISavedJob>("savedJobs", savedJobSchema);
