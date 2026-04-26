import Expense, { IExpense } from './expenseModel';
import { ApiError } from '../../utils/ApiError';
import { ERROR_STRINGS } from '../../utils/response.string';

export const createTransaction = async (
  userId: string,
  data: { title: string; amount: number; type: string; category: string; date: Date; description?: string }
) => {
  const transaction = new Expense({ userId, ...data });
  await transaction.save();
  return transaction;
};

export const editTransaction = async (
  txnId: string,
  data: { title: string; amount: number; type: string; category: string; date: Date; description?: string }
) => {
  if (!txnId || txnId.trim() === '') {
    throw new ApiError(400, ERROR_STRINGS.InvalidTxnId);
  }

  const transaction = await Expense.findByIdAndUpdate(txnId, data, { new: true });
  if (!transaction) {
    throw new ApiError(404, ERROR_STRINGS.TransactionNotFound);
  }
  return transaction;
};

export const removeTransaction = async (txnId: string) => {
  if (!txnId || txnId.trim() === '') {
    throw new ApiError(400, ERROR_STRINGS.InvalidTxnId);
  }

  const transaction = await Expense.findByIdAndDelete(txnId);
  if (!transaction) {
    throw new ApiError(404, ERROR_STRINGS.TransactionNotFound);
  }
};

export const fetchAllTransactions = async (userId: string) => {
  const transactions = await Expense.find({ userId });
  return transactions;
};

export const bulkImportTransactions = async (userId: string, data: any) => {
  if (!Array.isArray(data)) {
    throw new ApiError(400, 'Request body must be an array of transactions');
  }

  const transactions: IExpense[] = data.map(transaction => ({ ...transaction, userId }));
  return Expense.insertMany(transactions);
};

export const clearTransactions = async (userId: string) => {
  const result = await Expense.deleteMany({ userId });
  return result.deletedCount;
};