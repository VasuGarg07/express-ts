import * as notebookService from '../../src/modules/blogs/notebookService';
import Notebook from '../../src/modules/blogs/notebookModel';
import Blog from '../../src/modules/blogs/blogModel';
import * as utilities from '../../src/utils/utilities';
import { NotebookPatchValidator } from '../../src/modules/blogs/notebookValidator';
import { ERROR_STRINGS } from '../../src/utils/response.string';

jest.mock('../../src/modules/blogs/notebookModel');
jest.mock('../../src/modules/blogs/blogModel');
jest.mock('../../src/utils/utilities');
jest.mock('../../src/modules/blogs/notebookValidator', () => ({
  NotebookPatchValidator: { parse: jest.fn() },
}));

describe('notebookService', () => {

  const mockPagination = { page: 1, limit: 10, skip: 0 };
  const mockQuery = { page: '1', limit: '10' };

  beforeEach(() => {
    (utilities.getPaginationParams as jest.Mock).mockReturnValue(mockPagination);
  });

  const mockNotebookFindChain = (returnValue: any) => {
    (Notebook.find as jest.Mock).mockReturnValue({
      skip: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(returnValue),
        }),
      }),
    });
  };

  // ==================== fetchPublicNotebooks ====================
  describe('fetchPublicNotebooks', () => {
    it('should return paginated public notebooks', async () => {
      const notebooks = [{ _id: '1', isPublic: true }];
      mockNotebookFindChain(notebooks);
      (Notebook.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await notebookService.fetchPublicNotebooks(mockQuery);

      expect(result).toEqual({
        data: notebooks,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 1,
          itemsPerPage: 10,
        },
      });
      expect(Notebook.find).toHaveBeenCalledWith({ isPublic: true });
    });

    it('should return empty data when no public notebooks exist', async () => {
      mockNotebookFindChain([]);
      (Notebook.countDocuments as jest.Mock).mockResolvedValue(0);

      const result = await notebookService.fetchPublicNotebooks(mockQuery);

      expect(result.data).toEqual([]);
      expect(result.pagination.totalItems).toBe(0);
    });
  });

  // ==================== fetchNotebooksByAuthor ====================
  describe('fetchNotebooksByAuthor', () => {
    it('should filter public notebooks by author', async () => {
      const notebooks = [{ _id: '1', author: 'Alice' }];
      mockNotebookFindChain(notebooks);
      (Notebook.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await notebookService.fetchNotebooksByAuthor('Alice', mockQuery);

      expect(result.data).toEqual(notebooks);
      expect(Notebook.find).toHaveBeenCalledWith({ author: 'Alice', isPublic: true });
    });
  });

  // ==================== fetchUserNotebooks ====================
  describe('fetchUserNotebooks', () => {
    it('should return notebooks for the user (private + public)', async () => {
      const notebooks = [{ _id: '1' }];
      mockNotebookFindChain(notebooks);
      (Notebook.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await notebookService.fetchUserNotebooks('user-1', mockQuery);

      expect(result.data).toEqual(notebooks);
      expect(Notebook.find).toHaveBeenCalledWith({ userId: 'user-1' });
    });
  });

  // ==================== fetchNotebookById ====================
  describe('fetchNotebookById', () => {
    it('should return the notebook when found', async () => {
      const notebook = { _id: 'nb-1', title: 'Test' };
      (Notebook.findById as jest.Mock).mockResolvedValue(notebook);

      const result = await notebookService.fetchNotebookById('nb-1');

      expect(result).toEqual(notebook);
    });

    it('should throw 404 when notebook is not found', async () => {
      (Notebook.findById as jest.Mock).mockResolvedValue(null);

      await expect(notebookService.fetchNotebookById('missing')).rejects.toMatchObject({
        statusCode: 404,
        message: ERROR_STRINGS.NotebookNotFound,
      });
    });
  });

  // ==================== createNotebook ====================
  describe('createNotebook', () => {
    it('should create and save a new notebook', async () => {
      const data = {
        author: 'Alice',
        title: 'New Notebook',
        description: 'Desc',
        coverImageUrl: 'http://img',
        isPublic: true,
      };

      const mockSave = jest.fn().mockResolvedValue({});
      (Notebook as any).mockImplementation((d: any) => ({ ...d, save: mockSave }));

      const result = await notebookService.createNotebook('user-1', data);

      expect(result).toMatchObject({ userId: 'user-1', ...data });
      expect(mockSave).toHaveBeenCalled();
    });
  });

  // ==================== editNotebook ====================
  describe('editNotebook', () => {
    it('should update notebook when user owns it', async () => {
      const notebook = { _id: 'nb-1', userId: { toString: () => 'user-1' } };
      const updated = { _id: 'nb-1', title: 'Updated' };

      (Notebook.findById as jest.Mock).mockResolvedValue(notebook);
      (NotebookPatchValidator.parse as jest.Mock).mockReturnValue({ title: 'Updated' });
      (Notebook.findByIdAndUpdate as jest.Mock).mockResolvedValue(updated);

      const result = await notebookService.editNotebook('user-1', 'nb-1', { title: 'Updated' });

      expect(result).toEqual(updated);
      expect(Notebook.findByIdAndUpdate).toHaveBeenCalledWith(
        'nb-1',
        { title: 'Updated' },
        { new: true }
      );
    });

    it('should throw 400 when notebookId is empty', async () => {
      await expect(notebookService.editNotebook('user-1', '   ', {})).rejects.toMatchObject({
        statusCode: 400,
        message: ERROR_STRINGS.InvalidNotebookId,
      });
    });

    it('should throw 404 when notebook does not exist', async () => {
      (Notebook.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        notebookService.editNotebook('user-1', 'missing', {})
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
        notebookService.editNotebook('user-1', 'nb-1', {})
      ).rejects.toMatchObject({
        statusCode: 403,
        message: ERROR_STRINGS.UnauthorizedAccess,
      });
    });
  });

  // ==================== removeNotebookById ====================
  describe('removeNotebookById', () => {
    it('should delete notebook and cascade delete blogs when user owns it', async () => {
      const notebook = { _id: 'nb-1', userId: { toString: () => 'user-1' } };

      (Notebook.findById as jest.Mock).mockResolvedValue(notebook);
      (Notebook.findByIdAndDelete as jest.Mock).mockResolvedValue(notebook);
      (Blog.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 4 });

      const result = await notebookService.removeNotebookById('user-1', 'nb-1');

      expect(result).toBe(4);
      expect(Notebook.findByIdAndDelete).toHaveBeenCalledWith('nb-1');
      expect(Blog.deleteMany).toHaveBeenCalledWith({ notebookId: 'nb-1' });
    });

    it('should return 0 when notebook has no blogs', async () => {
      const notebook = { _id: 'nb-1', userId: { toString: () => 'user-1' } };

      (Notebook.findById as jest.Mock).mockResolvedValue(notebook);
      (Notebook.findByIdAndDelete as jest.Mock).mockResolvedValue(notebook);
      (Blog.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 0 });

      const result = await notebookService.removeNotebookById('user-1', 'nb-1');

      expect(result).toBe(0);
    });

    it('should throw 400 when notebookId is empty', async () => {
      await expect(
        notebookService.removeNotebookById('user-1', '')
      ).rejects.toMatchObject({
        statusCode: 400,
        message: ERROR_STRINGS.InvalidNotebookId,
      });
    });

    it('should throw 404 when notebook does not exist', async () => {
      (Notebook.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        notebookService.removeNotebookById('user-1', 'missing')
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
        notebookService.removeNotebookById('user-1', 'nb-1')
      ).rejects.toMatchObject({
        statusCode: 403,
        message: ERROR_STRINGS.UnauthorizedAccess,
      });
    });
  });
});