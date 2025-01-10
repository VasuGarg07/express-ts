import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
    user?: Record<string, any>; // Generalized user object
    profileId?: string;
}
