import * as expenseService from '../../src/modules/expenses/expenseService';
import Expense from '../../src/modules/expenses/expenseModel';
import { ERROR_STRINGS } from '../../src/utils/response.string';

jest.mock('../../src/modules/expenses/expenseModel');

describe('expenseService', () => {

  const mockTxnData = {
    title: 'Coffee',
    amount: 5.5,
    type: 'expense',
    category: 'food',
    date: new Date('2024-01-01'),
    description: 'Morning coffee',
  };

  // ==================== createTransaction ====================
  describe('createTransaction', () => {
    it('should create and save a new transaction', async () => {
      const mockSave = jest.fn().mockResolvedValue({});
      (Expense as any).mockImplementation((data: any) => ({ ...data, save: mockSave }));

      const result = await expenseService.createTransaction('user-1', mockTxnData);

      expect(result).toMatchObject({ userId: 'user-1', ...mockTxnData });
      expect(mockSave).toHaveBeenCalled();
    });
  });

  // ==================== editTransaction ====================
  describe('editTransaction', () => {
    it('should update transaction when found', async () => {
      const updated = { _id: 'txn-1', ...mockTxnData };
      (Expense.findByIdAndUpdate as jest.Mock).mockResolvedValue(updated);

      const result = await expenseService.editTransaction('txn-1', mockTxnData);

      expect(result).toEqual(updated);
      expect(Expense.findByIdAndUpdate).toHaveBeenCalledWith(
        'txn-1',
        mockTxnData,
        { new: true }
      );
    });

    it('should throw 400 when txnId is empty', async () => {
      await expect(
        expenseService.editTransaction('', mockTxnData)
      ).rejects.toMatchObject({
        statusCode: 400,
        message: ERROR_STRINGS.InvalidTxnId,
      });
    });

    it('should throw 400 when txnId is whitespace', async () => {
      await expect(
        expenseService.editTransaction('   ', mockTxnData)
      ).rejects.toMatchObject({
        statusCode: 400,
        message: ERROR_STRINGS.InvalidTxnId,
      });
    });

    it('should throw 404 when transaction does not exist', async () => {
      (Expense.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      await expect(
        expenseService.editTransaction('missing-id', mockTxnData)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: ERROR_STRINGS.TransactionNotFound,
      });
    });
  });

  // ==================== removeTransaction ====================
  describe('removeTransaction', () => {
    it('should delete transaction when found', async () => {
      (Expense.findByIdAndDelete as jest.Mock).mockResolvedValue({ _id: 'txn-1' });

      await expenseService.removeTransaction('txn-1');

      expect(Expense.findByIdAndDelete).toHaveBeenCalledWith('txn-1');
    });

    it('should throw 400 when txnId is empty', async () => {
      await expect(expenseService.removeTransaction('')).rejects.toMatchObject({
        statusCode: 400,
        message: ERROR_STRINGS.InvalidTxnId,
      });
    });

    it('should throw 400 when txnId is whitespace', async () => {
      await expect(expenseService.removeTransaction('   ')).rejects.toMatchObject({
        statusCode: 400,
        message: ERROR_STRINGS.InvalidTxnId,
      });
    });

    it('should throw 404 when transaction does not exist', async () => {
      (Expense.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      await expect(
        expenseService.removeTransaction('missing-id')
      ).rejects.toMatchObject({
        statusCode: 404,
        message: ERROR_STRINGS.TransactionNotFound,
      });
    });
  });

  // ==================== fetchAllTransactions ====================
  describe('fetchAllTransactions', () => {
    it('should return all transactions for the user', async () => {
      const transactions = [
        { _id: '1', title: 'Coffee' },
        { _id: '2', title: 'Lunch' },
      ];
      (Expense.find as jest.Mock).mockResolvedValue(transactions);

      const result = await expenseService.fetchAllTransactions('user-1');

      expect(result).toEqual(transactions);
      expect(Expense.find).toHaveBeenCalledWith({ userId: 'user-1' });
    });

    it('should return empty array when user has no transactions', async () => {
      (Expense.find as jest.Mock).mockResolvedValue([]);

      const result = await expenseService.fetchAllTransactions('user-1');

      expect(result).toEqual([]);
    });
  });

  // ==================== bulkImportTransactions ====================
  describe('bulkImportTransactions', () => {
    it('should insert all transactions with userId attached', async () => {
      const inputData = [
        { title: 'A', amount: 10 },
        { title: 'B', amount: 20 },
      ];
      const inserted = [
        { _id: '1', userId: 'user-1', title: 'A', amount: 10 },
        { _id: '2', userId: 'user-1', title: 'B', amount: 20 },
      ];
      (Expense.insertMany as jest.Mock).mockResolvedValue(inserted);

      const result = await expenseService.bulkImportTransactions('user-1', inputData);

      expect(result).toEqual(inserted);
      expect(Expense.insertMany).toHaveBeenCalledWith([
        { title: 'A', amount: 10, userId: 'user-1' },
        { title: 'B', amount: 20, userId: 'user-1' },
      ]);
    });

    it('should accept empty array', async () => {
      (Expense.insertMany as jest.Mock).mockResolvedValue([]);

      const result = await expenseService.bulkImportTransactions('user-1', []);

      expect(result).toEqual([]);
      expect(Expense.insertMany).toHaveBeenCalledWith([]);
    });

    it('should throw 400 when input is not an array', async () => {
      await expect(
        expenseService.bulkImportTransactions('user-1', { title: 'A' })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'Request body must be an array of transactions',
      });
    });

    it('should throw 400 when input is null', async () => {
      await expect(
        expenseService.bulkImportTransactions('user-1', null)
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'Request body must be an array of transactions',
      });
    });
  });

  // ==================== clearTransactions ====================
  describe('clearTransactions', () => {
    it('should return deleted count when transactions exist', async () => {
      (Expense.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 7 });

      const result = await expenseService.clearTransactions('user-1');

      expect(result).toBe(7);
      expect(Expense.deleteMany).toHaveBeenCalledWith({ userId: 'user-1' });
    });

    it('should return 0 when user has no transactions', async () => {
      (Expense.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 0 });

      const result = await expenseService.clearTransactions('user-1');

      expect(result).toBe(0);
    });
  });
});