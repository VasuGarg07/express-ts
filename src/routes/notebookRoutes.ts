import { Router } from "express";
import { validate } from "../middlewares/validationMiddleware";
import {
    notebookSchema,
    notebookUpdateSchema,
    chapterSchema,
    chapterUpdateSchema
} from "../validators/notebookSchemas";
import {
    createNotebook,
    getNotebookById,
    getUserNotebooks,
    updateNotebook,
    deleteNotebook,
    searchNotebook,
    verifyNotebookPassword,
    exportNotebookAsJson,
    previewNotebook,
    exportNotebookAsZip,
} from "../controllers/notebook/notebookController";
import {
    createChapter,
    getChaptersForNotebook,
    searchChaptersInNotebook,
    getChapterById,
    updateChapter,
    deleteChapter
} from "../controllers/notebook/chapterController";

const router = Router();

// Notebooks
router.get('/list', getUserNotebooks); // list of user's notebooks
router.get('/search/:query', searchNotebook); // search notebook
router.get('/view/:id', getNotebookById); // view notebook by ID
router.post('/create', validate(notebookSchema), createNotebook); // create notebook
router.patch('/update/:id', validate(notebookUpdateSchema), updateNotebook); // update notebook
router.post('/verify/:id', verifyNotebookPassword); // verify password for private notebook
router.delete('/delete/:id', deleteNotebook); // delete notebook
router.get('/export/json/:id', exportNotebookAsJson) // export entire notebook as a single JSON
router.get('/export/preview/:id', previewNotebook) // sanitized + truncated preview of a notebook
router.get('/export/zip/:id', exportNotebookAsZip) // Bundle chapters into a zip of md files

// Chapters
router.get('/chapters/:notebookId', getChaptersForNotebook); // all chapters in a notebook
router.get('/chapter/search/:notebookId/:query', searchChaptersInNotebook) // search for chapters within a specific notebook
router.get('/chapter/:id', getChapterById); // view single chapter
router.post('/chapter/create', validate(chapterSchema), createChapter); // create new chapter
router.patch('/chapter/update/:id', validate(chapterUpdateSchema), updateChapter); // update chapter
router.delete('/chapter/delete/:id', deleteChapter); // delete chapter

export default router;
