import { Response, NextFunction } from "express";
import { Chapter, Notebook } from "../../models/notebookModel";
import { AuthenticatedRequest } from "../../types";
import { SUCCESS_STRINGS, ERROR_STRINGS } from "../../utils/response.string";

// Create a new chapter
export const createChapter = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { notebookId, title, content, order } = req.body;

    try {
        const notebook = await Notebook.findById(notebookId);
        if (!notebook) {
            res.status(404).json({ error: ERROR_STRINGS.NotebookNotFound });
            return;
        }

        if (notebook.userId.toString() !== userId) {
            res.status(403).json({ error: ERROR_STRINGS.ForbiddenAction });
            return;
        }

        const chapter = new Chapter({
            notebookId,
            title,
            content,
            order,
        });

        await chapter.save();
        res.status(201).json({ message: SUCCESS_STRINGS.ChapterCreated, chapter });
        return;
    } catch (error) {
        next(error);
    }
};

// Get all chapters for a given notebook
export const getChaptersForNotebook = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const notebookId = req.params.notebookId;
    const userId = req.user!.id;

    try {
        const notebook = await Notebook.findById(notebookId);
        if (!notebook) {
            res.status(404).json({ error: ERROR_STRINGS.NotebookNotFound });
            return;
        }

        const isOwner = notebook.userId.toString() === userId;
        const isPublic = notebook.visibility === "public";

        if (!isOwner && !isPublic) {
            res.status(403).json({ error: ERROR_STRINGS.ForbiddenAction });
            return;
        }

        const chapters = await Chapter.find({ notebookId }).sort({ order: 1 });
        res.status(200).json(chapters);
        return;
    } catch (error) {
        next(error);
    }
};

// Get a single chapter by ID
export const getChapterById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const chapterId = req.params.id;
    const userId = req.user!.id;

    try {
        const chapter = await Chapter.findById(chapterId);
        if (!chapter) {
            res.status(404).json({ error: ERROR_STRINGS.ChapterNotFound });
            return;
        }

        const notebook = await Notebook.findById(chapter.notebookId);
        if (!notebook) {
            res.status(404).json({ error: ERROR_STRINGS.NotebookNotFound });
            return;
        }

        const isOwner = notebook.userId.toString() === userId;
        const isPublic = notebook.visibility === "public";

        if (!isOwner && !isPublic) {
            res.status(403).json({ error: ERROR_STRINGS.ForbiddenAction });
            return;
        }

        res.status(200).json({ chapter });
        return;
    } catch (error) {
        next(error);
    }
};

// Search chapters within a notebook
export const searchChaptersInNotebook = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const notebookId = req.params.notebookId;
    const query = req.params.query;
    const userId = req.user!.id;

    try {
        const notebook = await Notebook.findById(notebookId);
        if (!notebook) {
            res.status(404).json({ error: ERROR_STRINGS.NotebookNotFound });
            return;
        }

        const isOwner = notebook.userId.toString() === userId;
        const isPublic = notebook.visibility === "public";

        if (!isOwner && !isPublic) {
            res.status(403).json({ error: ERROR_STRINGS.ForbiddenAction });
            return;
        }

        const regex = new RegExp(query, "i");
        const chapters = await Chapter.find({
            notebookId,
            $or: [{ title: regex }, { content: regex }]
        }).sort({ order: 1 });

        res.status(200).json(chapters);
        return;
    } catch (error) {
        next(error);
    }
};

// Update a chapter
export const updateChapter = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const chapterId = req.params.id;
    const userId = req.user!.id;
    const { title, content, order } = req.body;

    try {
        const chapter = await Chapter.findById(chapterId);
        if (!chapter) {
            res.status(404).json({ error: ERROR_STRINGS.ChapterNotFound });
            return;
        }

        const notebook = await Notebook.findById(chapter.notebookId);
        if (!notebook || notebook.userId.toString() !== userId) {
            res.status(403).json({ error: ERROR_STRINGS.ForbiddenAction });
            return;
        }

        if (title) chapter.title = title;
        if (content) chapter.content = content;
        if (typeof order === "number") chapter.order = order;

        await chapter.save();
        res.status(200).json({ message: SUCCESS_STRINGS.ChapterUpdated, chapter });
        return;
    } catch (error) {
        next(error);
    }
};

// Delete a chapter
export const deleteChapter = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const chapterId = req.params.id;
    const userId = req.user!.id;

    try {
        const chapter = await Chapter.findById(chapterId);
        if (!chapter) {
            res.status(404).json({ error: ERROR_STRINGS.ChapterNotFound });
            return;
        }

        const notebook = await Notebook.findById(chapter.notebookId);
        if (!notebook || notebook.userId.toString() !== userId) {
            res.status(403).json({ error: ERROR_STRINGS.ForbiddenAction });
            return;
        }

        await Chapter.deleteOne({ _id: chapterId });
        res.status(200).json({ message: SUCCESS_STRINGS.ChapterDeleted });
        return;
    } catch (error) {
        next(error);
    }
};
