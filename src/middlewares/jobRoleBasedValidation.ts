import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { applicantUpdateSchema, employerUpdateSchema } from "../validators/jobscapeValidators";
import { validate } from './validationMiddleware';
import { ERROR_STRINGS } from "../utils/response.string";

export const jobRoleBasedValidation = (req: Request, res: Response, next: NextFunction) => {
    const role = req.headers["role"] as string;

    if (!role) {
        res.status(400).json({ error: ERROR_STRINGS.RoleNotFound });
        return;
    }

    let schema: ZodSchema;
    if (role === "applicant") {
        schema = applicantUpdateSchema;
    } else if (role === "employer") {
        schema = employerUpdateSchema;
    } else {
        res.status(400).json({ error: ERROR_STRINGS.InvalidRole });
        return;
    }

    // Use the validate middleware to parse and validate the body
    const validateMiddleware = validate(schema);
    validateMiddleware(req, res, next);
};
