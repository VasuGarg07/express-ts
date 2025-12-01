import { NextFunction, Request, Response } from 'express';
import Blog from './blogModel';
import { AuthenticatedRequest } from '../../types';
import { ERROR_STRINGS, SUCCESS_STRINGS } from '../../utils/response.string';
import { BlogPatchValidator } from './blogValidator';
import { getPaginationParams, PaginatedResponse } from '../../utils/utilities';

export const getRecentBlogs = async (req: Request, res: Response, next: NextFunction) => {
    const count = 8;
    try {
        const blogs = await Blog.find().sort({ updatedAt: -1 }).limit(count);
        if (!blogs || !blogs.length) {
            res.status(200).json({
                blogs: [],
                count: 0
            });
            return;
        }

        res.status(200).json({
            blogs,
            count: blogs.length
        });
    } catch (error) {
        next(error);
    }
}

export const getBlogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, limit, skip } = getPaginationParams(req.query);

        const [blogs, totalItems] = await Promise.all([
            Blog.find()
                .skip(skip)
                .limit(limit)
                .sort({ updatedAt: -1 }),
            Blog.countDocuments()
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
            Blog.find({ author })
                .skip(skip)
                .limit(limit)
                .sort({ updatedAt: -1 }),
            Blog.countDocuments({ author })
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
}

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
        const currentBlog = await Blog.findById(id).exec();

        if (!currentBlog) {
            res.status(404).json({ error: "Blog not found." });
            return;
        }

        // Extract tags from the current blog
        const { tags } = currentBlog;

        if (!tags || tags.length === 0) {
            res.status(200).json({ message: "No related blogs found.", blogs: [] });
            return;
        }

        // Find related blogs with matching tags, excluding the current blog by ID
        const relatedBlogs = await Blog.find({
            _id: { $ne: id }, // Exclude the current blog
            tags: { $in: tags }, // Match any of the tags
            isArchived: false, // Exclude archived blogs
        })
            .limit(3) // Limit to 3 blogs
            .sort({ updatedAt: -1 }) // Optional: Sort by most recent
            .exec();

        res.status(200).json({ message: "Success", blogs: relatedBlogs });
    } catch (error) {
        next(error)
    }
};

export const addBlog = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { author, title, coverImageUrl, blogContent, tags, isArchived } = req.body;

    try {
        const blog = new Blog({ userId, author, title, coverImageUrl, blogContent, tags, isArchived });
        await blog.save();
        res.status(201).json({ message: SUCCESS_STRINGS.BlogAdded, blog });
    } catch (error) {
        next(error);
    }

}

export const updateBlog = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const blogId = req.params.id;

    if (!blogId || blogId.trim() === "") {
        res.status(404).json({ error: ERROR_STRINGS.InvalidBlogId });
        return;
    }

    try {
        // Find the blog and check ownership
        const blog = await Blog.findById(blogId);
        if (!blog) {
            res.status(404).json({ message: ERROR_STRINGS.BlogNotFound });
            return;
        }

        if (blog.userId.toString() !== userId) {
            res.status(403).json({ message: ERROR_STRINGS.UnauthorizedAccess });
            return;
        }

        // Validate and update the blog
        const validatedData = BlogPatchValidator.parse(req.body);
        const updatedBlog = await Blog.findByIdAndUpdate(blogId, validatedData, { new: true });

        res.status(200).json({ message: SUCCESS_STRINGS.BlogUpdated, blog: updatedBlog });
    } catch (error) {
        console.error(error);
        next(error);
    }

}

export const archiveBlog = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const blogId = req.params.id;

    if (!blogId || blogId.trim() === "") {
        res.status(404).json({ error: ERROR_STRINGS.InvalidBlogId });
        return;
    }

    try {
        // Find the blog and check ownership
        const blog = await Blog.findById(blogId);
        if (!blog) {
            res.status(404).json({ message: ERROR_STRINGS.BlogNotFound });
            return;
        }

        if (blog.userId.toString() !== userId) {
            res.status(403).json({ message: ERROR_STRINGS.UnauthorizedAccess });
            return;
        }

        const archivedBlog = await Blog.findByIdAndUpdate(blogId, { isArchived: true });
        res.status(200).json({ message: SUCCESS_STRINGS.BlogArchived, blog: archivedBlog });
    } catch (error) {
        console.error(error);
        next(error);
    }
}

export const deleteAllBlogs = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;

    try {
        const result = await Blog.deleteMany({ author: userId });
        if (result.deletedCount < 1) {
            res.status(404).json({ message: "No blogs found" });
        }

        res.status(200).json({
            message: "All blogs deleted successfully.",
            deleteCount: result.deletedCount,
        });

    } catch (error) {
        console.error(error);
        next(error);
    }
}

export const deleteArchivedBlogs = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;

    try {
        const result = await Blog.deleteMany({ author: userId, isArchived: true });
        if (result.deletedCount < 1) {
            res.status(404).json({ message: "No blogs found" });
        }

        res.status(200).json({
            message: "All archived blogs deleted successfully.",
            deleteCount: result.deletedCount,
        });

    } catch (error) {
        console.error(error);
        next(error);
    }
}

export const deleteBlogById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const blogId = req.params.id;

    if (!blogId || blogId.trim() === "") {
        res.status(404).json({ error: ERROR_STRINGS.InvalidBlogId });
        return;
    }

    try {
        // Find the blog and check ownership
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
        console.error(error);
        next(error);
    }
}