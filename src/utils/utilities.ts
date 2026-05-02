import { compare, hash } from 'bcrypt';
import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from '../types';
import crypto from 'crypto';
import { Types } from 'mongoose';
import { ApiError } from './ApiError';

interface PaginationQuery {
    page?: string;
    limit?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
    };
}

export const hashData = async (data: string) => hash(data, 10);
export const compareData = async (data: string, hashedData: string) => compare(data, hashedData);

export const getPaginationParams = (query: PaginationQuery) => {
    const page = Math.max(1, parseInt(query.page || '1'));
    const limit = Math.max(1, Math.min(100, parseInt(query.limit || '10'))); // Default 10, max 100
    const skip = (page - 1) * limit;

    return { page, limit, skip };
};

export const handleDocTransform = <T>(doc: T, ret: any): T => {
    const { _id, __v, createdAt, updatedAt, ...rest } = ret;
    return { 
        id: _id,
        createdAt: createdAt.getTime(),
        updatedAt: updatedAt.getTime(),
        ...rest 
    };
}


export const asyncHandler = (
    handler: (req: Request | AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>
) => {
    return async (req: Request | AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            await handler(req, res, next);
        } catch (error) {
            next(error);
        }
    };
};

export const generateShareUrl = (): string => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${randomStr}`;
};

export const generateId = (length = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, b => chars[b % chars.length]).join('');
}

export const validateObjectId = (id: string, errorMessage: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(400, errorMessage);
  }
};

export const hashToken = (token: string): string => {
    return crypto.createHash('sha256').update(token).digest('hex');
};