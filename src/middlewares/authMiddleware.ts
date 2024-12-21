import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../types';

const SECRET_KEY = process.env.JWT_SECRET || 'secretkey';

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY) as Record<string, any>; // Use a flexible type for the decoded token
        req.user = decoded; // Attach the entire decoded payload to req.user
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};
