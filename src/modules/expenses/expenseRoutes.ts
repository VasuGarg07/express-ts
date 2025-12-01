import { Router } from "express";
import { importTransactions, addTransaction, clearAllTransactions, deleteTransaction, getAllTransactions, updateTransaction } from "./expenseController";
import { expenseSchema } from "./expenseValidator";
import { validate } from "../../middlewares/validationMiddleware";

const router = Router();

router.get('/list', getAllTransactions);

router.post('/import', importTransactions);
router.post('/add', validate(expenseSchema), addTransaction);
router.put('/update/:id', validate(expenseSchema), updateTransaction);

router.delete('/clear', clearAllTransactions)
router.delete('/:id', deleteTransaction);

export default router;