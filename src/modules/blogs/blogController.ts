import { NextFunction, Request, Response } from 'express';
import Blog from './blogModel';
import { AuthenticatedRequest } from '../../types';
import { ERROR_STRINGS, SUCCESS_STRINGS } from '../../utils/response.string';
import { BlogPatchValidator } from './blogValidator';
import { getPaginationParams, PaginatedResponse } from '../../utils/utilities';
import Notebook from './notebookModel';

export const getBlogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, limit, skip } = getPaginationParams(req.query);

        const [blogs, totalItems] = await Promise.all([
            Blog.find({ isArchived: false })
                .skip(skip)
                .limit(limit)
                .sort({ updatedAt: -1 }),
            Blog.countDocuments({ isArchived: false })
        ]);

        const response: PaginatedResponse<typeof blogs[0]> = {
            data: blogs,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit),
                totalItems,
                itemsPerPage: limit
            }
        };

        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};

export const getBlogsOfAuthor = async (req: Request, res: Response, next: NextFunction) => {
    const author = req.params.name;
    try {
        const { page, limit, skip } = getPaginationParams(req.query);

        const [blogs, totalItems] = await Promise.all([
            Blog.find({ author, isArchived: false })
                .skip(skip)
                .limit(limit)
                .sort({ updatedAt: -1 }),
            Blog.countDocuments({ author, isArchived: false })
        ]);

        const response: PaginatedResponse<typeof blogs[0]> = {
            data: blogs,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit),
                totalItems,
                itemsPerPage: limit
            }
        };

        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};

export const getUserBlogs = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    try {
        const { page, limit, skip } = getPaginationParams(req.query);

        const [blogs, totalItems] = await Promise.all([
            Blog.find({ userId })
                .skip(skip)
                .limit(limit)
                .sort({ updatedAt: -1 }),
            Blog.countDocuments({ userId })
        ]);

        const response: PaginatedResponse<typeof blogs[0]> = {
            data: blogs,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit),
                totalItems,
                itemsPerPage: limit
            }
        };

        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};

export const getBlogsByNotebook = async (req: Request, res: Response, next: NextFunction) => {
    const notebookId = req.params.notebookId;
    try {
        const { page, limit, skip } = getPaginationParams(req.query);

        const [blogs, totalItems] = await Promise.all([
            Blog.find({ notebookId, isArchived: false })
                .skip(skip)
                .limit(limit)
                .sort({ updatedAt: -1 }),
            Blog.countDocuments({ notebookId, isArchived: false })
        ]);

        const response: PaginatedResponse<typeof blogs[0]> = {
            data: blogs,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit),
                totalItems,
                itemsPerPage: limit
            }
        };

        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};

export const getBlogById = async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    try {
        const blog = await Blog.findById(id);
        if (!blog) {
            res.status(404).json({ message: ERROR_STRINGS.BlogNotFound });
            return;
        }
        res.status(200).json({ message: 'success', blog });
    } catch (error) {
        next(error);
    }
};

export const getRelatedBlogs = async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;

    try {
        const currentBlog = await Blog.findById(id);

        if (!currentBlog) {
            res.status(404).json({ error: ERROR_STRINGS.BlogNotFound });
            return;
        }

        const { tags } = currentBlog;

        if (!tags || tags.length === 0) {
            res.status(200).json({ message: "No related blogs found.", blogs: [] });
            return;
        }

        const relatedBlogs = await Blog.find({
            _id: { $ne: id },
            tags: { $in: tags },
            isArchived: false,
        })
            .limit(3)
            .sort({ updatedAt: -1 });

        res.status(200).json({ message: "Success", blogs: relatedBlogs });
    } catch (error) {
        next(error);
    }
};

export const addBlog = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const notebookId = req.params.notebookId;
    const { author, title, blogContent, tags, isArchived } = req.body;

    try {
        const notebook = await Notebook.findById(notebookId);
        if (!notebook) {
            res.status(404).json({ message: ERROR_STRINGS.NotebookNotFound });
            return;
        }

        if (notebook.userId.toString() !== userId) {
            res.status(403).json({ message: ERROR_STRINGS.UnauthorizedAccess });
            return;
        }

        const blog = new Blog({ userId, notebookId, author, title, blogContent, tags, isArchived });
        await blog.save();
        res.status(201).json({ message: SUCCESS_STRINGS.BlogAdded, blog });
    } catch (error) {
        next(error);
    }
};

export const updateBlog = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const blogId = req.params.id;

    if (!blogId || blogId.trim() === "") {
        res.status(400).json({ error: ERROR_STRINGS.InvalidBlogId });
        return;
    }

    try {
        const blog = await Blog.findById(blogId);
        if (!blog) {
            res.status(404).json({ message: ERROR_STRINGS.BlogNotFound });
            return;
        }

        if (blog.userId.toString() !== userId) {
            res.status(403).json({ message: ERROR_STRINGS.UnauthorizedAccess });
            return;
        }

        const validatedData = BlogPatchValidator.parse(req.body);
        const updatedBlog = await Blog.findByIdAndUpdate(blogId, validatedData, { new: true });

        res.status(200).json({ message: SUCCESS_STRINGS.BlogUpdated, blog: updatedBlog });
    } catch (error) {
        next(error);
    }
};

export const moveBlog = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const blogId = req.params.id;
    const newNotebookId = req.params.notebookId;

    if (!blogId || blogId.trim() === "") {
        res.status(400).json({ error: ERROR_STRINGS.InvalidBlogId });
        return;
    }

    if (!newNotebookId || newNotebookId.trim() === "") {
        res.status(400).json({ error: ERROR_STRINGS.InvalidNotebookId });
        return;
    }

    try {
        const [blog, notebook] = await Promise.all([
            Blog.findById(blogId),
            Notebook.findById(newNotebookId)
        ]);

        if (!blog) {
            res.status(404).json({ message: ERROR_STRINGS.BlogNotFound });
            return;
        }

        if (!notebook) {
            res.status(404).json({ message: ERROR_STRINGS.NotebookNotFound });
            return;
        }

        if (blog.userId.toString() !== userId || notebook.userId.toString() !== userId) {
            res.status(403).json({ message: ERROR_STRINGS.UnauthorizedAccess });
            return;
        }

        const updatedBlog = await Blog.findByIdAndUpdate(
            blogId,
            { notebookId: newNotebookId },
            { new: true }
        );

        res.status(200).json({ message: SUCCESS_STRINGS.BlogMoved, blog: updatedBlog });
    } catch (error) {
        next(error);
    }
};

export const archiveBlog = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const blogId = req.params.id;

    if (!blogId || blogId.trim() === "") {
        res.status(400).json({ error: ERROR_STRINGS.InvalidBlogId });
        return;
    }

    try {
        const blog = await Blog.findById(blogId);
        if (!blog) {
            res.status(404).json({ message: ERROR_STRINGS.BlogNotFound });
            return;
        }

        if (blog.userId.toString() !== userId) {
            res.status(403).json({ message: ERROR_STRINGS.UnauthorizedAccess });
            return;
        }

        const archivedBlog = await Blog.findByIdAndUpdate(blogId, { isArchived: true }, { new: true });
        res.status(200).json({ message: SUCCESS_STRINGS.BlogArchived, blog: archivedBlog });
    } catch (error) {
        next(error);
    }
};

export const deleteAllBlogs = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;

    try {
        const result = await Blog.deleteMany({ userId });
        if (result.deletedCount < 1) {
            res.status(404).json({ message: "No blogs found" });
            return;
        }

        res.status(200).json({
            message: "All blogs deleted successfully.",
            deleteCount: result.deletedCount,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteArchivedBlogs = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;

    try {
        const result = await Blog.deleteMany({ userId, isArchived: true });
        if (result.deletedCount < 1) {
            res.status(404).json({ message: "No archived blogs found" });
            return;
        }

        res.status(200).json({
            message: "All archived blogs deleted successfully.",
            deleteCount: result.deletedCount,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteBlogById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const blogId = req.params.id;

    if (!blogId || blogId.trim() === "") {
        res.status(400).json({ error: ERROR_STRINGS.InvalidBlogId });
        return;
    }

    try {
        const blog = await Blog.findById(blogId);
        if (!blog) {
            res.status(404).json({ message: ERROR_STRINGS.BlogNotFound });
            return;
        }

        if (blog.userId.toString() !== userId) {
            res.status(403).json({ message: ERROR_STRINGS.UnauthorizedAccess });
            return;
        }

        await Blog.findByIdAndDelete(blogId);
        res.status(200).json({ message: SUCCESS_STRINGS.BlogDeleted, deleteCount: 1 });
    } catch (error) {
        next(error);
    }
};