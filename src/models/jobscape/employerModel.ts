import mongoose, { Document, Schema, Types } from "mongoose";
import { handleDocTransform } from "../../utils/utilities";

export interface IEmployer extends Document {
    userId: Types.ObjectId;
    companyName: string;
    logoURL: string;
    contactNumber: string;
    industry: string;
    address: string;
    websiteUrl?: string;
    companyOverview?: string;
    employeeStrength?: number;
}

const employerSchema = new Schema<IEmployer>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "users", required: true },
        companyName: { type: String, required: true },
        logoURL: { type: String, required: true },
        contactNumber: { type: String, required: true, unique: true },
        industry: { type: String, required: true },
        address: { type: String, required: true },
        websiteUrl: { type: String },
        companyOverview: { type: String },
        employeeStrength: { type: Number },
    },
    {
        timestamps: true,
        toJSON: {
            transform: handleDocTransform
        },
    }
);

export const Employer = mongoose.model<IEmployer>("employers", employerSchema);
