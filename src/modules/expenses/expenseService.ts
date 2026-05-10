import Expense, { IExpense } from './expenseModel';
import { ApiError } from '../../utils/ApiError';
import { ERROR_STRINGS } from '../../utils/response.string';
import pool from '../../config/postgres';

export const expenseMapper = (row: any) => {
  const { user_id, ...rest } = row;
  return {
    ...rest,
    userId: user_id,
    amount: parseFloat(row.amount),
    date: parseInt(row.date),
  };
};


export const createTransaction = async (
  userId: string,
  data: { title: string; amount: number; type: string; category: string; date: Date; description?: string }
) => {
  const { title, amount, type, category, date, description } = data;
  const transaction = await pool.query(`
      INSERT INTO expenses (
        user_id, title, amount, type, category, date, description
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7
      ) RETURNING *;
    `, [userId, title, amount, type, category, date, description]);
  return expenseMapper(transaction.rows[0]);
};

export const editTransaction = async (
  txnId: string,
  data: { title: string; amount: number; type: string; category: string; date: Date; description?: string }
) => {
  if (!txnId || txnId.trim() === '') {
    throw new ApiError(400, ERROR_STRINGS.InvalidTxnId);
  }

  const { title, amount, type, category, date, description } = data;
  const transaction = await pool.query(`
      UPDATE expenses 
      SET title = $2, amount = $3, type = $4, category=$5, date=$6, description=$7
      WHERE id = $1
      RETURNING *;
    `, [txnId, title, amount, type, category, date, description]);
  
  if (transaction.rowCount === 0) {
    throw new ApiError(404, ERROR_STRINGS.TransactionNotFound);
  }
  return expenseMapper(transaction.rows[0]);
};

export const removeTransaction = async (txnId: string) => {
  if (!txnId || txnId.trim() === '') {
    throw new ApiError(400, ERROR_STRINGS.InvalidTxnId);
  }

  const transaction = await pool.query(`
    DELETE FROM expenses WHERE id = $1;
  `, [txnId]);
  if (transaction.rowCount === 0) {
    throw new ApiError(404, ERROR_STRINGS.TransactionNotFound);
  }
};

export const fetchAllTransactions = async (userId: string) => {
  const transactions = await pool.query(`
    SELECT * FROM expenses WHERE user_id = $1;
  `, [userId]);
  return transactions.rows.map(expenseMapper);
};

export const clearTransactions = async (userId: string) => {
  const transaction = await pool.query(`
    DELETE FROM expenses WHERE user_id = $1;
  `, [userId]);
  return transaction.rowCount;
};

export const bulkImportTransactions = async (userId: string, data: any) => {
  if (!Array.isArray(data)) {
    throw new ApiError(400, 'Request body must be an array of transactions');
  }

  const values: any[] = [];
  const placeholders = data.map((transaction, index) => {
    const offset = index * 7;
    values.push(userId, transaction.title, transaction.amount, transaction.type, transaction.category, transaction.date, transaction.description);
    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`;
  });

  const result = await pool.query(`
    INSERT INTO expenses (user_id, title, amount, type, category, date, description)
    VALUES ${placeholders.join(', ')}
    RETURNING *;
  `, values);

  return result.rows.map(expenseMapper);
};
