import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../../types";
import { Applicant } from "./applicantModel";
import { Employer } from "./employerModel";

// Auto-detects role from DB and attaches to locals
export const extractRole = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        // Check if applicant
        const applicant = await Applicant.findOne({ userId }).select('_id').lean();
        if (applicant) {
            res.locals.role = "applicant";
            res.locals.profileId = applicant._id.toString();
            next();
            return;
        }

        // Check if employer
        const employer = await Employer.findOne({ userId }).select('_id').lean();
        if (employer) {
            res.locals.role = "employer";
            res.locals.profileId = employer._id.toString();
            next();
            return;
        }

        // No profile found
        res.status(404).json({ error: "Profile not found" });
    } catch (error) {
        console.error("Extract Role Error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// Ensures user has applicant profile
export const isApplicant = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const applicant = await Applicant.findOne({ userId }).select('_id').lean();

        if (!applicant) {
            res.status(403).json({ error: "Applicant profile required" });
            return;
        }

        res.locals.role = "applicant";
        res.locals.profileId = applicant._id.toString();
        next();
    } catch (error) {
        console.error("Is Applicant Error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// Ensures user has employer profile
export const isEmployer = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const employer = await Employer.findOne({ userId }).select('_id').lean();

        if (!employer) {
            res.status(403).json({ error: "Employer profile required" });
            return;
        }

        res.locals.role = "employer";
        res.locals.profileId = employer._id.toString();
        next();
    } catch (error) {
        console.error("Is Employer Error:", error);
        res.status(500).json({ error: "Server error" });
    }
};