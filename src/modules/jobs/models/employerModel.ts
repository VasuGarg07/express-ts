import mongoose, { Schema } from "mongoose";
import { handleDocTransform } from "../../../utils/utilities";

const socialLinksSchema = new Schema({
    facebook: { type: String },
    twitter: { type: String },
    instagram: { type: String },
    linkedin: { type: String },
    youtube: { type: String }
}, { _id: false });

const employerSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'users', required: true, unique: true },
    companyName: { type: String, required: true },
    logoURL: { type: String, required: true },
    industry: { type: String, required: true },
    address: { type: String, required: true },
    websiteUrl: { type: String },
    employeeStrength: { type: String, required: true },
    yearOfEstablishment: { type: String, required: true },
    contactEmail: { type: String, required: true, unique: true },
    contactNumber: { type: String, required: true, unique: true },
    companyOverview: { type: String },
    companyVision: { type: String },
    socialLinks: socialLinksSchema
}, {
    timestamps: true,
    toJSON: { transform: handleDocTransform }
});

export const Employer = mongoose.model('employers', employerSchema);