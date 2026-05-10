import { NextFunction, Response } from "express";
import { eq } from "drizzle-orm";
import { AuthenticatedRequest } from "../../../types";
import { ApiError } from "../../../utils/ApiError";
import { db } from "../../../config/postgres";
import { applicants, employers } from "../schema";

// Auto-detects role from DB and attaches to locals
export const extractRole = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new ApiError(401, "Unauthorized");
        }

        const [applicant] = await db.select({ id: applicants.id }).from(applicants).where(eq(applicants.userId, userId)).limit(1);
        if (applicant) {
            res.locals.role = "applicant";
            res.locals.profileId = String(applicant.id);
            next();
            return;
        }

        const [employer] = await db.select({ id: employers.id }).from(employers).where(eq(employers.userId, userId)).limit(1);
        if (employer) {
            res.locals.role = "employer";
            res.locals.profileId = String(employer.id);
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

        const [applicant] = await db.select({ id: applicants.id }).from(applicants).where(eq(applicants.userId, userId)).limit(1);
        if (!applicant) {
            throw new ApiError(403, "Applicant profile required");
        }

        res.locals.role = "applicant";
        res.locals.profileId = String(applicant.id);
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

        const [employer] = await db.select({ id: employers.id }).from(employers).where(eq(employers.userId, userId)).limit(1);
        if (!employer) {
            throw new ApiError(403, "Employer profile required");
        }

        res.locals.role = "employer";
        res.locals.profileId = String(employer.id);
        next();
    } catch (error) {
        next(error);
    }
};
