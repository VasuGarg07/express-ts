import { eq, and } from 'drizzle-orm';
import { db } from '../../config/postgres';
import { expenses } from './schema';
import { ApiError } from '../../utils/ApiError';
import { ERROR_STRINGS } from '../../utils/response.string';
import { validateObjectId } from '../../utils/utilities';

interface TransactionInput {
  title: string;
  amount: number;
  type: string;
  category: string;
  date: number;
  description?: string;
}

export const createTransaction = async (userId: string, data: TransactionInput) => {
  validateObjectId(userId, ERROR_STRINGS.InvalidUserId);

  const [transaction] = await db
    .insert(expenses)
    .values({ userId, ...data })
    .returning();

  return transaction;
};

export const editTransaction = async (
  txnId: string,
  userId: string,
  data: TransactionInput
) => {
  if (!txnId || txnId.trim() === '') {
    throw new ApiError(400, ERROR_STRINGS.InvalidTxnId);
  }
  validateObjectId(userId, ERROR_STRINGS.InvalidUserId);

  const id = Number(txnId);

  const [transaction] = await db
    .update(expenses)
    .set(data)
    .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
    .returning();

  if (!transaction) {
    throw new ApiError(404, ERROR_STRINGS.TransactionNotFound);
  }
  return transaction;
};

export const removeTransaction = async (txnId: string, userId: string) => {
  if (!txnId || txnId.trim() === '') {
    throw new ApiError(400, ERROR_STRINGS.InvalidTxnId);
  }
  validateObjectId(userId, ERROR_STRINGS.InvalidUserId);

  const id = Number(txnId);

  const deleted = await db
    .delete(expenses)
    .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
    .returning({ id: expenses.id });

  if (deleted.length === 0) {
    throw new ApiError(404, ERROR_STRINGS.TransactionNotFound);
  }
};

export const fetchAllTransactions = async (userId: string) => {
  validateObjectId(userId, ERROR_STRINGS.InvalidUserId);

  return db.select().from(expenses).where(eq(expenses.userId, userId));
};

export const clearTransactions = async (userId: string) => {
  validateObjectId(userId, ERROR_STRINGS.InvalidUserId);

  const deleted = await db
    .delete(expenses)
    .where(eq(expenses.userId, userId))
    .returning({ id: expenses.id });

  return deleted.length;
};

export const bulkImportTransactions = async (userId: string, data: any) => {
  validateObjectId(userId, ERROR_STRINGS.InvalidUserId);

  if (!Array.isArray(data)) {
    throw new ApiError(400, 'Request body must be an array of transactions');
  }

  if (data.length === 0) {
    return [];
  }

  return db
    .insert(expenses)
    .values(data.map((transaction) => ({ userId, ...transaction })))
    .returning();
};
