import { NextFunction, Request, Response } from 'express';
import * as blogService from './blogService';
import { AuthenticatedRequest } from '../../types';
import { SUCCESS_STRINGS } from '../../utils/response.string';

export const getBlogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await blogService.fetchBlogs(req.query);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getBlogsOfAuthor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await blogService.fetchBlogsByAuthor(req.params.name as string, req.query);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getUserBlogs = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const response = await blogService.fetchUserBlogs(req.user!.id, req.query);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getBlogsByNotebook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await blogService.fetchBlogsByNotebook(req.params.notebookId as string, req.query);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getBlogById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const blog = await blogService.fetchBlogById(req.params.id as string);
    res.status(200).json({ message: 'success', blog });
  } catch (error) {
    next(error);
  }
};

export const getRelatedBlogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const blogs = await blogService.fetchRelatedBlogs(req.params.id as string);
    if (blogs.length === 0) {
      res.status(200).json({ message: 'No related blogs found.', blogs: [] });
      return;
    }
    res.status(200).json({ message: 'Success', blogs });
  } catch (error) {
    next(error);
  }
};

export const addBlog = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { author, title, blogContent, tags, isArchived } = req.body;
    const blog = await blogService.createBlog(req.user!.id, req.params.notebookId as string, {
      author,
      title,
      blogContent,
      tags,
      isArchived,
    });
    res.status(201).json({ message: SUCCESS_STRINGS.BlogAdded, blog });
  } catch (error) {
    next(error);
  }
};

export const updateBlog = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const blog = await blogService.editBlog(req.user!.id, req.params.id as string, req.body);
    res.status(200).json({ message: SUCCESS_STRINGS.BlogUpdated, blog });
  } catch (error) {
    next(error);
  }
};

export const moveBlog = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const blog = await blogService.moveBlogToNotebook(
      req.user!.id,
      req.params.id as string,
      req.params.notebookId as string
    );
    res.status(200).json({ message: SUCCESS_STRINGS.BlogMoved, blog });
  } catch (error) {
    next(error);
  }
};

export const archiveBlog = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const blog = await blogService.archiveBlogById(req.user!.id, req.params.id as string);
    res.status(200).json({ message: SUCCESS_STRINGS.BlogArchived, blog });
  } catch (error) {
    next(error);
  }
};

export const deleteAllBlogs = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const deleteCount = await blogService.removeAllBlogs(req.user!.id);
    res.status(200).json({ message: 'All blogs deleted successfully.', deleteCount });
  } catch (error) {
    next(error);
  }
};

export const deleteArchivedBlogs = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const deleteCount = await blogService.removeArchivedBlogs(req.user!.id);
    res.status(200).json({ message: 'All archived blogs deleted successfully.', deleteCount });
  } catch (error) {
    next(error);
  }
};

export const deleteBlogById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await blogService.removeBlogById(req.user!.id, req.params.id as string);
    res.status(200).json({ message: SUCCESS_STRINGS.BlogDeleted, deleteCount: 1 });
  } catch (error) {
    next(error);
  }
};