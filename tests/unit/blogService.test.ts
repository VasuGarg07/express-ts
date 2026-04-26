import * as blogService from '../../src/modules/blogs/blogService';
import Blog from '../../src/modules/blogs/blogModel';
import Notebook from '../../src/modules/blogs/notebookModel';
import * as utilities from '../../src/utils/utilities';
import { BlogPatchValidator } from '../../src/modules/blogs/blogValidator';
import { ERROR_STRINGS } from '../../src/utils/response.string';

jest.mock('../../src/modules/blogs/blogModel');
jest.mock('../../src/modules/blogs/notebookModel');
jest.mock('../../src/utils/utilities');
jest.mock('../../src/modules/blogs/blogValidator', () => ({
  BlogPatchValidator: { parse: jest.fn() },
}));

describe('blogService', () => {

  const mockPagination = { page: 1, limit: 10, skip: 0 };
  const mockQuery = { page: '1', limit: '10' };

  beforeEach(() => {
    (utilities.getPaginationParams as jest.Mock).mockReturnValue(mockPagination);
  });

  // Helper to mock the Blog.find().skip().limit().sort() chain
  const mockBlogFindChain = (returnValue: any) => {
    (Blog.find as jest.Mock).mockReturnValue({
      skip: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(returnValue),
        }),
      }),
    });
  };

  // ==================== fetchBlogs ====================
  describe('fetchBlogs', () => {
    it('should return paginated blogs with correct shape', async () => {
      const blogs = [{ _id: '1', title: 'A' }, { _id: '2', title: 'B' }];
      mockBlogFindChain(blogs);
      (Blog.countDocuments as jest.Mock).mockResolvedValue(2);

      const result = await blogService.fetchBlogs(mockQuery);

      expect(result).toEqual({
        data: blogs,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 2,
          itemsPerPage: 10,
        },
      });
      expect(Blog.find).toHaveBeenCalledWith({ isArchived: false });
      expect(Blog.countDocuments).toHaveBeenCalledWith({ isArchived: false });
    });

    it('should return empty data when no blogs exist', async () => {
      mockBlogFindChain([]);
      (Blog.countDocuments as jest.Mock).mockResolvedValue(0);

      const result = await blogService.fetchBlogs(mockQuery);

      expect(result.data).toEqual([]);
      expect(result.pagination.totalItems).toBe(0);
    });
  });

  // ==================== fetchBlogsByAuthor ====================
  describe('fetchBlogsByAuthor', () => {
    it('should filter blogs by author', async () => {
      const blogs = [{ _id: '1', author: 'Alice' }];
      mockBlogFindChain(blogs);
      (Blog.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await blogService.fetchBlogsByAuthor('Alice', mockQuery);

      expect(result.data).toEqual(blogs);
      expect(Blog.find).toHaveBeenCalledWith({ author: 'Alice', isArchived: false });
    });
  });

  // ==================== fetchUserBlogs ====================
  describe('fetchUserBlogs', () => {
    it('should filter blogs by userId (includes archived)', async () => {
      const blogs = [{ _id: '1' }];
      mockBlogFindChain(blogs);
      (Blog.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await blogService.fetchUserBlogs('user-1', mockQuery);

      expect(result.data).toEqual(blogs);
      expect(Blog.find).toHaveBeenCalledWith({ userId: 'user-1' });
    });
  });

  // ==================== fetchBlogsByNotebook ====================
  describe('fetchBlogsByNotebook', () => {
    it('should filter blogs by notebookId', async () => {
      const blogs = [{ _id: '1' }];
      mockBlogFindChain(blogs);
      (Blog.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await blogService.fetchBlogsByNotebook('nb-1', mockQuery);

      expect(result.data).toEqual(blogs);
      expect(Blog.find).toHaveBeenCalledWith({ notebookId: 'nb-1', isArchived: false });
    });
  });

  // ==================== fetchBlogById ====================
  describe('fetchBlogById', () => {
    it('should return the blog when found', async () => {
      const blog = { _id: 'blog-1', title: 'Test' };
      (Blog.findById as jest.Mock).mockResolvedValue(blog);

      const result = await blogService.fetchBlogById('blog-1');

      expect(result).toEqual(blog);
    });

    it('should throw 404 when blog is not found', async () => {
      (Blog.findById as jest.Mock).mockResolvedValue(null);

      await expect(blogService.fetchBlogById('missing-id')).rejects.toMatchObject({
        statusCode: 404,
        message: ERROR_STRINGS.BlogNotFound,
      });
    });
  });

  // ==================== fetchRelatedBlogs ====================
  describe('fetchRelatedBlogs', () => {
    it('should return related blogs by tag overlap', async () => {
      const currentBlog = { _id: 'blog-1', tags: ['tech', 'ai'] };
      const related = [{ _id: 'blog-2', tags: ['ai'] }];

      (Blog.findById as jest.Mock).mockResolvedValue(currentBlog);
      (Blog.find as jest.Mock).mockReturnValue({
        limit: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(related),
        }),
      });

      const result = await blogService.fetchRelatedBlogs('blog-1');

      expect(result).toEqual(related);
      expect(Blog.find).toHaveBeenCalledWith({
        _id: { $ne: 'blog-1' },
        tags: { $in: ['tech', 'ai'] },
        isArchived: false,
      });
    });

    it('should throw 404 when current blog does not exist', async () => {
      (Blog.findById as jest.Mock).mockResolvedValue(null);

      await expect(blogService.fetchRelatedBlogs('missing')).rejects.toMatchObject({
        statusCode: 404,
        message: ERROR_STRINGS.BlogNotFound,
      });
    });

    it('should return empty array when blog has no tags', async () => {
      (Blog.findById as jest.Mock).mockResolvedValue({ _id: 'blog-1', tags: [] });

      const result = await blogService.fetchRelatedBlogs('blog-1');

      expect(result).toEqual([]);
    });
  });

  // ==================== createBlog ====================
  describe('createBlog', () => {
    const blogData = {
      author: 'Alice',
      title: 'Test',
      blogContent: 'content',
      tags: ['tag1'],
    };

    it('should create blog when notebook exists and user owns it', async () => {
      (Notebook.findById as jest.Mock).mockResolvedValue({
        _id: 'nb-1',
        userId: { toString: () => 'user-1' },
      });

      const mockSave = jest.fn().mockResolvedValue({});
      (Blog as any).mockImplementation((data: any) => ({ ...data, save: mockSave }));

      const result = await blogService.createBlog('user-1', 'nb-1', blogData);

      expect(result).toMatchObject({ userId: 'user-1', notebookId: 'nb-1', title: 'Test' });
      expect(mockSave).toHaveBeenCalled();
    });

    it('should throw 404 when notebook does not exist', async () => {
      (Notebook.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        blogService.createBlog('user-1', 'nb-missing', blogData)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: ERROR_STRINGS.NotebookNotFound,
      });
    });

    it('should throw 403 when user does not own the notebook', async () => {
      (Notebook.findById as jest.Mock).mockResolvedValue({
        _id: 'nb-1',
        userId: { toString: () => 'other-user' },
      });

      await expect(
        blogService.createBlog('user-1', 'nb-1', blogData)
      ).rejects.toMatchObject({
        statusCode: 403,
        message: ERROR_STRINGS.UnauthorizedAccess,
      });
    });
  });

  // ==================== editBlog ====================
  describe('editBlog', () => {
    it('should update blog when user owns it', async () => {
      const blog = { _id: 'blog-1', userId: { toString: () => 'user-1' } };
      const updated = { _id: 'blog-1', title: 'Updated' };

      (Blog.findById as jest.Mock).mockResolvedValue(blog);
      (BlogPatchValidator.parse as jest.Mock).mockReturnValue({ title: 'Updated' });
      (Blog.findByIdAndUpdate as jest.Mock).mockResolvedValue(updated);

      const result = await blogService.editBlog('user-1', 'blog-1', { title: 'Updated' });

      expect(result).toEqual(updated);
      expect(Blog.findByIdAndUpdate).toHaveBeenCalledWith(
        'blog-1',
        { title: 'Updated' },
        { new: true }
      );
    });

    it('should throw 400 when blogId is empty', async () => {
      await expect(blogService.editBlog('user-1', '   ', {})).rejects.toMatchObject({
        statusCode: 400,
        message: ERROR_STRINGS.InvalidBlogId,
      });
    });

    it('should throw 404 when blog does not exist', async () => {
      (Blog.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        blogService.editBlog('user-1', 'missing', {})
      ).rejects.toMatchObject({
        statusCode: 404,
        message: ERROR_STRINGS.BlogNotFound,
      });
    });

    it('should throw 403 when user does not own the blog', async () => {
      (Blog.findById as jest.Mock).mockResolvedValue({
        _id: 'blog-1',
        userId: { toString: () => 'other-user' },
      });

      await expect(
        blogService.editBlog('user-1', 'blog-1', {})
      ).rejects.toMatchObject({
        statusCode: 403,
        message: ERROR_STRINGS.UnauthorizedAccess,
      });
    });
  });

  // ==================== moveBlogToNotebook ====================
  describe('moveBlogToNotebook', () => {
    it('should move blog when user owns both blog and notebook', async () => {
      const blog = { _id: 'blog-1', userId: { toString: () => 'user-1' } };
      const notebook = { _id: 'nb-2', userId: { toString: () => 'user-1' } };
      const updated = { _id: 'blog-1', notebookId: 'nb-2' };

      (Blog.findById as jest.Mock).mockResolvedValue(blog);
      (Notebook.findById as jest.Mock).mockResolvedValue(notebook);
      (Blog.findByIdAndUpdate as jest.Mock).mockResolvedValue(updated);

      const result = await blogService.moveBlogToNotebook('user-1', 'blog-1', 'nb-2');

      expect(result).toEqual(updated);
      expect(Blog.findByIdAndUpdate).toHaveBeenCalledWith(
        'blog-1',
        { notebookId: 'nb-2' },
        { new: true }
      );
    });

    it('should throw 400 when blogId is empty', async () => {
      await expect(
        blogService.moveBlogToNotebook('user-1', '', 'nb-2')
      ).rejects.toMatchObject({ statusCode: 400, message: ERROR_STRINGS.InvalidBlogId });
    });

    it('should throw 400 when notebookId is empty', async () => {
      await expect(
        blogService.moveBlogToNotebook('user-1', 'blog-1', '')
      ).rejects.toMatchObject({ statusCode: 400, message: ERROR_STRINGS.InvalidNotebookId });
    });

    it('should throw 404 when blog does not exist', async () => {
      (Blog.findById as jest.Mock).mockResolvedValue(null);
      (Notebook.findById as jest.Mock).mockResolvedValue({ _id: 'nb-2', userId: { toString: () => 'user-1' } });

      await expect(
        blogService.moveBlogToNotebook('user-1', 'missing', 'nb-2')
      ).rejects.toMatchObject({ statusCode: 404, message: ERROR_STRINGS.BlogNotFound });
    });

    it('should throw 404 when notebook does not exist', async () => {
      (Blog.findById as jest.Mock).mockResolvedValue({ _id: 'blog-1', userId: { toString: () => 'user-1' } });
      (Notebook.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        blogService.moveBlogToNotebook('user-1', 'blog-1', 'missing')
      ).rejects.toMatchObject({ statusCode: 404, message: ERROR_STRINGS.NotebookNotFound });
    });

    it('should throw 403 when user does not own the blog', async () => {
      (Blog.findById as jest.Mock).mockResolvedValue({ _id: 'blog-1', userId: { toString: () => 'other' } });
      (Notebook.findById as jest.Mock).mockResolvedValue({ _id: 'nb-2', userId: { toString: () => 'user-1' } });

      await expect(
        blogService.moveBlogToNotebook('user-1', 'blog-1', 'nb-2')
      ).rejects.toMatchObject({ statusCode: 403, message: ERROR_STRINGS.UnauthorizedAccess });
    });

    it('should throw 403 when user does not own the destination notebook', async () => {
      (Blog.findById as jest.Mock).mockResolvedValue({ _id: 'blog-1', userId: { toString: () => 'user-1' } });
      (Notebook.findById as jest.Mock).mockResolvedValue({ _id: 'nb-2', userId: { toString: () => 'other' } });

      await expect(
        blogService.moveBlogToNotebook('user-1', 'blog-1', 'nb-2')
      ).rejects.toMatchObject({ statusCode: 403, message: ERROR_STRINGS.UnauthorizedAccess });
    });
  });

  // ==================== archiveBlogById ====================
  describe('archiveBlogById', () => {
    it('should archive blog when user owns it', async () => {
      const blog = { _id: 'blog-1', userId: { toString: () => 'user-1' } };
      const archived = { _id: 'blog-1', isArchived: true };

      (Blog.findById as jest.Mock).mockResolvedValue(blog);
      (Blog.findByIdAndUpdate as jest.Mock).mockResolvedValue(archived);

      const result = await blogService.archiveBlogById('user-1', 'blog-1');

      expect(result).toEqual(archived);
      expect(Blog.findByIdAndUpdate).toHaveBeenCalledWith(
        'blog-1',
        { isArchived: true },
        { new: true }
      );
    });

    it('should throw 400 when blogId is empty', async () => {
      await expect(blogService.archiveBlogById('user-1', '')).rejects.toMatchObject({
        statusCode: 400,
        message: ERROR_STRINGS.InvalidBlogId,
      });
    });

    it('should throw 404 when blog does not exist', async () => {
      (Blog.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        blogService.archiveBlogById('user-1', 'missing')
      ).rejects.toMatchObject({ statusCode: 404, message: ERROR_STRINGS.BlogNotFound });
    });

    it('should throw 403 when user does not own the blog', async () => {
      (Blog.findById as jest.Mock).mockResolvedValue({
        _id: 'blog-1',
        userId: { toString: () => 'other' },
      });

      await expect(
        blogService.archiveBlogById('user-1', 'blog-1')
      ).rejects.toMatchObject({ statusCode: 403, message: ERROR_STRINGS.UnauthorizedAccess });
    });
  });

  // ==================== removeAllBlogs ====================
  describe('removeAllBlogs', () => {
    it('should return deleted count when blogs exist', async () => {
      (Blog.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 5 });

      const result = await blogService.removeAllBlogs('user-1');

      expect(result).toBe(5);
      expect(Blog.deleteMany).toHaveBeenCalledWith({ userId: 'user-1' });
    });

    it('should throw 404 when no blogs found', async () => {
      (Blog.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 0 });

      await expect(blogService.removeAllBlogs('user-1')).rejects.toMatchObject({
        statusCode: 404,
        message: 'No blogs found',
      });
    });
  });

  // ==================== removeArchivedBlogs ====================
  describe('removeArchivedBlogs', () => {
    it('should return deleted count when archived blogs exist', async () => {
      (Blog.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 3 });

      const result = await blogService.removeArchivedBlogs('user-1');

      expect(result).toBe(3);
      expect(Blog.deleteMany).toHaveBeenCalledWith({ userId: 'user-1', isArchived: true });
    });

    it('should throw 404 when no archived blogs found', async () => {
      (Blog.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 0 });

      await expect(blogService.removeArchivedBlogs('user-1')).rejects.toMatchObject({
        statusCode: 404,
        message: 'No archived blogs found',
      });
    });
  });

  // ==================== removeBlogById ====================
  describe('removeBlogById', () => {
    it('should delete blog when user owns it', async () => {
      const blog = { _id: 'blog-1', userId: { toString: () => 'user-1' } };
      (Blog.findById as jest.Mock).mockResolvedValue(blog);
      (Blog.findByIdAndDelete as jest.Mock).mockResolvedValue(blog);

      await blogService.removeBlogById('user-1', 'blog-1');

      expect(Blog.findByIdAndDelete).toHaveBeenCalledWith('blog-1');
    });

    it('should throw 400 when blogId is empty', async () => {
      await expect(blogService.removeBlogById('user-1', '')).rejects.toMatchObject({
        statusCode: 400,
        message: ERROR_STRINGS.InvalidBlogId,
      });
    });

    it('should throw 404 when blog does not exist', async () => {
      (Blog.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        blogService.removeBlogById('user-1', 'missing')
      ).rejects.toMatchObject({ statusCode: 404, message: ERROR_STRINGS.BlogNotFound });
    });

    it('should throw 403 when user does not own the blog', async () => {
      (Blog.findById as jest.Mock).mockResolvedValue({
        _id: 'blog-1',
        userId: { toString: () => 'other' },
      });

      await expect(
        blogService.removeBlogById('user-1', 'blog-1')
      ).rejects.toMatchObject({ statusCode: 403, message: ERROR_STRINGS.UnauthorizedAccess });
    });
  });
});