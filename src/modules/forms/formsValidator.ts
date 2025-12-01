import { z } from 'zod';

// Constants
const FORM_LIMITS = {
    MAX_STEPS: 6,
    MAX_SECTIONS_PER_STEP: 5,
    MAX_FIELDS_PER_SECTION: 10,
    MAX_CHAR_LENGTH: 200,
    MAX_RADIO_OPTIONS: 4,
    MAX_CHECKBOX_OPTIONS: 6,
    RANGE_MIN: 1,
    RANGE_MAX: 100,
} as const;

const VALIDATION_LIMITS = {
    TEXT_MIN_LENGTH: 1,
    TEXT_MAX_LENGTH: 500,
    NUMBER_MIN_VALUE: -999999,
    NUMBER_MAX_VALUE: 999999,
} as const;

// Base field schema
const baseFieldSchema = z.object({
    key: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_]+$/),
    label: z.string().min(1).max(FORM_LIMITS.MAX_CHAR_LENGTH),
    type: z.enum(['text', 'number', 'select', 'multi_select', 'boolean', 'range']),
    required: z.boolean()
});

// Field type schemas
const textFieldSchema = baseFieldSchema.extend({
    type: z.literal('text'),
    validation: z.object({
        minLength: z.number().min(VALIDATION_LIMITS.TEXT_MIN_LENGTH).max(VALIDATION_LIMITS.TEXT_MAX_LENGTH).optional(),
        maxLength: z.number().min(VALIDATION_LIMITS.TEXT_MIN_LENGTH).max(VALIDATION_LIMITS.TEXT_MAX_LENGTH).optional(),
        regex: z.string().optional()
    }).optional()
});

const numberFieldSchema = baseFieldSchema.extend({
    type: z.literal('number'),
    validation: z.object({
        minValue: z.number().min(VALIDATION_LIMITS.NUMBER_MIN_VALUE).max(VALIDATION_LIMITS.NUMBER_MAX_VALUE).optional(),
        maxValue: z.number().min(VALIDATION_LIMITS.NUMBER_MIN_VALUE).max(VALIDATION_LIMITS.NUMBER_MAX_VALUE).optional()
    }).optional()
});

const selectFieldSchema = baseFieldSchema.extend({
    type: z.literal('select'),
    options: z.array(z.string().min(1)).min(1).max(FORM_LIMITS.MAX_RADIO_OPTIONS)
});

const multiSelectFieldSchema = baseFieldSchema.extend({
    type: z.literal('multi_select'),
    options: z.array(z.string().min(1)).min(1).max(FORM_LIMITS.MAX_CHECKBOX_OPTIONS)
});

const booleanFieldSchema = baseFieldSchema.extend({
    type: z.literal('boolean')
});

const rangeFieldSchema = baseFieldSchema.extend({
    type: z.literal('range'),
    min: z.number().min(FORM_LIMITS.RANGE_MIN).max(FORM_LIMITS.RANGE_MAX),
    max: z.number().min(FORM_LIMITS.RANGE_MIN).max(FORM_LIMITS.RANGE_MAX)
});

// Field union
const fieldSchema = z.discriminatedUnion('type', [
    textFieldSchema,
    numberFieldSchema,
    selectFieldSchema,
    multiSelectFieldSchema,
    booleanFieldSchema,
    rangeFieldSchema
]);

// Section schema
const sectionSchema = z.object({
    key: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_]+$/),
    title: z.string().min(1).max(FORM_LIMITS.MAX_CHAR_LENGTH),
    description: z.string().max(500).optional(),
    fields: z.array(fieldSchema).min(1).max(FORM_LIMITS.MAX_FIELDS_PER_SECTION)
});

// Step schema
const stepSchema = z.object({
    key: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_]+$/),
    title: z.string().min(1).max(FORM_LIMITS.MAX_CHAR_LENGTH),
    description: z.string().max(500).optional(),
    sections: z.array(sectionSchema).min(1).max(FORM_LIMITS.MAX_SECTIONS_PER_STEP)
});


// Business logic validation functions
const validateUniqueKeys = (data: any): boolean => {
    const allKeys: string[] = [];

    for (const step of data.steps || []) {
        allKeys.push(step.key);
        for (const section of step.sections || []) {
            allKeys.push(section.key);
            for (const field of section.fields || []) {
                allKeys.push(field.key);
            }
        }
    }

    return new Set(allKeys).size === allKeys.length;
};

const validateRangeFields = (data: any): boolean => {
    for (const step of data.steps || []) {
        for (const section of step.sections || []) {
            for (const field of section.fields || []) {
                if (field.type === 'range' && field.min >= field.max) {
                    return false;
                }
            }
        }
    }
    return true;
};

const validateTextFieldValidation = (data: any): boolean => {
    for (const step of data.steps || []) {
        for (const section of step.sections || []) {
            for (const field of section.fields || []) {
                if (field.type === 'text' && field.validation) {
                    const { minLength, maxLength } = field.validation;
                    if (minLength !== undefined && maxLength !== undefined && minLength > maxLength) {
                        return false;
                    }
                }
            }
        }
    }
    return true;
};

const validateNumberFieldValidation = (data: any): boolean => {
    for (const step of data.steps || []) {
        for (const section of step.sections || []) {
            for (const field of section.fields || []) {
                if (field.type === 'number' && field.validation) {
                    const { minValue, maxValue } = field.validation;
                    if (minValue !== undefined && maxValue !== undefined && minValue > maxValue) {
                        return false;
                    }
                }
            }
        }
    }
    return true;
};

const validateSelectOptions = (data: any): boolean => {
    for (const step of data.steps || []) {
        for (const section of step.sections || []) {
            for (const field of section.fields || []) {
                if (field.type === 'select' || field.type === 'multi_select') {
                    const uniqueOptions = new Set(field.options || []);
                    if (uniqueOptions.size !== (field.options || []).length) {
                        return false;
                    }
                    if ((field.options || []).some((option: string) => !option || option.trim().length === 0)) {
                        return false;
                    }
                }
            }
        }
    }
    return true;
};

const validateRegexPatterns = (data: any): boolean => {
    for (const step of data.steps || []) {
        for (const section of step.sections || []) {
            for (const field of section.fields || []) {
                if (field.type === 'text' && field.validation?.regex) {
                    try {
                        new RegExp(field.validation.regex);
                    } catch {
                        return false;
                    }
                }
            }
        }
    }
    return true;
};

// Enhanced validation with business logic
const enhancedFormValidation = (schema: z.ZodSchema) => {
    return schema.refine(validateUniqueKeys, {
        message: 'Duplicate keys found across form entities',
        path: ['keys']
    }).refine(validateRangeFields, {
        message: 'Range field min must be less than max',
        path: ['range']
    }).refine(validateTextFieldValidation, {
        message: 'Text field minLength must be less than or equal to maxLength',
        path: ['textValidation']
    }).refine(validateNumberFieldValidation, {
        message: 'Number field minValue must be less than or equal to maxValue',
        path: ['numberValidation']
    }).refine(validateSelectOptions, {
        message: 'Select/Multi-select fields must have unique, non-empty options',
        path: ['selectOptions']
    }).refine(validateRegexPatterns, {
        message: 'Invalid regex pattern in text field validation',
        path: ['regexValidation']
    });
};

// ==================== SCHEMAS FOR ROUTER ====================

// 1. Create Form Schema (used in POST /forms)
export const createFormSchema = enhancedFormValidation(
    z.object({
        title: z.string().min(1).max(FORM_LIMITS.MAX_CHAR_LENGTH),
        description: z.string().max(500).optional(),
        steps: z.array(stepSchema).min(1).max(FORM_LIMITS.MAX_STEPS),
        isActive: z.boolean().default(true)
    })
);

// 2. Form Update Schema (used in PUT /forms/:formId)
export const formUpdateSchema = enhancedFormValidation(
    z.object({
        title: z.string().min(1).max(FORM_LIMITS.MAX_CHAR_LENGTH).optional(),
        description: z.string().max(500).optional(),
        steps: z.array(stepSchema).min(1).max(FORM_LIMITS.MAX_STEPS).optional(),
        isActive: z.boolean().optional()
    }).refine((data) => {
        // At least one field must be provided for update
        return data.title !== undefined ||
            data.description !== undefined ||
            data.steps !== undefined ||
            data.isActive !== undefined;
    }, {
        message: 'At least one field must be provided for update',
        path: ['update']
    })
);

// 3. Form Response Schema (used in POST /:shareUrl/submit)
export const formResponseSchema = z.object({
    responses: z.record(z.string(), z.any()).refine((responses) => {
        // Ensure responses object is not empty
        return Object.keys(responses).length > 0;
    }, {
        message: 'At least one response is required',
        path: ['responses']
    }),
    ipAddress: z.string().ip().optional(),
    userAgent: z.string().max(500).optional()
});