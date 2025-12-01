import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../../types";
import { JobRoleTypes } from "../../utils/constants";
import { ERROR_STRINGS } from "../../utils/response.string";
import { Applicant } from "./applicantModel";
import { Employer } from "./employerModel";

export const isAuthorized = (allowedRoles: JobRoleTypes[]) => async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const headerValue = req.headers["x-profilerole"] as string;

        if (!headerValue) {
            res.status(400).json({
                success: false,
                error: "X-ProfileRole header is missing in the request",
            });
            return;
        }

        // Split role and profileId
        const [role, profileId] = headerValue.split("_");

        if (!role || !profileId) {
            res.status(400).json({
                success: false,
                error: "X-ProfileRole header format is invalid. Expected format: <role>_<profileId>",
            });
            return;
        }

        // Check if the role is allowed
        if (!allowedRoles.includes(role as JobRoleTypes)) {
            res.status(403).json({
                success: false,
                error: ERROR_STRINGS.ForbiddenAction,
            });
            return;
        }

        // Verify if the profile exists in the corresponding schema
        let profileExists;

        if (role === "applicant") {
            profileExists = await Applicant.exists({ _id: profileId });
        } else if (role === "employer") {
            profileExists = await Employer.exists({ _id: profileId });
        }

        if (!profileExists) {
            res.status(404).json({
                success: false,
                error: `Profile not found for ${role} with ID: ${profileId}`,
            });
            return;
        }

        // Attach profileId to the request
        req.profileId = profileId;

        // Proceed to the next middleware
        next();
    } catch (error) {
        console.error("Role Authorization Middleware Error:", error);
        res.status(500).json({
            success: false,
            error: ERROR_STRINGS.ServerError,
        });
    }
};
