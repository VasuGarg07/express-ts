import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny  } from 'zod';

export const validate = (schema: ZodTypeAny ) => (req: Request, res: Response, next: NextFunction) => {
    try {
        schema.parse(req.body);
        next();
    } catch (error: any) {
        res.status(400).json({
            success: false,
            errors: error.issues.map((err: any) => ({
                field: err.path[0],
                message: err.message,
            })),
        });
    }
};
