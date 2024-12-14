import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
        schema.parse(req.body);
        next();
    } catch (error: any) {
        res.status(400).json({
            success: false,
            errors: error.errors.map((err: any) => ({
                field: err.path[0],
                message: err.message,
            })),
        });
    }
};
