import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import { Form, FormResponse } from './formsModel';
import { AuthenticatedRequest } from '../../types';
import { ERROR_STRINGS, SUCCESS_STRINGS } from '../../utils/response.string';
import { generateShareUrl, handleDocTransform } from '../../utils/utilities';

// Constants
const MAX_FORMS_PER_USER = 25;

// Helper function to check if user owns the form
const checkFormOwnership = async (formId: string, userId: string) => {
    const form = await Form.findById(formId);
    if (!form) {
        throw new Error(ERROR_STRINGS.FormNotFound);
    }
    if (form.userId.toString() !== userId) {
        throw new Error(ERROR_STRINGS.FormNotOwned);
    }
    return form;
};

// ==================== FORM MANAGEMENT CONTROLLERS ====================

// Create a new form
export const createForm = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { title, description, steps } = req.body;

    try {
        // Check user's form limit
        const existingFormsCount = await Form.countDocuments({ userId });
        if (existingFormsCount >= MAX_FORMS_PER_USER) {
            res.status(400).json({
                message: `Maximum ${MAX_FORMS_PER_USER} forms allowed per user`
            });
            return;
        }

        // Generate unique share URL
        const shareUrl = generateShareUrl();

        // Create form
        const form = new Form({
            userId,
            title,
            description,
            steps,
            shareUrl
        });

        await form.save();
        res.status(201).json({ message: SUCCESS_STRINGS.FormCreated, form });
    } catch (error) {
        next(error);
    }
};

// Get all forms for logged-in user
export const getUserForms = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;

    try {
        const forms = await Form.find({ userId }).sort({ createdAt: -1 }).lean();

        // Get response counts for all forms
        const formsWithCounts = await Promise.all(
            forms.map(async (form) => {
                const responseCount = await FormResponse.countDocuments({ formId: form._id });

                // Destructure and transform in one step
                const { _id, __v, ...rest } = form;

                return {
                    ...rest,
                    id: _id,
                    responseCount,
                };
            })
        );

        res.status(200).json({ forms: formsWithCounts });
    } catch (error) {
        next(error);
    }
};

// Get specific form by ID (owner only)
export const getFormById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { formId } = req.params;

    try {
        if (!Types.ObjectId.isValid(formId)) {
            res.status(400).json({ message: ERROR_STRINGS.InvalidFormId });
            return;
        }

        const form = await checkFormOwnership(formId, userId);

        // Get response count
        const responseCount = await FormResponse.countDocuments({ formId });
        const formWithCount = { ...form.toObject(), responseCount };

        res.status(200).json({ form: formWithCount });
    } catch (error) {
        next(error);
    }
};

// Update form configuration
export const updateForm = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { formId } = req.params;
    const updateData = req.body;

    try {
        if (!Types.ObjectId.isValid(formId)) {
            res.status(400).json({ message: ERROR_STRINGS.InvalidFormId });
            return;
        }

        await checkFormOwnership(formId, userId);

        // Update form
        const updatedForm = await Form.findByIdAndUpdate(
            formId,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({ message: SUCCESS_STRINGS.FormUpdated, form: updatedForm });
    } catch (error) {
        next(error);
    }
};

// Delete form (hard delete with cascade)
export const deleteForm = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { formId } = req.params;

    try {
        if (!Types.ObjectId.isValid(formId)) {
            res.status(400).json({ message: ERROR_STRINGS.InvalidFormId });
            return;
        }

        await checkFormOwnership(formId, userId);

        // Delete all responses first
        await FormResponse.deleteMany({ formId });

        // Delete form
        await Form.findByIdAndDelete(formId);

        res.status(200).json({ message: SUCCESS_STRINGS.FormDeleted });
    } catch (error) {
        next(error);
    }
};

// Duplicate existing form
export const duplicateForm = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { formId } = req.params;

    try {
        if (!Types.ObjectId.isValid(formId)) {
            res.status(400).json({ message: ERROR_STRINGS.InvalidFormId });
            return;
        }

        // Check user's form limit
        const existingFormsCount = await Form.countDocuments({ userId });
        if (existingFormsCount >= MAX_FORMS_PER_USER) {
            res.status(400).json({
                message: `Maximum ${MAX_FORMS_PER_USER} forms allowed per user`
            });
            return;
        }

        const originalForm = await checkFormOwnership(formId, userId);

        // Create duplicate form
        const duplicatedForm = new Form({
            userId,
            title: `${originalForm.title} (Copy)`,
            description: originalForm.description,
            steps: originalForm.steps,
            shareUrl: generateShareUrl(),
            isActive: false // Start as inactive
        });

        await duplicatedForm.save();
        res.status(201).json({ message: SUCCESS_STRINGS.FormDuplicated, form: duplicatedForm });
    } catch (error) {
        next(error);
    }
};

// Toggle form status (activate/deactivate)
export const toggleFormStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { formId } = req.params;

    try {
        if (!Types.ObjectId.isValid(formId)) {
            res.status(400).json({ message: ERROR_STRINGS.InvalidFormId });
            return;
        }

        const form = await checkFormOwnership(formId, userId);

        // Toggle status
        const newStatus = !form.isActive;
        const updatedForm = await Form.findByIdAndUpdate(
            formId,
            { isActive: newStatus },
            { new: true }
        );

        const message = newStatus ? SUCCESS_STRINGS.FormActivated : SUCCESS_STRINGS.FormDeactivated;
        res.status(200).json({ message, form: updatedForm });
    } catch (error) {
        next(error);
    }
};

// Search user's forms
export const searchForms = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { q } = req.query;

    try {
        if (!q || typeof q !== 'string') {
            res.status(400).json({ message: "Search query is required" });
            return;
        }

        const searchRegex = new RegExp(q, 'i');
        const forms = await Form.find({
            userId,
            $or: [
                { title: searchRegex },
                { description: searchRegex }
            ]
        }).sort({ createdAt: -1 }).lean();

        // Get response counts for search results
        const formsWithCounts = await Promise.all(
            forms.map(async (form) => {
                const responseCount = await FormResponse.countDocuments({ formId: form._id });
                return { ...form, responseCount };
            })
        );

        res.status(200).json({ forms: formsWithCounts });
    } catch (error) {
        next(error);
    }
};

// ==================== PUBLIC FORM CONTROLLERS ====================

// Get form by share URL (public access)
export const getPublicForm = async (req: Request, res: Response, next: NextFunction) => {
    const { shareUrl } = req.params;

    try {
        const form = await Form.findOne({ shareUrl }).lean();
        if (!form) {
            res.status(404).json({ message: ERROR_STRINGS.FormNotFound });
            return;
        }

        if (!form.isActive) {
            res.status(403).json({ message: ERROR_STRINGS.FormInactive });
            return;
        }

        // Remove sensitive data for public access
        const { userId, createdAt, updatedAt, ...publicForm } = form;
        res.status(200).json({ form: publicForm });
    } catch (error) {
        next(error);
    }
};

// Submit form response (public access)
export const submitFormResponse = async (req: Request, res: Response, next: NextFunction) => {
    const { shareUrl } = req.params;
    const { responses } = req.body;

    try {
        // Find form by share URL
        const form = await Form.findOne({ shareUrl });
        if (!form) {
            res.status(404).json({ message: ERROR_STRINGS.FormNotFound });
            return;
        }

        if (!form.isActive) {
            res.status(403).json({ message: ERROR_STRINGS.FormInactive });
            return;
        }

        // Create response
        const formResponse = new FormResponse({
            formId: form._id,
            responses,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        await formResponse.save();
        res.status(201).json({ message: SUCCESS_STRINGS.ResponseSubmitted, response: { id: formResponse._id } });
    } catch (error) {
        next(error);
    }
};

// ==================== RESPONSE MANAGEMENT CONTROLLERS ====================

// Get all responses for a form (owner only)
export const getFormResponses = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { formId } = req.params;

    try {
        if (!Types.ObjectId.isValid(formId)) {
            res.status(400).json({ message: ERROR_STRINGS.InvalidFormId });
            return;
        }

        await checkFormOwnership(formId, userId);

        const responses = await FormResponse.find({ formId })
            .sort({ submittedAt: -1 })

        res.status(200).json({ responses });
    } catch (error) {
        next(error);
    }
};

// Get specific response (owner only)
export const getResponseById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { responseId } = req.params;

    try {
        if (!Types.ObjectId.isValid(responseId)) {
            res.status(400).json({ message: "Invalid response ID" });
            return;
        }

        const response = await FormResponse.findById(responseId);
        if (!response) {
            res.status(404).json({ message: ERROR_STRINGS.ResponseNotFound });
            return;
        }

        // Get the form to check ownership
        const form = await Form.findById(response.formId);
        if (!form) {
            res.status(404).json({ message: ERROR_STRINGS.FormNotFound });
            return;
        }

        // Check if user owns the form
        if (form.userId.toString() !== userId) {
            res.status(403).json({ message: ERROR_STRINGS.FormNotOwned });
            return;
        }

        res.status(200).json({ response });
    } catch (error) {
        next(error);
    }
};

// Delete specific response
export const deleteResponse = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { responseId } = req.params;

    try {
        if (!Types.ObjectId.isValid(responseId)) {
            res.status(400).json({ message: "Invalid response ID" });
            return;
        }

        const response = await FormResponse.findById(responseId);
        if (!response) {
            res.status(404).json({ message: ERROR_STRINGS.ResponseNotFound });
            return;
        }

        // Get the form to check ownership
        const form = await Form.findById(response.formId);
        if (!form) {
            res.status(404).json({ message: ERROR_STRINGS.FormNotFound });
            return;
        }

        // Check if user owns the form
        if (form.userId.toString() !== userId) {
            res.status(403).json({ message: ERROR_STRINGS.FormNotOwned });
            return;
        }

        await FormResponse.findByIdAndDelete(responseId);
        res.status(200).json({ message: SUCCESS_STRINGS.ResponseDeleted });
    } catch (error) {
        next(error);
    }
};

// Delete all responses for a form
export const deleteAllResponses = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { formId } = req.params;

    try {
        if (!Types.ObjectId.isValid(formId)) {
            res.status(400).json({ message: ERROR_STRINGS.InvalidFormId });
            return;
        }

        await checkFormOwnership(formId, userId);

        const result = await FormResponse.deleteMany({ formId });
        res.status(200).json({
            message: `${result.deletedCount} responses deleted successfully`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        next(error);
    }
};