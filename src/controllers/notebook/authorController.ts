import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../types";
import { Author } from "../../models/notebookModel";
import { ERROR_STRINGS, SUCCESS_STRINGS } from "../../utils/response.string";

// Get current author's profile
export const getMyProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const author = await Author.findOne({ userId: req.user!.id });
        if (!author) {
            res.status(404).json({ error: ERROR_STRINGS.UserNotFound });
            return;
        }
        res.status(200).json({ author });
        return;
    } catch (error) {
        next(error);
    }
};

// Update name or avatar
export const updateMyProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { name, avatar } = req.body;

    try {
        const author = await Author.findOne({ userId: req.user!.id });
        if (!author) {
            res.status(404).json({ error: ERROR_STRINGS.UserNotFound });
            return;
        }

        if (name) author.name = name;
        if (avatar) author.avatar = avatar;

        await author.save();
        res.status(200).json({ message: SUCCESS_STRINGS.ProfileUpdated, author });
        return;
    } catch (error) {
        next(error);
    }
};

// Get public author profile by ID
export const getAuthorById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const author = await Author.findById(req.params.id).select("name avatar");
        if (!author) {
            res.status(404).json({ error: ERROR_STRINGS.UserNotFound });
            return;
        }
        res.status(200).json({ author });
        return;
    } catch (error) {
        next(error);
    }
};
