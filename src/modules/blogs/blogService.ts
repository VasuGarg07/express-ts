import Blog from './blogModel';
import Notebook from './notebookModel';
import { ApiError } from '../../utils/ApiError';
import { ERROR_STRINGS } from '../../utils/response.string';
import { BlogPatchValidator } from './blogValidator';
import { getPaginationParams, PaginatedResponse } from '../../utils/utilities';

export const fetchBlogs = async (query: any) => {
  const { page, limit, skip } = getPaginationParams(query);

  const [blogs, totalItems] = await Promise.all([
    Blog.find({ isArchived: false }).skip(skip).limit(limit).sort({ updatedAt: -1 }),
    Blog.countDocuments({ isArchived: false }),
  ]);

  const response: PaginatedResponse<typeof blogs[0]> = {
    data: blogs,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
      totalItems,
      itemsPerPage: limit,
    },
  };

  return response;
};

export const fetchBlogsByAuthor = async (author: string, query: any) => {
  const { page, limit, skip } = getPaginationParams(query);

  const [blogs, totalItems] = await Promise.all([
    Blog.find({ author, isArchived: false }).skip(skip).limit(limit).sort({ updatedAt: -1 }),
    Blog.countDocuments({ author, isArchived: false }),
  ]);

  return {
    data: blogs,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
      totalItems,
      itemsPerPage: limit,
    },
  };
};

export const fetchUserBlogs = async (userId: string, query: any) => {
  const { page, limit, skip } = getPaginationParams(query);

  const [blogs, totalItems] = await Promise.all([
    Blog.find({ userId }).skip(skip).limit(limit).sort({ updatedAt: -1 }),
    Blog.countDocuments({ userId }),
  ]);

  return {
    data: blogs,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
      totalItems,
      itemsPerPage: limit,
    },
  };
};

export const fetchBlogsByNotebook = async (notebookId: string, query: any) => {
  const { page, limit, skip } = getPaginationParams(query);

  const [blogs, totalItems] = await Promise.all([
    Blog.find({ notebookId, isArchived: false }).skip(skip).limit(limit).sort({ updatedAt: -1 }),
    Blog.countDocuments({ notebookId, isArchived: false }),
  ]);

  return {
    data: blogs,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
      totalItems,
      itemsPerPage: limit,
    },
  };
};

export const fetchBlogById = async (id: string) => {
  const blog = await Blog.findById(id);
  if (!blog) throw new ApiError(404, ERROR_STRINGS.BlogNotFound);
  return blog;
};

export const fetchRelatedBlogs = async (id: string) => {
  const currentBlog = await Blog.findById(id);
  if (!currentBlog) throw new ApiError(404, ERROR_STRINGS.BlogNotFound);

  const { tags } = currentBlog;
  if (!tags || tags.length === 0) {
    return [];
  }

  return Blog.find({
    _id: { $ne: id },
    tags: { $in: tags },
    isArchived: false,
  })
    .limit(3)
    .sort({ updatedAt: -1 });
};

export const createBlog = async (
  userId: string,
  notebookId: string,
  data: { author: string; title: string; blogContent: string; tags: string[]; isArchived?: boolean }
) => {
  const notebook = await Notebook.findById(notebookId);
  if (!notebook) throw new ApiError(404, ERROR_STRINGS.NotebookNotFound);
  if (notebook.userId.toString() !== userId) throw new ApiError(403, ERROR_STRINGS.UnauthorizedAccess);

  const blog = new Blog({ userId, notebookId, ...data });
  await blog.save();
  return blog;
};

export const editBlog = async (userId: string, blogId: string, body: any) => {
  if (!blogId || blogId.trim() === '') throw new ApiError(400, ERROR_STRINGS.InvalidBlogId);

  const blog = await Blog.findById(blogId);
  if (!blog) throw new ApiError(404, ERROR_STRINGS.BlogNotFound);
  if (blog.userId.toString() !== userId) throw new ApiError(403, ERROR_STRINGS.UnauthorizedAccess);

  const validatedData = BlogPatchValidator.parse(body);
  return Blog.findByIdAndUpdate(blogId, validatedData, { new: true });
};

export const moveBlogToNotebook = async (userId: string, blogId: string, newNotebookId: string) => {
  if (!blogId || blogId.trim() === '') throw new ApiError(400, ERROR_STRINGS.InvalidBlogId);
  if (!newNotebookId || newNotebookId.trim() === '') throw new ApiError(400, ERROR_STRINGS.InvalidNotebookId);

  const [blog, notebook] = await Promise.all([
    Blog.findById(blogId),
    Notebook.findById(newNotebookId),
  ]);

  if (!blog) throw new ApiError(404, ERROR_STRINGS.BlogNotFound);
  if (!notebook) throw new ApiError(404, ERROR_STRINGS.NotebookNotFound);
  if (blog.userId.toString() !== userId || notebook.userId.toString() !== userId) {
    throw new ApiError(403, ERROR_STRINGS.UnauthorizedAccess);
  }

  return Blog.findByIdAndUpdate(blogId, { notebookId: newNotebookId }, { new: true });
};

export const archiveBlogById = async (userId: string, blogId: string) => {
  if (!blogId || blogId.trim() === '') throw new ApiError(400, ERROR_STRINGS.InvalidBlogId);

  const blog = await Blog.findById(blogId);
  if (!blog) throw new ApiError(404, ERROR_STRINGS.BlogNotFound);
  if (blog.userId.toString() !== userId) throw new ApiError(403, ERROR_STRINGS.UnauthorizedAccess);

  return Blog.findByIdAndUpdate(blogId, { isArchived: true }, { new: true });
};

export const removeAllBlogs = async (userId: string) => {
  const result = await Blog.deleteMany({ userId });
  if (result.deletedCount < 1) throw new ApiError(404, 'No blogs found');
  return result.deletedCount;
};

export const removeArchivedBlogs = async (userId: string) => {
  const result = await Blog.deleteMany({ userId, isArchived: true });
  if (result.deletedCount < 1) throw new ApiError(404, 'No archived blogs found');
  return result.deletedCount;
};

export const removeBlogById = async (userId: string, blogId: string) => {
  if (!blogId || blogId.trim() === '') throw new ApiError(400, ERROR_STRINGS.InvalidBlogId);

  const blog = await Blog.findById(blogId);
  if (!blog) throw new ApiError(404, ERROR_STRINGS.BlogNotFound);
  if (blog.userId.toString() !== userId) throw new ApiError(403, ERROR_STRINGS.UnauthorizedAccess);

  await Blog.findByIdAndDelete(blogId);
};