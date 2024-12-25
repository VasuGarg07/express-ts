import { compare, hash } from 'bcrypt';

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
