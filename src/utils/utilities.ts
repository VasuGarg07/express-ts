import { compare, hash } from 'bcrypt';

export const hashData = async (data: string) => hash(data, 10);
export const compareData = async (data: string, hashedData: string) => compare(data, hashedData);
