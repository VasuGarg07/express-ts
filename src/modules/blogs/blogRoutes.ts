// blogRoutes.ts
import { Router } from "express";
import { BlogPatchValidator, BlogValidator } from "./blogValidator";
import { validate } from "../../middlewares/validationMiddleware";
import {
    addBlog,
    archiveBlog,
    deleteAllBlogs,
    deleteArchivedBlogs,
    deleteBlogById,
    getBlogById,
    getBlogs,
    getBlogsOfAuthor,
    getBlogsByNotebook,
    getRelatedBlogs,
    getUserBlogs,
    updateBlog,
    moveBlog,
} from "./blogController";

const router = Router();

router.get('/list', getBlogs);
router.get('/list/me', getUserBlogs);
router.get('/list/author/:name', getBlogsOfAuthor);
router.get('/list/notebook/:notebookId', getBlogsByNotebook);
router.get('/blog/:id', getBlogById);
router.get('/related/:id', getRelatedBlogs);
router.post('/publish/:notebookId', validate(BlogValidator), addBlog);

router.patch('/update/:id', validate(BlogPatchValidator), updateBlog);
router.patch('/move/:id/:notebookId', moveBlog);
router.patch('/archive/:id', archiveBlog);
router.delete('/clear', deleteAllBlogs);
router.delete('/clear-archived', deleteArchivedBlogs);
router.delete('/clear/:id', deleteBlogById);

export default router;