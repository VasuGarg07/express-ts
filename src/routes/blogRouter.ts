import { Router } from "express";
import { validate } from "../middlewares/validationMiddleware";
import { BlogPatchValidator, BlogValidator } from "../validators/blogValidator";
import { addBlog, archiveBlog, deleteAllBlogs, deleteArchivedBlogs, deleteBlogById, getBlogById, getBlogs, getBlogsOfAuthor, getRecentBlogs, getRelatedBlogs, getUserBlogs, updateBlog } from "../controllers/blogController";

const router = Router();

router.get('/list', getBlogs);
router.get('/recent', getRecentBlogs); // recent 5-8 blogs
router.get('/list/me', getUserBlogs); // all blogs of logged in user
router.get('/list/author/:name', getBlogsOfAuthor); // all blogs of an author
router.get('/blog/:id', getBlogById); // all blogs of an author
router.get('/related/:id', getRelatedBlogs);

router.post('/publish', validate(BlogValidator), addBlog); // publish new blog
// (user must be author)
router.patch('/update/:id', validate(BlogPatchValidator), updateBlog); // update blog by id
router.patch('/archive/:id', archiveBlog) // archive blog by id

router.delete('/clear-all', deleteAllBlogs); // delete all blogs
router.delete('/clear-archived', deleteArchivedBlogs); // delete archived blog
router.delete('/clear/:id', deleteBlogById);

export default router;