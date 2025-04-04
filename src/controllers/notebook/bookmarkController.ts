import { NextFunction, Response } from "express";
import { Author, Bookmark, Chapter, Notebook } from '../../models/notebookModel';
import { AuthenticatedRequest } from "../../types";
import { SUCCESS_STRINGS } from "../../utils/response.string";

// Get all bookmarks for current user
export const getBookmarks = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;

    try {
        const bookmarks = await Bookmark.find({ userId }).lean();
        const notebookIds = bookmarks.map((b) => b.notebookId);
        const notebooks = await Notebook.find({ _id: { $in: notebookIds } })
        const chapterCounts = await Chapter.aggregate([
            { $match: { notebookId: { $in: notebooks.map((nb) => nb.id) } } },
            { $group: { _id: "$notebookId", count: { $sum: 1 } } }
        ]);

        const chapterMap = Object.fromEntries(
            chapterCounts.map((c) => [c._id.toString(), c.count])
        );

        const results = await Promise.all(
            notebooks.map(async (nb) => {
                const author = await Author.findOne({ userId: nb.userId }).select("name avatar").lean();
                return {
                    ...nb,
                    chapterCount: chapterMap[nb.id.toString()] || 0,
                    author,
                };
            })
        );

        res.status(200).json(results);
        return;
    } catch (error) {
        next(error);
    }
};

// Add a bookmark
export const addBookmark = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const notebookId = req.params.id;

    try {
        const existing = await Bookmark.findOne({ userId, notebookId });
        if (existing) {
            res.status(200).json({ message: "Already bookmarked" });
            return;
        }

        await Bookmark.create({ userId, notebookId });
        res.status(201).json({ message: SUCCESS_STRINGS.Bookmarked });
        return;
    } catch (error) {
        next(error);
    }
};

// Remove a bookmark
export const removeBookmark = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const notebookId = req.params.id;

    try {
        await Bookmark.deleteOne({ userId, notebookId });
        res.status(200).json({ message: SUCCESS_STRINGS.BookmarkRemoved });
        return;
    } catch (error) {
        next(error);
    }
};
