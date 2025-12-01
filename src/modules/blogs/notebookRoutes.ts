// notebookRoutes.ts
import { Router } from "express";
import { NotebookPatchValidator, NotebookValidator } from "./notebookValidator";
import { validate } from "../../middlewares/validationMiddleware";
import {
    addNotebook,
    deleteNotebookById,
    getNotebookById,
    getNotebooks,
    getNotebooksByAuthor,
    getUserNotebooks,
    updateNotebook,
} from "./notebookController";

const router = Router();

router.get('/list', getNotebooks);
router.get('/list/me', getUserNotebooks);
router.get('/list/author/:name', getNotebooksByAuthor);
router.get('/notebook/:id', getNotebookById);
router.post('/create', validate(NotebookValidator), addNotebook);

router.patch('/update/:id', validate(NotebookPatchValidator), updateNotebook);
router.delete('/clear/:id', deleteNotebookById);

export default router;