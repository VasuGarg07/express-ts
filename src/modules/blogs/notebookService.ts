import Notebook from './notebookModel';
import Blog from './blogModel';
import { ApiError } from '../../utils/ApiError';
import { ERROR_STRINGS } from '../../utils/response.string';
import { NotebookPatchValidator } from './notebookValidator';
import { getPaginationParams } from '../../utils/utilities';

export const fetchPublicNotebooks = async (query: any) => {
  const { page, limit, skip } = getPaginationParams(query);

  const [notebooks, totalItems] = await Promise.all([
    Notebook.find({ isPublic: true }).skip(skip).limit(limit).sort({ updatedAt: -1 }),
    Notebook.countDocuments({ isPublic: true }),
  ]);

  return {
    data: notebooks,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
      totalItems,
      itemsPerPage: limit,
    },
  };
};

export const fetchNotebooksByAuthor = async (author: string, query: any) => {
  const { page, limit, skip } = getPaginationParams(query);

  const [notebooks, totalItems] = await Promise.all([
    Notebook.find({ author, isPublic: true }).skip(skip).limit(limit).sort({ updatedAt: -1 }),
    Notebook.countDocuments({ author, isPublic: true }),
  ]);

  return {
    data: notebooks,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
      totalItems,
      itemsPerPage: limit,
    },
  };
};

export const fetchUserNotebooks = async (userId: string, query: any) => {
  const { page, limit, skip } = getPaginationParams(query);

  const [notebooks, totalItems] = await Promise.all([
    Notebook.find({ userId }).skip(skip).limit(limit).sort({ updatedAt: -1 }),
    Notebook.countDocuments({ userId }),
  ]);

  return {
    data: notebooks,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
      totalItems,
      itemsPerPage: limit,
    },
  };
};

export const fetchNotebookById = async (id: string) => {
  const notebook = await Notebook.findById(id);
  if (!notebook) {
    throw new ApiError(404, ERROR_STRINGS.NotebookNotFound);
  }
  return notebook;
};

export const createNotebook = async (
  userId: string,
  data: { author: string; title: string; description: string; coverImageUrl?: string; isPublic?: boolean }
) => {
  const notebook = new Notebook({ userId, ...data });
  await notebook.save();
  return notebook;
};

export const editNotebook = async (userId: string, notebookId: string, body: any) => {
  if (!notebookId || notebookId.trim() === '') throw new ApiError(400, ERROR_STRINGS.InvalidNotebookId);

  const notebook = await Notebook.findById(notebookId);
  if (!notebook) throw new ApiError(404, ERROR_STRINGS.NotebookNotFound);
  if (notebook.userId.toString() !== userId) throw new ApiError(403, ERROR_STRINGS.UnauthorizedAccess);

  const validatedData = NotebookPatchValidator.parse(body);
  return Notebook.findByIdAndUpdate(notebookId, validatedData, { new: true });
};

export const removeNotebookById = async (userId: string, notebookId: string) => {
  if (!notebookId || notebookId.trim() === '') throw new ApiError(400, ERROR_STRINGS.InvalidNotebookId);

  const notebook = await Notebook.findById(notebookId);
  if (!notebook) throw new ApiError(404, ERROR_STRINGS.NotebookNotFound);
  if (notebook.userId.toString() !== userId) throw new ApiError(403, ERROR_STRINGS.UnauthorizedAccess);

  const [, deletedBlogs] = await Promise.all([
    Notebook.findByIdAndDelete(notebookId),
    Blog.deleteMany({ notebookId }),
  ]);

  return deletedBlogs.deletedCount;
};