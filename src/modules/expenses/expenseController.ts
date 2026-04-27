import { NextFunction, Request, Response } from 'express';
import * as expenseService from './expenseService';
import { AuthenticatedRequest } from '../../types';
import { SUCCESS_STRINGS } from '../../utils/response.string';

export const addTransaction = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { title, amount, type, category, date, description } = req.body;
    const transaction = await expenseService.createTransaction(req.user!.id, {
      title, amount, type, category, date, description,
    });
    res.status(201).json({ message: SUCCESS_STRINGS.TransactionAdded, transaction });
  } catch (error) {
    next(error);
  }
};

export const updateTransaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, amount, type, category, date, description } = req.body;
    const transaction = await expenseService.editTransaction(req.params.id as string, {
      title, amount, type, category, date, description,
    });
    res.status(200).json({ message: SUCCESS_STRINGS.TranscationUpdated, transaction });
  } catch (error) {
    next(error);
  }
};

export const deleteTransaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await expenseService.removeTransaction(req.params.id as string);
    res.status(200).json({ message: SUCCESS_STRINGS.TransactionDeleted });
  } catch (error) {
    next(error);
  }
};

export const getAllTransactions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const transactions = await expenseService.fetchAllTransactions(req.user!.id);
    res.status(200).json({ transactions, count: transactions.length });
  } catch (error) {
    next(error);
  }
};

export const importTransactions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const transactions = await expenseService.bulkImportTransactions(req.user!.id, req.body);
    res.status(201).json({ message: 'Transactions Added', transactions });
  } catch (error) {
    next(error);
  }
};

export const clearAllTransactions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const deletedCount = await expenseService.clearTransactions(userId);
    res.status(200).json({
      message: `All transactions for user ${userId} have been deleted.`,
      deletedCount,
    });
  } catch (error) {
    next(error);
  }
};