import mongoose, { Document, Schema, Types } from "mongoose";
import { handleDocTransform } from "../../utils/utilities";

// ==================== INTERFACES ====================

export interface ISocialLinks {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
}

export interface IEmployer extends Document {
    userId: Types.ObjectId;

    // Company Info
    companyName: string;
    logoURL: string;
    industry: string;
    address: string;
    websiteUrl?: string;
    employeeStrength: string;
    yearOfEstablishment: string;

    // Contact
    contactEmail: string;
    contactNumber: string;

    // About
    companyOverview?: string;
    companyVision?: string;

    // Social
    socialLinks?: ISocialLinks;
}

// ==================== SCHEMA ====================

const socialLinksSchema = new Schema<ISocialLinks>({
    facebook: { type: String },
    twitter: { type: String },
    instagram: { type: String },
    linkedin: { type: String },
    youtube: { type: String }
}, { _id: false });

const employerSchema = new Schema<IEmployer>({
    userId: { type: Schema.Types.ObjectId, ref: 'users', required: true, unique: true },

    // Company Info
    companyName: { type: String, required: true },
    logoURL: { type: String, required: true },
    industry: { type: String, required: true },
    address: { type: String, required: true },
    websiteUrl: { type: String },
    employeeStrength: { type: String, required: true },
    yearOfEstablishment: { type: String, required: true },

    // Contact
    contactEmail: { type: String, required: true, unique: true },
    contactNumber: { type: String, required: true, unique: true },

    // About
    companyOverview: { type: String },
    companyVision: { type: String },

    // Social
    socialLinks: socialLinksSchema
}, {
    timestamps: true,
    toJSON: { transform: handleDocTransform }
});

export const Employer = mongoose.model<IEmployer>('employers', employerSchema);