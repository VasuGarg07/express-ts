import { NextFunction, Request, Response } from 'express';
import * as notebookService from './notebookService';
import { AuthenticatedRequest } from '../../types';
import { SUCCESS_STRINGS } from '../../utils/response.string';

export const getNotebooks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await notebookService.fetchPublicNotebooks(req.query);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getNotebooksByAuthor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await notebookService.fetchNotebooksByAuthor(req.params.name as string, req.query);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getUserNotebooks = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const response = await notebookService.fetchUserNotebooks(req.user!.id, req.query);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getNotebookById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notebook = await notebookService.fetchNotebookById(req.params.id as string);
    res.status(200).json({ message: 'success', notebook });
  } catch (error) {
    next(error);
  }
};

export const addNotebook = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { author, title, description, coverImageUrl, isPublic } = req.body;
    const notebook = await notebookService.createNotebook(req.user!.id, {
      author,
      title,
      description,
      coverImageUrl,
      isPublic,
    });
    res.status(201).json({ message: SUCCESS_STRINGS.NotebookCreated, notebook });
  } catch (error) {
    next(error);
  }
};

export const updateNotebook = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const notebook = await notebookService.editNotebook(req.user!.id, req.params.id as string, req.body);
    res.status(200).json({ message: SUCCESS_STRINGS.NotebookUpdated, notebook });
  } catch (error) {
    next(error);
  }
};

export const deleteNotebookById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const blogsDeleted = await notebookService.removeNotebookById(req.user!.id, req.params.id as string);
    res.status(200).json({ message: SUCCESS_STRINGS.NotebookDeleted, blogsDeleted });
  } catch (error) {
    next(error);
  }
};