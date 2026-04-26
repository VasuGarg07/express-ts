import { NextFunction, Request, Response } from 'express';
import * as formService from './formService';
import { AuthenticatedRequest } from '../../types';
import { SUCCESS_STRINGS } from '../../utils/response.string';

// ==================== FORM MANAGEMENT ====================

export const createForm = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, steps } = req.body;
    const form = await formService.createForm(req.user!.id, { title, description, steps });
    res.status(201).json({ message: SUCCESS_STRINGS.FormCreated, form });
  } catch (error) {
    next(error);
  }
};

export const getUserForms = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const forms = await formService.fetchUserForms(req.user!.id);
    res.status(200).json({ forms });
  } catch (error) {
    next(error);
  }
};

export const getFormById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const form = await formService.fetchFormById(req.params.formId, req.user!.id);
    res.status(200).json({ form });
  } catch (error) {
    next(error);
  }
};

export const updateForm = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const form = await formService.editForm(req.params.formId, req.user!.id, req.body);
    res.status(200).json({ message: SUCCESS_STRINGS.FormUpdated, form });
  } catch (error) {
    next(error);
  }
};

export const deleteForm = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await formService.removeForm(req.params.formId, req.user!.id);
    res.status(200).json({ message: SUCCESS_STRINGS.FormDeleted });
  } catch (error) {
    next(error);
  }
};

export const duplicateForm = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const form = await formService.cloneForm(req.params.formId, req.user!.id);
    res.status(201).json({ message: SUCCESS_STRINGS.FormDuplicated, form });
  } catch (error) {
    next(error);
  }
};

export const toggleFormStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { form, newStatus } = await formService.toggleStatus(req.params.formId, req.user!.id);
    const message = newStatus ? SUCCESS_STRINGS.FormActivated : SUCCESS_STRINGS.FormDeactivated;
    res.status(200).json({ message, form });
  } catch (error) {
    next(error);
  }
};

export const searchForms = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const forms = await formService.searchUserForms(req.user!.id, req.query.q as string);
    res.status(200).json({ forms });
  } catch (error) {
    next(error);
  }
};

// ==================== PUBLIC FORM ====================

export const getPublicForm = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const form = await formService.fetchPublicForm(req.params.shareUrl);
    res.status(200).json({ form });
  } catch (error) {
    next(error);
  }
};

export const submitFormResponse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const formResponse = await formService.submitResponse(
      req.params.shareUrl,
      req.body.responses,
      req.ip,
      req.get('User-Agent')
    );
    res.status(201).json({
      message: SUCCESS_STRINGS.ResponseSubmitted,
      response: { id: formResponse._id },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== RESPONSE MANAGEMENT ====================

export const getFormResponses = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const responses = await formService.fetchFormResponses(req.params.formId, req.user!.id);
    res.status(200).json({ responses });
  } catch (error) {
    next(error);
  }
};

export const getResponseById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const response = await formService.fetchResponseById(req.params.responseId, req.user!.id);
    res.status(200).json({ response });
  } catch (error) {
    next(error);
  }
};

export const deleteResponse = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await formService.removeResponse(req.params.responseId, req.user!.id);
    res.status(200).json({ message: SUCCESS_STRINGS.ResponseDeleted });
  } catch (error) {
    next(error);
  }
};

export const deleteAllResponses = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const deletedCount = await formService.removeAllResponses(req.params.formId, req.user!.id);
    res.status(200).json({
      message: `${deletedCount} responses deleted successfully`,
      deletedCount,
    });
  } catch (error) {
    next(error);
  }
};