import { NextFunction, Response, Request } from 'express';
import { AuthenticatedRequest } from '../types';
import Expense, { IExpense } from '../models/expenseModel';
import { ERROR_STRINGS, SUCCESS_STRINGS } from '../utils/response.string';
import { Types } from 'mongoose';

export const addTransaction = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { title, amount, type, category, date, description } = req.body;

    try {
        const transaction = new Expense({ userId, title, amount, type, category, date, description })
        await transaction.save();
        res.status(201).json({ message: SUCCESS_STRINGS.TransactionAdded, transaction });
    } catch (error) {
        next(error);
    }
}

export const updateTransaction = async (req: Request, res: Response, next: NextFunction) => {
    const txnId = req.params.id;
    const { title, amount, type, category, date, description } = req.body;

    // Validate txnId
    if (!txnId || txnId.trim() === "") {
        res.status(404).json({ error: ERROR_STRINGS.InvalidTxnId });
        return;
    }

    try {
        const transaction = await Expense.findByIdAndUpdate(
            txnId,
            { title, amount, type, category, date, description },
            { new: true }
        );

        if (!transaction) {
            res.status(404).json({ error: ERROR_STRINGS });
        } else {
            res.status(200).json({ message: SUCCESS_STRINGS.TranscationUpdated, transaction });
        }
    } catch (error) {
        next(error);
    }
}

export const deleteTransaction = async (req: Request, res: Response, next: NextFunction) => {
    const txnId = req.params.id;

    // Validate txnId
    if (!txnId || txnId.trim() === "") {
        res.status(404).json({ error: ERROR_STRINGS.InvalidTxnId });
        return;
    }

    try {
        const transaction = await Expense.findByIdAndDelete(txnId);

        if (!transaction) {
            res.status(404).json({ error: ERROR_STRINGS.TransactionNotFound });
        } else {
            res.status(200).json({ message: SUCCESS_STRINGS.TransactionDeleted });
        }
    } catch (error) {
        next(error)
    }
}

export const getAllTransactions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;

    try {
        const transactions = await Expense.find({ userId });

        if (!transactions || !transactions.length) {
            res.status(200).json({
                transactions: [],
                count: 0
            });
            return;
        }

        res.status(200).json({
            transactions,
            count: transactions.length
        });
    } catch (error) {
        next(error);
    }
}

export const importTransactions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const data = req.body;

    if (!Array.isArray(data)) {
        res.status(400).json({ message: 'Request body must be an array of transactions' });
        return
    }

    const transactions: IExpense[] = data.map(transaction => ({
        ...transaction,
        userId
    }))

    try {
        const createdTransactions = await Expense.insertMany(transactions);

        res.status(201).json({
            message: "Transactions Added",
            transactions: createdTransactions,
        });
    } catch (error) {
        next(error);
    }
}

export const clearAllTransactions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    try {
        const result = await Expense.deleteMany({ userId });

        res.status(200).json({
            message: `All transactions for user ${userId} have been deleted.`,
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        next(error);
    }
};