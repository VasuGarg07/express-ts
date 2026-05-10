import * as expenseService from '../../src/modules/expenses/expenseService';
import { db } from '../../src/config/postgres';
import { ERROR_STRINGS } from '../../src/utils/response.string';

// expenseService only ever touches `db` through drizzle's chainable query builder
// (insert/update/delete/select -> values/set/where/from -> returning). Mock that
// chain shape directly instead of the underlying pg driver, and control the
// resolved value per call via mockResolvedValueOnce on the terminal method.
jest.mock('../../src/config/postgres', () => {
  const mockReturning = jest.fn();
  const mockSelectWhere = jest.fn();

  const mockValues = jest.fn(() => ({ returning: mockReturning }));
  const mockSet = jest.fn(() => ({ where: jest.fn(() => ({ returning: mockReturning })) }));
  const mockDeleteWhere = jest.fn(() => ({ returning: mockReturning }));
  const mockFrom = jest.fn(() => ({ where: mockSelectWhere }));

  return {
    __esModule: true,
    db: {
      insert: jest.fn(() => ({ values: mockValues })),
      update: jest.fn(() => ({ set: mockSet })),
      delete: jest.fn(() => ({ where: mockDeleteWhere })),
      select: jest.fn(() => ({ from: mockFrom })),
    },
    __mocks: { mockReturning, mockSelectWhere, mockValues, mockSet, mockDeleteWhere, mockFrom },
  };
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { __mocks } = require('../../src/config/postgres');
const { mockReturning, mockSelectWhere, mockValues, mockSet, mockDeleteWhere, mockFrom } = __mocks;

describe('expenseService', () => {
  const VALID_USER_ID = '507f1f77bcf86cd799439011';
  const OTHER_USER_ID = '507f191e810c19729de860ea';
  const INVALID_USER_ID = 'not-a-valid-object-id';

  const mockTxnData = {
    title: 'Coffee',
    amount: 5.5,
    type: 'expense',
    category: 'food',
    date: 1704067200,
    description: 'Morning coffee',
  };

  // rows coming back from drizzle are already camelCased per the schema's JS field
  // names; amount still arrives as a string since pg returns NUMERIC as text.
  const dbRow = {
    id: 1,
    userId: VALID_USER_ID,
    title: 'Coffee',
    amount: '5.50',
    type: 'expense',
    category: 'food',
    date: 1704067200,
    description: 'Morning coffee',
  };

  // ==================== createTransaction ====================
  describe('createTransaction', () => {
    it('should insert and return the mapped transaction', async () => {
      mockReturning.mockResolvedValueOnce([dbRow]);

      const result = await expenseService.createTransaction(VALID_USER_ID, mockTxnData as any);

      expect(db.insert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith({ userId: VALID_USER_ID, ...mockTxnData });
      expect(result).toMatchObject({ userId: VALID_USER_ID, title: 'Coffee', amount: '5.50', date: 1704067200 });
    });

    it('should throw 400 when userId is not a valid ObjectId', async () => {
      await expect(
        expenseService.createTransaction(INVALID_USER_ID, mockTxnData as any)
      ).rejects.toMatchObject({ statusCode: 400, message: ERROR_STRINGS.InvalidUserId });
      expect(db.insert).not.toHaveBeenCalled();
    });
  });

  // ==================== editTransaction ====================
  describe('editTransaction', () => {
    it('should update and return the transaction when found and owned by the user', async () => {
      mockReturning.mockResolvedValueOnce([dbRow]);

      const result = await expenseService.editTransaction('1', VALID_USER_ID, mockTxnData as any);

      expect(db.update).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(mockTxnData);
      expect(result).toMatchObject({ userId: VALID_USER_ID, title: 'Coffee' });
    });

    it('should throw 400 when txnId is empty', async () => {
      await expect(
        expenseService.editTransaction('', VALID_USER_ID, mockTxnData as any)
      ).rejects.toMatchObject({ statusCode: 400, message: ERROR_STRINGS.InvalidTxnId });
      expect(db.update).not.toHaveBeenCalled();
    });

    it('should throw 400 when txnId is whitespace', async () => {
      await expect(
        expenseService.editTransaction('   ', VALID_USER_ID, mockTxnData as any)
      ).rejects.toMatchObject({ statusCode: 400, message: ERROR_STRINGS.InvalidTxnId });
    });

    it('should throw 400 when userId is not a valid ObjectId', async () => {
      await expect(
        expenseService.editTransaction('1', INVALID_USER_ID, mockTxnData as any)
      ).rejects.toMatchObject({ statusCode: 400, message: ERROR_STRINGS.InvalidUserId });
      expect(db.update).not.toHaveBeenCalled();
    });

    it('should throw 404 when transaction does not exist', async () => {
      mockReturning.mockResolvedValueOnce([]);

      await expect(
        expenseService.editTransaction('999', VALID_USER_ID, mockTxnData as any)
      ).rejects.toMatchObject({ statusCode: 404, message: ERROR_STRINGS.TransactionNotFound });
    });

    it('should throw 404 when the transaction belongs to a different user', async () => {
      mockReturning.mockResolvedValueOnce([]);

      await expect(
        expenseService.editTransaction('1', OTHER_USER_ID, mockTxnData as any)
      ).rejects.toMatchObject({ statusCode: 404, message: ERROR_STRINGS.TransactionNotFound });
    });
  });

  // ==================== removeTransaction ====================
  describe('removeTransaction', () => {
    it('should delete the transaction when found and owned by the user', async () => {
      mockReturning.mockResolvedValueOnce([{ id: 1 }]);

      await expenseService.removeTransaction('1', VALID_USER_ID);

      expect(db.delete).toHaveBeenCalled();
      expect(mockDeleteWhere).toHaveBeenCalled();
    });

    it('should throw 400 when txnId is empty', async () => {
      await expect(expenseService.removeTransaction('', VALID_USER_ID)).rejects.toMatchObject({
        statusCode: 400,
        message: ERROR_STRINGS.InvalidTxnId,
      });
    });

    it('should throw 400 when userId is not a valid ObjectId', async () => {
      await expect(expenseService.removeTransaction('1', INVALID_USER_ID)).rejects.toMatchObject({
        statusCode: 400,
        message: ERROR_STRINGS.InvalidUserId,
      });
      expect(db.delete).not.toHaveBeenCalled();
    });

    it('should throw 404 when transaction does not exist', async () => {
      mockReturning.mockResolvedValueOnce([]);

      await expect(
        expenseService.removeTransaction('999', VALID_USER_ID)
      ).rejects.toMatchObject({ statusCode: 404, message: ERROR_STRINGS.TransactionNotFound });
    });

    it('should throw 404 when the transaction belongs to a different user', async () => {
      mockReturning.mockResolvedValueOnce([]);

      await expect(
        expenseService.removeTransaction('1', OTHER_USER_ID)
      ).rejects.toMatchObject({ statusCode: 404, message: ERROR_STRINGS.TransactionNotFound });
    });
  });

  // ==================== fetchAllTransactions ====================
  describe('fetchAllTransactions', () => {
    it('should return all transactions for the user', async () => {
      mockSelectWhere.mockResolvedValueOnce([dbRow]);

      const result = await expenseService.fetchAllTransactions(VALID_USER_ID);

      expect(db.select).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalled();
      expect(result).toEqual([expect.objectContaining({ userId: VALID_USER_ID, amount: '5.50' })]);
    });

    it('should return empty array when user has no transactions', async () => {
      mockSelectWhere.mockResolvedValueOnce([]);

      const result = await expenseService.fetchAllTransactions(VALID_USER_ID);

      expect(result).toEqual([]);
    });

    it('should throw 400 when userId is not a valid ObjectId', async () => {
      await expect(expenseService.fetchAllTransactions(INVALID_USER_ID)).rejects.toMatchObject({
        statusCode: 400,
        message: ERROR_STRINGS.InvalidUserId,
      });
      expect(db.select).not.toHaveBeenCalled();
    });
  });

  // ==================== bulkImportTransactions ====================
  describe('bulkImportTransactions', () => {
    it('should insert all transactions with userId attached', async () => {
      const inputData = [
        { title: 'A', amount: 10, type: 'expense', category: 'misc', date: 1, description: '' },
        { title: 'B', amount: 20, type: 'expense', category: 'misc', date: 2, description: '' },
      ];
      mockReturning.mockResolvedValueOnce([dbRow, dbRow]);

      const result = await expenseService.bulkImportTransactions(VALID_USER_ID, inputData);

      expect(db.insert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith(
        inputData.map((t) => ({ userId: VALID_USER_ID, ...t }))
      );
      expect(result).toHaveLength(2);
    });

    it('should accept empty array without touching the db', async () => {
      const result = await expenseService.bulkImportTransactions(VALID_USER_ID, []);

      expect(result).toEqual([]);
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('should throw 400 when input is not an array', async () => {
      await expect(
        expenseService.bulkImportTransactions(VALID_USER_ID, { title: 'A' })
      ).rejects.toMatchObject({ statusCode: 400, message: 'Request body must be an array of transactions' });
    });

    it('should throw 400 when input is null', async () => {
      await expect(
        expenseService.bulkImportTransactions(VALID_USER_ID, null)
      ).rejects.toMatchObject({ statusCode: 400, message: 'Request body must be an array of transactions' });
    });

    it('should throw 400 when userId is not a valid ObjectId', async () => {
      await expect(
        expenseService.bulkImportTransactions(INVALID_USER_ID, [])
      ).rejects.toMatchObject({ statusCode: 400, message: ERROR_STRINGS.InvalidUserId });
      expect(db.insert).not.toHaveBeenCalled();
    });
  });

  // ==================== clearTransactions ====================
  describe('clearTransactions', () => {
    it('should return deleted count when transactions exist', async () => {
      mockReturning.mockResolvedValueOnce([{ id: 1 }, { id: 2 }, { id: 3 }]);

      const result = await expenseService.clearTransactions(VALID_USER_ID);

      expect(db.delete).toHaveBeenCalled();
      expect(result).toBe(3);
    });

    it('should return 0 when user has no transactions', async () => {
      mockReturning.mockResolvedValueOnce([]);

      const result = await expenseService.clearTransactions(VALID_USER_ID);

      expect(result).toBe(0);
    });

    it('should throw 400 when userId is not a valid ObjectId', async () => {
      await expect(expenseService.clearTransactions(INVALID_USER_ID)).rejects.toMatchObject({
        statusCode: 400,
        message: ERROR_STRINGS.InvalidUserId,
      });
      expect(db.delete).not.toHaveBeenCalled();
    });
  });
});
