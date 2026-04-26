import { Types } from 'mongoose';
import { Form, FormResponse } from './formsModel';
import { ApiError } from '../../utils/ApiError';
import { ERROR_STRINGS } from '../../utils/response.string';
import { generateShareUrl, validateObjectId } from '../../utils/utilities';

const MAX_FORMS_PER_USER = 25;

const getOwnedForm = async (formId: string, userId: string) => {
  const form = await Form.findById(formId);
  if (!form) {
    throw new ApiError(404, ERROR_STRINGS.FormNotFound);
  }
  if (form.userId.toString() !== userId) {
    throw new ApiError(403, ERROR_STRINGS.FormNotOwned);
  }
  return form;
};

const enforceFormLimit = async (userId: string) => {
  const count = await Form.countDocuments({ userId });
  if (count >= MAX_FORMS_PER_USER) {
    throw new ApiError(400, `Maximum ${MAX_FORMS_PER_USER} forms allowed per user`);
  }
};

// ==================== FORM MANAGEMENT ====================

export const createForm = async (
  userId: string,
  data: { title: string; description: string; steps: any[] }
) => {
  await enforceFormLimit(userId);

  const form = new Form({ userId, ...data, shareUrl: generateShareUrl() });
  await form.save();
  return form;
};

export const fetchUserForms = async (userId: string) => {
  const forms = await Form.find({ userId }).sort({ createdAt: -1 }).lean();

  return Promise.all(
    forms.map(async (form) => {
      const responseCount = await FormResponse.countDocuments({ formId: form._id });
      const { _id, __v, ...rest } = form;
      return { ...rest, id: _id, responseCount };
    })
  );
};

export const fetchFormById = async (formId: string, userId: string) => {
  validateObjectId(formId, ERROR_STRINGS.InvalidFormId);
  const form = await getOwnedForm(formId, userId);
  const responseCount = await FormResponse.countDocuments({ formId });
  return { ...form.toObject(), responseCount };
};

export const editForm = async (formId: string, userId: string, updateData: any) => {
  validateObjectId(formId, ERROR_STRINGS.InvalidFormId);
  await getOwnedForm(formId, userId);

  return Form.findByIdAndUpdate(formId, updateData, { new: true, runValidators: true });
};

export const removeForm = async (formId: string, userId: string) => {
  validateObjectId(formId, ERROR_STRINGS.InvalidFormId);
  await getOwnedForm(formId, userId);

  await FormResponse.deleteMany({ formId });
  await Form.findByIdAndDelete(formId);
};

export const cloneForm = async (formId: string, userId: string) => {
  validateObjectId(formId, ERROR_STRINGS.InvalidFormId);
  await enforceFormLimit(userId);
  const original = await getOwnedForm(formId, userId);

  const duplicated = new Form({
    userId,
    title: `${original.title} (Copy)`,
    description: original.description,
    steps: original.steps,
    shareUrl: generateShareUrl(),
    isActive: false,
  });

  await duplicated.save();
  return duplicated;
};

export const toggleStatus = async (formId: string, userId: string) => {
  validateObjectId(formId, ERROR_STRINGS.InvalidFormId);
  const form = await getOwnedForm(formId, userId);

  const newStatus = !form.isActive;
  const updated = await Form.findByIdAndUpdate(formId, { isActive: newStatus }, { new: true });
  return { form: updated, newStatus };
};

export const searchUserForms = async (userId: string, q: string) => {
  if (!q || typeof q !== 'string') {
    throw new ApiError(400, 'Search query is required');
  }

  const regex = new RegExp(q, 'i');
  const forms = await Form.find({
    userId,
    $or: [{ title: regex }, { description: regex }],
  }).sort({ createdAt: -1 }).lean();

  return Promise.all(
    forms.map(async (form) => {
      const responseCount = await FormResponse.countDocuments({ formId: form._id });
      return { ...form, responseCount };
    })
  );
};

// ==================== PUBLIC FORM ====================

export const fetchPublicForm = async (shareUrl: string) => {
  const form = await Form.findOne({ shareUrl }).lean();
  if (!form) {
    throw new ApiError(404, ERROR_STRINGS.FormNotFound);
  }
  if (!form.isActive) {
    throw new ApiError(403, ERROR_STRINGS.FormInactive);
  }

  const { userId, createdAt, updatedAt, ...publicForm } = form;
  return publicForm;
};

export const submitResponse = async (
  shareUrl: string,
  responses: any,
  ipAddress?: string,
  userAgent?: string
) => {
  const form = await Form.findOne({ shareUrl });
  if (!form) {
    throw new ApiError(404, ERROR_STRINGS.FormNotFound);
  }
  if (!form.isActive) {
    throw new ApiError(403, ERROR_STRINGS.FormInactive);
  }

  const formResponse = new FormResponse({
    formId: form._id,
    responses,
    ipAddress,
    userAgent,
  });
  await formResponse.save();
  return formResponse;
};

// ==================== RESPONSE MANAGEMENT ====================

// Used by both getResponseById and removeResponse — finds response and verifies form ownership
const getOwnedResponse = async (responseId: string, userId: string) => {
  validateObjectId(responseId, 'Invalid response ID');

  const response = await FormResponse.findById(responseId);
  if (!response) {
    throw new ApiError(404, ERROR_STRINGS.ResponseNotFound);
  }

  const form = await Form.findById(response.formId);
  if (!form) {
    throw new ApiError(404, ERROR_STRINGS.FormNotFound);
  }
  if (form.userId.toString() !== userId) {
    throw new ApiError(403, ERROR_STRINGS.FormNotOwned);
  }

  return response;
};

export const fetchFormResponses = async (formId: string, userId: string) => {
  validateObjectId(formId, ERROR_STRINGS.InvalidFormId);
  await getOwnedForm(formId, userId);

  return FormResponse.find({ formId }).sort({ submittedAt: -1 });
};

export const fetchResponseById = async (responseId: string, userId: string) => {
  return getOwnedResponse(responseId, userId);
};

export const removeResponse = async (responseId: string, userId: string) => {
  await getOwnedResponse(responseId, userId);
  await FormResponse.findByIdAndDelete(responseId);
};

export const removeAllResponses = async (formId: string, userId: string) => {
  validateObjectId(formId, ERROR_STRINGS.InvalidFormId);
  await getOwnedForm(formId, userId);

  const result = await FormResponse.deleteMany({ formId });
  return result.deletedCount;
};