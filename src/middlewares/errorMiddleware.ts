import { Request, Response, NextFunction } from 'express';
import { ERROR_STRINGS } from '../utils/response.string';

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error('Error:', err.message);
    res.status(500).json({
        success: false,
        error: err.message || ERROR_STRINGS.ServerError
    });
};
