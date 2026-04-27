import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof ApiError) {
        res.status(err.statusCode).json({ error: err.message, ...err.data });
        return;
    }
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
};