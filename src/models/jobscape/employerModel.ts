import mongoose, { Document, Schema, Types } from "mongoose";
import { handleDocTransform } from "../../utils/utilities";

export interface ISocialLinks {
    facebook: string;
    twitter: string;
    instagram: string;
    linkedin: string;
    youtube: string
}

export interface IEmployer extends Document {
    userId: Types.ObjectId;

    companyName: string;
    logoURL: string;
    contactNumber: string;
    email: string;
    address: string;
    websiteUrl?: string;

    industry: string;
    employeeStrength: string;
    yearOfEstablishMent: string;
    companyOverview?: string;
    companyVision?: string;

    socialLinks?: Partial<ISocialLinks>;
}

const employerSchema = new Schema<IEmployer>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "users", required: true },
        companyName: { type: String, required: true },
        logoURL: { type: String, required: true },
        contactNumber: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        industry: { type: String, required: true },
        address: { type: String, required: true },
        employeeStrength: { type: String, required: true },
        yearOfEstablishMent: { type: String, required: true },
        websiteUrl: { type: String },
        companyOverview: { type: String },
        companyVision: { type: String },

        socialLinks: {
            facebook: { type: String },
            twitter: { type: String },
            instagram: { type: String },
            linkedin: { type: String },
            youtube: { type: String }
        }
    },
    {
        timestamps: true,
        toJSON: {
            transform: handleDocTransform
        },
    }
);

export const Employer = mongoose.model<IEmployer>("employers", employerSchema);
