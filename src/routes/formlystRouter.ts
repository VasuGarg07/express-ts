import { Router } from "express";
import {
    createForm,
    getUserForms,
    getFormById,
    updateForm,
    deleteForm,
    duplicateForm,
    toggleFormStatus,
    searchForms,
    getPublicForm,
    submitFormResponse,
    getFormResponses,
    getResponseById,
    deleteResponse,
    deleteAllResponses
} from "../controllers/formlystController";
import { validate } from "../middlewares/validationMiddleware";
import {
    createFormSchema,
    formUpdateSchema,
    formResponseSchema
} from "../validators/formlystValidators";

const router = Router();

// ==================== FORM MANAGEMENT ROUTES (Protected) ====================
router.get('/forms', getUserForms);
router.get('/forms/search', searchForms);
router.get('/forms/:formId', getFormById);

router.post('/forms', validate(createFormSchema), createForm);
router.post('/forms/:formId/duplicate', duplicateForm);

router.put('/forms/:formId', validate(formUpdateSchema), updateForm);
router.put('/forms/:formId/toggle-status', toggleFormStatus);

router.delete('/forms/:formId', deleteForm);

// ==================== RESPONSE MANAGEMENT ROUTES (Protected) ====================
router.get('/forms/:formId/responses', getFormResponses);
router.get('/responses/:responseId', getResponseById);

router.delete('/responses/:responseId', deleteResponse);
router.delete('/forms/:formId/responses', deleteAllResponses);

// ==================== PUBLIC ROUTES (No Authentication) ====================
// These routes will be added to the public section in main router
export const publicRoutes = Router();

publicRoutes.get('/:shareUrl', getPublicForm);
publicRoutes.post('/:shareUrl/submit', validate(formResponseSchema), submitFormResponse);

export default router;