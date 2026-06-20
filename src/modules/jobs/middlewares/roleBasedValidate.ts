import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { applicantUpdateSchema, employerUpdateSchema } from "../validators/jobValidators";
import { validate } from "../../../middlewares/validationMiddleware";

// Picks the update schema based on the role resolved by extractRole, then validates.
export const roleBasedValidate = (req: Request, res: Response, next: NextFunction) => {
    const role = res.locals.role;

    const schema: ZodSchema | undefined =
        role === "applicant" ? applicantUpdateSchema :
        role === "employer" ? employerUpdateSchema :
        undefined;

    if (!schema) {
        res.status(400).json({ error: "Invalid role" });
        return;
    }

    return validate(schema)(req, res, next);
};
