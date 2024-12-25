import { Router } from "express";
import { importTransactions, addTransaction, clearAllTransactions, deleteTransaction, getAllTransactions, updateTransaction } from "../controllers/expenseController";
import { validate } from "../middlewares/validationMiddleware";
import { expenseSchema } from "../validators/expenseValidator";

const router = Router();

router.get('/list', getAllTransactions);

router.post('/import', importTransactions);
router.post('/add', validate(expenseSchema), addTransaction);
router.put('/update/:id', validate(expenseSchema), updateTransaction);

router.delete('/clear', clearAllTransactions)
router.delete('/:id', deleteTransaction);

export default router;