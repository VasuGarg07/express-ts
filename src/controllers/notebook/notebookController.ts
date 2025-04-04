import { Request, Response, NextFunction } from "express";
import { Chapter, Notebook, Author } from '../../models/notebookModel'
import { AuthenticatedRequest } from "../../types";
import { ERROR_STRINGS, SUCCESS_STRINGS } from "../../utils/response.string";
import { compareData, hashData } from "../../utils/utilities";

// Create a new notebook
export const createNotebook = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { title, coverImageUrl, visibility, password } = req.body;

    try {
        let passwordHash;

        if (visibility === "private") {
            if (!password) {
                res.status(400).json({ error: ERROR_STRINGS.PasswordRequired });
                return;
            }
            if (password.length < 4) {
                res.status(400).json({ error: ERROR_STRINGS.PasswordTooShort });
                return;
            }
            passwordHash = await hashData(password);
        }

        const notebook = new Notebook({
            userId,
            title,
            coverImageUrl,
            visibility,
            passwordHash,
        });

        await notebook.save();
        res.status(201).json({ message: SUCCESS_STRINGS.NotebookCreated, notebook });
        return;
    } catch (error) {
        next(error);
    }
};

// Get all notebooks for logged-in user
export const getUserNotebooks = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const notebooks = await Notebook.find({ userId: req.user!.id }).sort({ updatedAt: -1 });
        const author = await Author.findOne({ userId: req.user!.id }).select('name avatar');
        const notebookIds = notebooks.map(nb => nb._id);
        const chapterCounts = await Chapter.aggregate([
            { $match: { notebookId: { $in: notebookIds } } },
            { $group: { _id: "$notebookId", count: { $sum: 1 } } }
        ]);
        const countMap = Object.fromEntries(chapterCounts.map(c => [c._id.toString(), c.count]));
        const notebooksWithCounts = await Promise.all(notebooks.map(async (nb) => {
            return { ...nb.toJSON(), chapterCount: countMap[nb.id.toString()] || 0, author };
        }));
        res.status(200).json(notebooksWithCounts);
        return;
    } catch (error) {
        next(error);
    }
};

export const getPublicNotebooks = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;

    try {
        const notebooks = await Notebook.find({
            visibility: "public",
            userId: { $ne: userId },
        }).sort({ updatedAt: -1 });

        const notebookIds = notebooks.map(nb => nb._id);
        const chapterCounts = await Chapter.aggregate([
            { $match: { notebookId: { $in: notebookIds } } },
            { $group: { _id: "$notebookId", count: { $sum: 1 } } }
        ]);
        const countMap = Object.fromEntries(chapterCounts.map(c => [c._id.toString(), c.count]));

        const notebooksWithCounts = await Promise.all(
            notebooks.map(async (nb) => {
                const author = await Author.findOne({ userId: nb.userId }).select("name avatar");
                return { ...nb.toJSON(), chapterCount: countMap[nb.id.toString()] || 0, author };
            })
        );
        res.status(200).json(notebooksWithCounts);
        return;
    } catch (error) {
        next(error);
    }
};

// Get notebook by ID
export const getNotebookById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const notebookId = req.params.id;
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

        // owner or public — fetch chapters
        if (isOwner || isPublic) {
            const chapters = await Chapter.find({ notebookId }).sort({ order: 1 });
            const author = await Author.findOne({ userId: notebook.userId }).select('name avatar');
            res.status(200).json({ notebook, chapters, author, chapterCount: chapters.length });
            return;
        }

        // private + not owner — return notebook without chapters, ask for password
        res.status(206).json({
            notebook,
            message: ERROR_STRINGS.PasswordRequired
        });
        return;
    } catch (error) {
        next(error);
    }
};

// Update notebook
export const updateNotebook = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const notebookId = req.params.id;
    const userId = req.user!.id;
    const { title, coverImageUrl, visibility, password } = req.body;

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

        if (title) notebook.title = title;
        if (coverImageUrl) notebook.coverImageUrl = coverImageUrl;

        if (visibility && visibility !== notebook.visibility) {
            notebook.visibility = visibility;

            if (visibility === "private") {
                if (!password || password.length < 4) {
                    res.status(400).json({ error: ERROR_STRINGS.PasswordTooShort });
                    return;
                }
                notebook.passwordHash = await hashData(password);
            } else {
                notebook.passwordHash = undefined; // clear previous password
            }
        }

        await notebook.save();
        res.status(200).json({ message: SUCCESS_STRINGS.NotebookUpdated, notebook });
        return;
    } catch (error) {
        next(error);
    }
};

// Delete notebook
export const deleteNotebook = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const notebookId = req.params.id;
    const userId = req.user!.id;

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

        await Notebook.deleteOne({ _id: notebookId });
        await Chapter.deleteMany({ notebookId });

        res.status(200).json({ message: SUCCESS_STRINGS.NotebookDeleted });
        return;
    } catch (error) {
        next(error);
    }
};

// Verify notebook password
export const verifyNotebookPassword = async (req: Request, res: Response, next: NextFunction) => {
    const notebookId = req.params.id;
    const { password } = req.body;

    try {
        const notebook = await Notebook.findById(notebookId);
        if (!notebook) {
            res.status(404).json({ error: ERROR_STRINGS.NotebookNotFound });
            return;
        }

        if (notebook.visibility !== "private" || !notebook.passwordHash) {
            res.status(400).json({ error: ERROR_STRINGS.PasswordRequired });
            return;
        }

        const isMatch = await compareData(password, notebook.passwordHash);
        if (!isMatch) {
            res.status(401).json({ error: ERROR_STRINGS.IncorrectNotebookPassword });
            return;
        }

        const chapters = await Chapter.find({ notebookId }).sort({ order: 1 });
        const author = await Author.findOne({ userId: notebook.userId }).select('name avatar');
        res.status(200).json({
            message: SUCCESS_STRINGS.PasswordVerified,
            notebook, chapters, author,
            chapterCount: chapters.length
        });
        return;
    } catch (error) {
        next(error);
    }
};

// Search user-owned notebooks by title
export const searchNotebook = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const query = req.params.query || "";

    try {
        const regex = new RegExp(query, "i");
        const notebooks = await Notebook.find({ title: regex }).sort({ updatedAt: -1 });
        const notebookIds = notebooks.map(nb => nb._id);
        const chapterCounts = await Chapter.aggregate([
            { $match: { notebookId: { $in: notebookIds } } },
            { $group: { _id: "$notebookId", count: { $sum: 1 } } }
        ]);
        const countMap = Object.fromEntries(chapterCounts.map(c => [c._id.toString(), c.count]));
        const notebooksWithCounts = await Promise.all(notebooks.map(async (nb) => {
            const author = await Author.findOne({ userId: nb.userId }).select('name avatar');
            return { ...nb.toJSON(), chapterCount: countMap[nb.id.toString()] || 0, author };
        }));
        res.status(200).json(notebooksWithCounts);
        return;
    } catch (error) {
        next(error);
    }
};

// Export notebook as raw JSON
export const exportNotebookAsJson = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const notebookId = req.params.id;
    const userId = req.user!.id;

    try {
        const notebook = await Notebook.findById(notebookId);
        if (!notebook || notebook.userId.toString() !== userId) {
            res.status(403).json({ error: ERROR_STRINGS.ForbiddenAction });
            return;
        }

        const chapters = await Chapter.find({ notebookId }).sort({ order: 1 });
        res.status(200).json({ notebook, chapters });
        return;
    } catch (error) {
        next(error);
    }
};

// Preview notebook (truncated)
export const previewNotebook = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const notebookId = req.params.id;

    try {
        const notebook = await Notebook.findById(notebookId).select("title coverImageUrl visibility updatedAt userId");
        if (!notebook) {
            res.status(404).json({ error: ERROR_STRINGS.NotebookNotFound });
            return;
        }

        const chapterCount = await Chapter.countDocuments({ notebookId });
        const author = await Author.findOne({ userId: notebook.userId }).select('name avatar');
        res.status(200).json({ preview: notebook, chapterCount, author });
        return;
    } catch (error) {
        next(error);
    }
};

// exportNotebookAsZip (next)
export const exportNotebookAsZip = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const notebookId = req.params.id;

    try {
        // TODO: Implement
    } catch (error) {
        next(error);
    }
}