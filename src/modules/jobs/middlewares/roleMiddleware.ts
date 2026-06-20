import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../../../types";
import { ApiError } from "../../../utils/ApiError";
import { Applicant } from "../models/applicantModel";
import { Employer } from "../models/employerModel";

// Auto-detects role from DB and attaches to locals
export const extractRole = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new ApiError(401, "Unauthorized");
        }

        const applicant = await Applicant.findOne({ userId }).select('_id').lean();
        if (applicant) {
            res.locals.role = "applicant";
            res.locals.profileId = applicant._id.toString();
            next();
            return;
        }

        const employer = await Employer.findOne({ userId }).select('_id').lean();
        if (employer) {
            res.locals.role = "employer";
            res.locals.profileId = employer._id.toString();
            next();
            return;
        }

        throw new ApiError(404, "Profile not found");
    } catch (error) {
        next(error);
    }
};

// Ensures user has applicant profile
export const isApplicant = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new ApiError(401, "Unauthorized");
        }

        const applicant = await Applicant.findOne({ userId }).select('_id').lean();
        if (!applicant) {
            throw new ApiError(403, "Applicant profile required");
        }

        res.locals.role = "applicant";
        res.locals.profileId = applicant._id.toString();
        next();
    } catch (error) {
        next(error);
    }
};

// Ensures user has employer profile
export const isEmployer = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new ApiError(401, "Unauthorized");
        }

        const employer = await Employer.findOne({ userId }).select('_id').lean();
        if (!employer) {
            throw new ApiError(403, "Employer profile required");
        }

        res.locals.role = "employer";
        res.locals.profileId = employer._id.toString();
        next();
    } catch (error) {
        next(error);
    }
};
