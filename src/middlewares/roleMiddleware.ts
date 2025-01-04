import { Request, Response, NextFunction } from "express";
import { ERROR_STRINGS } from "../utils/response.string";
import { JobscapeUserRole } from "../utils/types";
import { AuthenticatedRequest } from "../types";

export const isAuthorized = (allowedRoles: JobscapeUserRole[]) => (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { role } = req.body;

        if (!role) {
            res.status(400).json({
                success: false,
                error: "Role is missing in the request body",
            });
        }

        if (allowedRoles.includes(role)) {
            next();
        }

        res.status(403).json({
            success: false,
            error: ERROR_STRINGS.ForbiddenAction,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: ERROR_STRINGS.ServerError,
        });
    }
};
