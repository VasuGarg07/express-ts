import * as formService from '../../src/modules/forms/formService';
import { Form, FormResponse } from '../../src/modules/forms/formsModel';
import * as utilities from '../../src/utils/utilities';
import { Types } from 'mongoose';
import { ERROR_STRINGS } from '../../src/utils/response.string';

jest.mock('../../src/modules/forms/formsModel', () => ({
    Form: Object.assign(jest.fn(), {
        find: jest.fn(),
        findById: jest.fn(),
        findOne: jest.fn(),
        findByIdAndUpdate: jest.fn(),
        findByIdAndDelete: jest.fn(),
        countDocuments: jest.fn(),
    }),
    FormResponse: Object.assign(jest.fn(), {
        find: jest.fn(),
        findById: jest.fn(),
        findByIdAndDelete: jest.fn(),
        countDocuments: jest.fn(),
        deleteMany: jest.fn(),
    }),
}));
jest.mock('../../src/utils/utilities', () => {
  const actual = jest.requireActual('../../src/utils/utilities');
  return {
    ...actual,
    generateShareUrl: jest.fn()
  };
});

describe('formService', () => {

    const validId = new Types.ObjectId().toString();
    const invalidId = 'bad';

    beforeEach(() => {
        (utilities.generateShareUrl as jest.Mock).mockReturnValue('share-abc123');
    });

    // ==================== createForm ====================
    describe('createForm', () => {
        const formData = { title: 'Survey', description: 'Desc', steps: [] };

        it('should create form when under limit', async () => {
            (Form.countDocuments as jest.Mock).mockResolvedValue(5);
            const mockSave = jest.fn().mockResolvedValue({});
            (Form as any).mockImplementation((data: any) => ({ ...data, save: mockSave }));

            const result = await formService.createForm('user-1', formData);

            expect(result).toMatchObject({
                userId: 'user-1',
                title: 'Survey',
                shareUrl: 'share-abc123',
            });
            expect(mockSave).toHaveBeenCalled();
        });

        it('should throw 400 when at form limit', async () => {
            (Form.countDocuments as jest.Mock).mockResolvedValue(25);

            await expect(formService.createForm('user-1', formData)).rejects.toMatchObject({
                statusCode: 400,
                message: 'Maximum 25 forms allowed per user',
            });
        });

        it('should throw 400 when over form limit', async () => {
            (Form.countDocuments as jest.Mock).mockResolvedValue(30);

            await expect(formService.createForm('user-1', formData)).rejects.toMatchObject({
                statusCode: 400,
            });
        });
    });

    // ==================== fetchUserForms ====================
    describe('fetchUserForms', () => {
        it('should return user forms with response counts', async () => {
            const forms = [
                { _id: 'f1', __v: 0, title: 'Form 1', userId: 'user-1' },
                { _id: 'f2', __v: 0, title: 'Form 2', userId: 'user-1' },
            ];

            (Form.find as jest.Mock).mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(forms),
                }),
            });
            (FormResponse.countDocuments as jest.Mock)
                .mockResolvedValueOnce(3)
                .mockResolvedValueOnce(0);

            const result = await formService.fetchUserForms('user-1');

            expect(result).toEqual([
                { id: 'f1', title: 'Form 1', userId: 'user-1', responseCount: 3 },
                { id: 'f2', title: 'Form 2', userId: 'user-1', responseCount: 0 },
            ]);
        });

        it('should return empty array when user has no forms', async () => {
            (Form.find as jest.Mock).mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue([]),
                }),
            });

            const result = await formService.fetchUserForms('user-1');
            expect(result).toEqual([]);
        });
    });

    // ==================== fetchFormById ====================
    describe('fetchFormById', () => {
        it('should return form with response count when user owns it', async () => {
            const form = {
                _id: validId,
                userId: { toString: () => 'user-1' },
                title: 'My Form',
                toObject: function () {
                    return { _id: this._id, userId: 'user-1', title: 'My Form' };
                },
            };

            (Form.findById as jest.Mock).mockResolvedValue(form);
            (FormResponse.countDocuments as jest.Mock).mockResolvedValue(5);

            const result = await formService.fetchFormById(validId, 'user-1');

            expect(result).toMatchObject({ title: 'My Form', responseCount: 5 });
        });

        it('should throw 400 for invalid ObjectId', async () => {
            await expect(formService.fetchFormById(invalidId, 'user-1')).rejects.toMatchObject({
                statusCode: 400,
                message: ERROR_STRINGS.InvalidFormId,
            });
        });

        it('should throw 404 when form not found', async () => {
            (Form.findById as jest.Mock).mockResolvedValue(null);

            await expect(formService.fetchFormById(validId, 'user-1')).rejects.toMatchObject({
                statusCode: 404,
                message: ERROR_STRINGS.FormNotFound,
            });
        });

        it('should throw 403 when user does not own the form', async () => {
            (Form.findById as jest.Mock).mockResolvedValue({
                _id: validId,
                userId: { toString: () => 'other-user' },
            });

            await expect(formService.fetchFormById(validId, 'user-1')).rejects.toMatchObject({
                statusCode: 403,
                message: ERROR_STRINGS.FormNotOwned,
            });
        });
    });

    // ==================== editForm ====================
    describe('editForm', () => {
        it('should update form when user owns it', async () => {
            const form = { _id: validId, userId: { toString: () => 'user-1' } };
            const updated = { _id: validId, title: 'Updated' };

            (Form.findById as jest.Mock).mockResolvedValue(form);
            (Form.findByIdAndUpdate as jest.Mock).mockResolvedValue(updated);

            const result = await formService.editForm(validId, 'user-1', { title: 'Updated' });

            expect(result).toEqual(updated);
            expect(Form.findByIdAndUpdate).toHaveBeenCalledWith(
                validId,
                { title: 'Updated' },
                { new: true, runValidators: true }
            );
        });

        it('should throw 400 for invalid ObjectId', async () => {
            await expect(formService.editForm(invalidId, 'user-1', {})).rejects.toMatchObject({
                statusCode: 400,
            });
        });

        it('should throw 404 when form not found', async () => {
            (Form.findById as jest.Mock).mockResolvedValue(null);

            await expect(formService.editForm(validId, 'user-1', {})).rejects.toMatchObject({
                statusCode: 404,
            });
        });

        it('should throw 403 when user does not own the form', async () => {
            (Form.findById as jest.Mock).mockResolvedValue({
                _id: validId,
                userId: { toString: () => 'other' },
            });

            await expect(formService.editForm(validId, 'user-1', {})).rejects.toMatchObject({
                statusCode: 403,
            });
        });
    });

    // ==================== removeForm ====================
    describe('removeForm', () => {
        it('should delete form and its responses when user owns it', async () => {
            const form = { _id: validId, userId: { toString: () => 'user-1' } };
            (Form.findById as jest.Mock).mockResolvedValue(form);
            (FormResponse.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 2 });
            (Form.findByIdAndDelete as jest.Mock).mockResolvedValue(form);

            await formService.removeForm(validId, 'user-1');

            expect(FormResponse.deleteMany).toHaveBeenCalledWith({ formId: validId });
            expect(Form.findByIdAndDelete).toHaveBeenCalledWith(validId);
        });

        it('should throw 400 for invalid ObjectId', async () => {
            await expect(formService.removeForm(invalidId, 'user-1')).rejects.toMatchObject({
                statusCode: 400,
            });
        });

        it('should throw 404 when form not found', async () => {
            (Form.findById as jest.Mock).mockResolvedValue(null);

            await expect(formService.removeForm(validId, 'user-1')).rejects.toMatchObject({
                statusCode: 404,
            });
        });

        it('should throw 403 when user does not own the form', async () => {
            (Form.findById as jest.Mock).mockResolvedValue({
                _id: validId,
                userId: { toString: () => 'other' },
            });

            await expect(formService.removeForm(validId, 'user-1')).rejects.toMatchObject({
                statusCode: 403,
            });
        });
    });

    // ==================== cloneForm ====================
    describe('cloneForm', () => {
        it('should duplicate form with "(Copy)" suffix and isActive false', async () => {
            const original = {
                _id: validId,
                userId: { toString: () => 'user-1' },
                title: 'Original',
                description: 'Desc',
                steps: [{ q: '1' }],
            };

            (Form.countDocuments as jest.Mock).mockResolvedValue(5);
            (Form.findById as jest.Mock).mockResolvedValue(original);

            const mockSave = jest.fn().mockResolvedValue({});
            (Form as any).mockImplementation((data: any) => ({ ...data, save: mockSave }));

            const result = await formService.cloneForm(validId, 'user-1');

            expect(result).toMatchObject({
                userId: 'user-1',
                title: 'Original (Copy)',
                description: 'Desc',
                isActive: false,
                shareUrl: 'share-abc123',
            });
            expect(mockSave).toHaveBeenCalled();
        });

        it('should throw 400 for invalid ObjectId', async () => {
            await expect(formService.cloneForm(invalidId, 'user-1')).rejects.toMatchObject({
                statusCode: 400,
            });
        });

        it('should throw 400 when at form limit', async () => {
            (Form.countDocuments as jest.Mock).mockResolvedValue(25);

            await expect(formService.cloneForm(validId, 'user-1')).rejects.toMatchObject({
                statusCode: 400,
                message: 'Maximum 25 forms allowed per user',
            });
        });

        it('should throw 404 when original form not found', async () => {
            (Form.countDocuments as jest.Mock).mockResolvedValue(5);
            (Form.findById as jest.Mock).mockResolvedValue(null);

            await expect(formService.cloneForm(validId, 'user-1')).rejects.toMatchObject({
                statusCode: 404,
            });
        });

        it('should throw 403 when user does not own original form', async () => {
            (Form.countDocuments as jest.Mock).mockResolvedValue(5);
            (Form.findById as jest.Mock).mockResolvedValue({
                _id: validId,
                userId: { toString: () => 'other' },
            });

            await expect(formService.cloneForm(validId, 'user-1')).rejects.toMatchObject({
                statusCode: 403,
            });
        });
    });

    // ==================== toggleStatus ====================
    describe('toggleStatus', () => {
        it('should activate an inactive form', async () => {
            const form = { _id: validId, userId: { toString: () => 'user-1' }, isActive: false };
            const updated = { _id: validId, isActive: true };

            (Form.findById as jest.Mock).mockResolvedValue(form);
            (Form.findByIdAndUpdate as jest.Mock).mockResolvedValue(updated);

            const result = await formService.toggleStatus(validId, 'user-1');

            expect(result).toEqual({ form: updated, newStatus: true });
            expect(Form.findByIdAndUpdate).toHaveBeenCalledWith(
                validId,
                { isActive: true },
                { new: true }
            );
        });

        it('should deactivate an active form', async () => {
            const form = { _id: validId, userId: { toString: () => 'user-1' }, isActive: true };
            const updated = { _id: validId, isActive: false };

            (Form.findById as jest.Mock).mockResolvedValue(form);
            (Form.findByIdAndUpdate as jest.Mock).mockResolvedValue(updated);

            const result = await formService.toggleStatus(validId, 'user-1');

            expect(result).toEqual({ form: updated, newStatus: false });
        });

        it('should throw 400 for invalid ObjectId', async () => {
            await expect(formService.toggleStatus(invalidId, 'user-1')).rejects.toMatchObject({
                statusCode: 400,
            });
        });

        it('should throw 404 when form not found', async () => {
            (Form.findById as jest.Mock).mockResolvedValue(null);

            await expect(formService.toggleStatus(validId, 'user-1')).rejects.toMatchObject({
                statusCode: 404,
            });
        });

        it('should throw 403 when user does not own the form', async () => {
            (Form.findById as jest.Mock).mockResolvedValue({
                _id: validId,
                userId: { toString: () => 'other' },
            });

            await expect(formService.toggleStatus(validId, 'user-1')).rejects.toMatchObject({
                statusCode: 403,
            });
        });
    });

    // ==================== searchUserForms ====================
    describe('searchUserForms', () => {
        it('should return matching forms with response counts', async () => {
            const forms = [{ _id: 'f1', title: 'Survey' }];

            (Form.find as jest.Mock).mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(forms),
                }),
            });
            (FormResponse.countDocuments as jest.Mock).mockResolvedValue(2);

            const result = await formService.searchUserForms('user-1', 'Survey');

            expect(result).toEqual([{ _id: 'f1', title: 'Survey', responseCount: 2 }]);
            expect(Form.find).toHaveBeenCalledWith({
                userId: 'user-1',
                $or: [{ title: expect.any(RegExp) }, { description: expect.any(RegExp) }],
            });
        });

        it('should return empty array when no matches found', async () => {
            (Form.find as jest.Mock).mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue([]),
                }),
            });

            const result = await formService.searchUserForms('user-1', 'nothing');
            expect(result).toEqual([]);
        });

        it('should throw 400 when query is empty string', async () => {
            await expect(formService.searchUserForms('user-1', '')).rejects.toMatchObject({
                statusCode: 400,
                message: 'Search query is required',
            });
        });

        it('should throw 400 when query is not a string', async () => {
            await expect(
                formService.searchUserForms('user-1', undefined as any)
            ).rejects.toMatchObject({
                statusCode: 400,
                message: 'Search query is required',
            });
        });
    });

    // ==================== fetchPublicForm ====================
    describe('fetchPublicForm', () => {
        it('should return form without sensitive fields when active', async () => {
            const form = {
                _id: 'f1',
                userId: 'user-1',
                title: 'Public Form',
                steps: [],
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (Form.findOne as jest.Mock).mockReturnValue({
                lean: jest.fn().mockResolvedValue(form),
            });

            const result = await formService.fetchPublicForm('share-abc');

            expect(result).toMatchObject({ _id: 'f1', title: 'Public Form', isActive: true });
            expect(result).not.toHaveProperty('userId');
            expect(result).not.toHaveProperty('createdAt');
            expect(result).not.toHaveProperty('updatedAt');
        });

        it('should throw 404 when shareUrl not found', async () => {
            (Form.findOne as jest.Mock).mockReturnValue({
                lean: jest.fn().mockResolvedValue(null),
            });

            await expect(formService.fetchPublicForm('missing-url')).rejects.toMatchObject({
                statusCode: 404,
                message: ERROR_STRINGS.FormNotFound,
            });
        });

        it('should throw 403 when form is inactive', async () => {
            (Form.findOne as jest.Mock).mockReturnValue({
                lean: jest.fn().mockResolvedValue({ _id: 'f1', isActive: false }),
            });

            await expect(formService.fetchPublicForm('inactive-url')).rejects.toMatchObject({
                statusCode: 403,
                message: ERROR_STRINGS.FormInactive,
            });
        });
    });

    // ==================== submitResponse ====================
    describe('submitResponse', () => {
        it('should save response when form is active', async () => {
            const form = { _id: 'f1', isActive: true };
            const responses = [{ questionId: 'q1', answer: 'yes' }];
            const mockSave = jest.fn().mockResolvedValue({});

            (Form.findOne as jest.Mock).mockResolvedValue(form);
            (FormResponse as any).mockImplementation((data: any) => ({ ...data, save: mockSave, _id: 'resp-1' }));

            const result = await formService.submitResponse('share-abc', responses, '1.2.3.4', 'Mozilla');

            expect(result).toMatchObject({
                formId: 'f1',
                responses,
                ipAddress: '1.2.3.4',
                userAgent: 'Mozilla',
            });
            expect(mockSave).toHaveBeenCalled();
        });

        it('should throw 404 when form not found', async () => {
            (Form.findOne as jest.Mock).mockResolvedValue(null);

            await expect(
                formService.submitResponse('missing-url', [], '', '')
            ).rejects.toMatchObject({
                statusCode: 404,
                message: ERROR_STRINGS.FormNotFound,
            });
        });

        it('should throw 403 when form is inactive', async () => {
            (Form.findOne as jest.Mock).mockResolvedValue({ _id: 'f1', isActive: false });

            await expect(
                formService.submitResponse('share-abc', [], '', '')
            ).rejects.toMatchObject({
                statusCode: 403,
                message: ERROR_STRINGS.FormInactive,
            });
        });
    });

    // ==================== fetchFormResponses ====================
    describe('fetchFormResponses', () => {
        it('should return responses when user owns the form', async () => {
            const form = { _id: validId, userId: { toString: () => 'user-1' } };
            const responses = [{ _id: 'r1' }, { _id: 'r2' }];

            (Form.findById as jest.Mock).mockResolvedValue(form);
            (FormResponse.find as jest.Mock).mockReturnValue({
                sort: jest.fn().mockResolvedValue(responses),
            });

            const result = await formService.fetchFormResponses(validId, 'user-1');

            expect(result).toEqual(responses);
            expect(FormResponse.find).toHaveBeenCalledWith({ formId: validId });
        });

        it('should throw 400 for invalid ObjectId', async () => {
            await expect(
                formService.fetchFormResponses(invalidId, 'user-1')
            ).rejects.toMatchObject({ statusCode: 400 });
        });

        it('should throw 404 when form not found', async () => {
            (Form.findById as jest.Mock).mockResolvedValue(null);

            await expect(
                formService.fetchFormResponses(validId, 'user-1')
            ).rejects.toMatchObject({ statusCode: 404 });
        });

        it('should throw 403 when user does not own the form', async () => {
            (Form.findById as jest.Mock).mockResolvedValue({
                _id: validId,
                userId: { toString: () => 'other' },
            });

            await expect(
                formService.fetchFormResponses(validId, 'user-1')
            ).rejects.toMatchObject({ statusCode: 403 });
        });
    });

    // ==================== fetchResponseById ====================
    describe('fetchResponseById', () => {
        it('should return response when user owns the parent form', async () => {
            const response = { _id: 'r1', formId: 'f1' };
            const form = { _id: 'f1', userId: { toString: () => 'user-1' } };

            (FormResponse.findById as jest.Mock).mockResolvedValue(response);
            (Form.findById as jest.Mock).mockResolvedValue(form);

            const result = await formService.fetchResponseById(validId, 'user-1');

            expect(result).toEqual(response);
        });

        it('should throw 400 for invalid response ObjectId', async () => {
            await expect(
                formService.fetchResponseById(invalidId, 'user-1')
            ).rejects.toMatchObject({
                statusCode: 400,
                message: 'Invalid response ID',
            });
        });

        it('should throw 404 when response not found', async () => {
            (FormResponse.findById as jest.Mock).mockResolvedValue(null);

            await expect(
                formService.fetchResponseById(validId, 'user-1')
            ).rejects.toMatchObject({
                statusCode: 404,
                message: ERROR_STRINGS.ResponseNotFound,
            });
        });

        it('should throw 404 when parent form not found', async () => {
            (FormResponse.findById as jest.Mock).mockResolvedValue({ _id: 'r1', formId: 'f1' });
            (Form.findById as jest.Mock).mockResolvedValue(null);

            await expect(
                formService.fetchResponseById(validId, 'user-1')
            ).rejects.toMatchObject({
                statusCode: 404,
                message: ERROR_STRINGS.FormNotFound,
            });
        });

        it('should throw 403 when user does not own the parent form', async () => {
            (FormResponse.findById as jest.Mock).mockResolvedValue({ _id: 'r1', formId: 'f1' });
            (Form.findById as jest.Mock).mockResolvedValue({
                _id: 'f1',
                userId: { toString: () => 'other' },
            });

            await expect(
                formService.fetchResponseById(validId, 'user-1')
            ).rejects.toMatchObject({
                statusCode: 403,
                message: ERROR_STRINGS.FormNotOwned,
            });
        });
    });

    // ==================== removeResponse ====================
    describe('removeResponse', () => {
        it('should delete response when user owns the parent form', async () => {
            const response = { _id: 'r1', formId: 'f1' };
            const form = { _id: 'f1', userId: { toString: () => 'user-1' } };

            (FormResponse.findById as jest.Mock).mockResolvedValue(response);
            (Form.findById as jest.Mock).mockResolvedValue(form);
            (FormResponse.findByIdAndDelete as jest.Mock).mockResolvedValue(response);

            await formService.removeResponse(validId, 'user-1');

            expect(FormResponse.findByIdAndDelete).toHaveBeenCalledWith(validId);
        });

        it('should throw 400 for invalid response ObjectId', async () => {
            await expect(
                formService.removeResponse(invalidId, 'user-1')
            ).rejects.toMatchObject({ statusCode: 400 });
        });

        it('should throw 404 when response not found', async () => {
            (FormResponse.findById as jest.Mock).mockResolvedValue(null);

            await expect(
                formService.removeResponse(validId, 'user-1')
            ).rejects.toMatchObject({ statusCode: 404 });
        });

        it('should throw 403 when user does not own the parent form', async () => {
            (FormResponse.findById as jest.Mock).mockResolvedValue({ _id: 'r1', formId: 'f1' });
            (Form.findById as jest.Mock).mockResolvedValue({
                _id: 'f1',
                userId: { toString: () => 'other' },
            });

            await expect(
                formService.removeResponse(validId, 'user-1')
            ).rejects.toMatchObject({ statusCode: 403 });
        });
    });

    // ==================== removeAllResponses ====================
    describe('removeAllResponses', () => {
        it('should delete all responses and return count when user owns form', async () => {
            const form = { _id: validId, userId: { toString: () => 'user-1' } };

            (Form.findById as jest.Mock).mockResolvedValue(form);
            (FormResponse.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 7 });

            const result = await formService.removeAllResponses(validId, 'user-1');

            expect(result).toBe(7);
            expect(FormResponse.deleteMany).toHaveBeenCalledWith({ formId: validId });
        });

        it('should return 0 when form has no responses', async () => {
            const form = { _id: validId, userId: { toString: () => 'user-1' } };

            (Form.findById as jest.Mock).mockResolvedValue(form);
            (FormResponse.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 0 });

            const result = await formService.removeAllResponses(validId, 'user-1');

            expect(result).toBe(0);
        });

        it('should throw 400 for invalid ObjectId', async () => {
            await expect(
                formService.removeAllResponses(invalidId, 'user-1')
            ).rejects.toMatchObject({ statusCode: 400 });
        });

        it('should throw 404 when form not found', async () => {
            (Form.findById as jest.Mock).mockResolvedValue(null);

            await expect(
                formService.removeAllResponses(validId, 'user-1')
            ).rejects.toMatchObject({ statusCode: 404 });
        });

        it('should throw 403 when user does not own the form', async () => {
            (Form.findById as jest.Mock).mockResolvedValue({
                _id: validId,
                userId: { toString: () => 'other' },
            });

            await expect(
                formService.removeAllResponses(validId, 'user-1')
            ).rejects.toMatchObject({ statusCode: 403 });
        });
    });
});