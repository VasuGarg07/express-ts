import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { applicantUpdateSchema, employerUpdateSchema } from "./jobValidators";

// Validates request body against a Zod schema
export const validate = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }));
                res.status(400).json({ error: "Validation failed", details: errors });
                return;
            }
            res.status(500).json({ error: "Validation error" });
        }
    };
};

// Validates based on user role (for profile updates)
export const roleBasedValidate = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const role = res.locals.role;

    if (!role) {
        res.status(400).json({ error: "Role not found" });
        return;
    }

    let schema: ZodSchema;

    if (role === "applicant") {
        schema = applicantUpdateSchema;
    } else if (role === "employer") {
        schema = employerUpdateSchema;
    } else {
        res.status(400).json({ error: "Invalid role" });
        return;
    }

    try {
        schema.parse(req.body);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));
            res.status(400).json({ error: "Validation failed", details: errors });
            return;
        }
        res.status(500).json({ error: "Validation error" });
    }
};