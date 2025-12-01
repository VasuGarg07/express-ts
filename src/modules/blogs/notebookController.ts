import { NextFunction, Request, Response } from 'express';
import Notebook from './notebookModel';
import Blog from './blogModel';
import { AuthenticatedRequest } from '../../types';
import { ERROR_STRINGS, SUCCESS_STRINGS } from '../../utils/response.string';
import { NotebookPatchValidator } from './notebookValidator';
import { getPaginationParams, PaginatedResponse } from '../../utils/utilities';

export const getNotebooks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, limit, skip } = getPaginationParams(req.query);

        const [notebooks, totalItems] = await Promise.all([
            Notebook.find({ isPublic: true })
                .skip(skip)
                .limit(limit)
                .sort({ updatedAt: -1 }),
            Notebook.countDocuments({ isPublic: true })
        ]);

        const response: PaginatedResponse<typeof notebooks[0]> = {
            data: notebooks,
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

export const getNotebooksByAuthor = async (req: Request, res: Response, next: NextFunction) => {
    const author = req.params.name;
    try {
        const { page, limit, skip } = getPaginationParams(req.query);

        const [notebooks, totalItems] = await Promise.all([
            Notebook.find({ author, isPublic: true })
                .skip(skip)
                .limit(limit)
                .sort({ updatedAt: -1 }),
            Notebook.countDocuments({ author, isPublic: true })
        ]);

        const response: PaginatedResponse<typeof notebooks[0]> = {
            data: notebooks,
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

export const getUserNotebooks = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    try {
        const { page, limit, skip } = getPaginationParams(req.query);

        const [notebooks, totalItems] = await Promise.all([
            Notebook.find({ userId })
                .skip(skip)
                .limit(limit)
                .sort({ updatedAt: -1 }),
            Notebook.countDocuments({ userId })
        ]);

        const response: PaginatedResponse<typeof notebooks[0]> = {
            data: notebooks,
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

export const getNotebookById = async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    try {
        const notebook = await Notebook.findById(id);
        if (!notebook) {
            res.status(404).json({ message: ERROR_STRINGS.NotebookNotFound });
            return;
        }
        res.status(200).json({ message: 'success', notebook });
    } catch (error) {
        next(error);
    }
};

export const addNotebook = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { author, title, description, coverImageUrl, isPublic } = req.body;

    try {
        const notebook = new Notebook({ userId, author, title, description, coverImageUrl, isPublic });
        await notebook.save();
        res.status(201).json({ message: SUCCESS_STRINGS.NotebookCreated, notebook });
    } catch (error) {
        next(error);
    }
};

export const updateNotebook = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const notebookId = req.params.id;

    if (!notebookId || notebookId.trim() === "") {
        res.status(400).json({ error: ERROR_STRINGS.InvalidNotebookId });
        return;
    }

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

        const validatedData = NotebookPatchValidator.parse(req.body);
        const updatedNotebook = await Notebook.findByIdAndUpdate(notebookId, validatedData, { new: true });

        res.status(200).json({ message: SUCCESS_STRINGS.NotebookUpdated, notebook: updatedNotebook });
    } catch (error) {
        next(error);
    }
};

export const deleteNotebookById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const notebookId = req.params.id;

    if (!notebookId || notebookId.trim() === "") {
        res.status(400).json({ error: ERROR_STRINGS.InvalidNotebookId });
        return;
    }

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

        const [_, deletedBlogs] = await Promise.all([
            Notebook.findByIdAndDelete(notebookId),
            Blog.deleteMany({ notebookId })
        ]);

        res.status(200).json({
            message: SUCCESS_STRINGS.NotebookDeleted,
            blogsDeleted: deletedBlogs.deletedCount
        });
    } catch (error) {
        next(error);
    }
};