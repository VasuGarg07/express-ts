import { z } from "zod";

// Field Types Enum
export const fieldTypeSchema = z.enum(['text', 'number', 'select', 'multi_select', 'boolean', 'range']);

// Base Validation Configuration Schema (without refine)
const baseValidationConfigSchema = z.object({
    minLength: z.number().min(1).max(500).optional(),
    maxLength: z.number().min(1).max(500).optional(),
    minValue: z.number().min(-999999).max(999999).optional(),
    maxValue: z.number().min(-999999).max(999999).optional(),
    regex: z.string().optional()
});

// Full Validation Configuration Schema (with refine)
export const validationConfigSchema = baseValidationConfigSchema.refine((data) => {
    // Ensure minLength <= maxLength if both are provided
    if (data.minLength && data.maxLength) {
        return data.minLength <= data.maxLength;
    }
    return true;
}, {
    message: "minLength must be less than or equal to maxLength"
}).refine((data) => {
    // Ensure minValue <= maxValue if both are provided
    if (data.minValue && data.maxValue) {
        return data.minValue <= data.maxValue;
    }
    return true;
}, {
    message: "minValue must be less than or equal to maxValue"
});

// Base Field Schema
export const baseFieldSchema = z.object({
    key: z.string()
        .min(1, "Field key is required")
        .max(100, "Field key must be less than 100 characters")
        .regex(/^[a-zA-Z0-9_]+$/, "Field key must contain only letters, numbers, and underscores"),
    label: z.string()
        .min(1, "Field label is required")
        .max(200, "Field label must be less than 200 characters"),
    type: fieldTypeSchema,
    required: z.boolean().default(false)
});

// Text Field Schema
export const textFieldSchema = baseFieldSchema.extend({
    type: z.literal('text'),
    validation: baseValidationConfigSchema.pick({
        minLength: true,
        maxLength: true,
        regex: true
    }).optional()
});

// Number Field Schema
export const numberFieldSchema = baseFieldSchema.extend({
    type: z.literal('number'),
    validation: baseValidationConfigSchema.pick({
        minValue: true,
        maxValue: true
    }).optional()
});

// Select Field Schema
export const selectFieldSchema = baseFieldSchema.extend({
    type: z.literal('select'),
    options: z.array(z.string().min(1, "Option cannot be empty"))
        .min(1, "At least one option is required")
        .max(4, "Maximum 4 options allowed for select field")
        .refine((options) => {
            // Check for duplicate options
            const uniqueOptions = new Set(options);
            return uniqueOptions.size === options.length;
        }, {
            message: "Options must be unique"
        })
});

// Multi-Select Field Schema
export const multiSelectFieldSchema = baseFieldSchema.extend({
    type: z.literal('multi_select'),
    options: z.array(z.string().min(1, "Option cannot be empty"))
        .min(1, "At least one option is required")
        .max(6, "Maximum 6 options allowed for multi-select field")
        .refine((options) => {
            // Check for duplicate options
            const uniqueOptions = new Set(options);
            return uniqueOptions.size === options.length;
        }, {
            message: "Options must be unique"
        })
});

// Boolean Field Schema
export const booleanFieldSchema = baseFieldSchema.extend({
    type: z.literal('boolean')
});

// Range Field Schema (base without refine)
const baseRangeFieldSchema = baseFieldSchema.extend({
    type: z.literal('range'),
    min: z.number().min(1, "Range minimum must be at least 1").max(100, "Range minimum cannot exceed 100"),
    max: z.number().min(1, "Range maximum must be at least 1").max(100, "Range maximum cannot exceed 100")
});

// Range Field Schema with validation
export const rangeFieldSchema = baseRangeFieldSchema.refine((data) => {
    return data.min < data.max;
}, {
    message: "Range minimum must be less than maximum"
});

// Union Field Schema (using base schemas without refine)
export const formFieldSchema = z.discriminatedUnion('type', [
    textFieldSchema,
    numberFieldSchema,
    selectFieldSchema,
    multiSelectFieldSchema,
    booleanFieldSchema,
    baseRangeFieldSchema  // Use base schema without refine
]);

// Enhanced form field schema with all validations
export const validatedFormFieldSchema = z.union([
    textFieldSchema,
    numberFieldSchema,
    selectFieldSchema,
    multiSelectFieldSchema,
    booleanFieldSchema,
    rangeFieldSchema  // Use schema with refine for full validation
]);

// Section Schema (using validated fields)
export const formSectionSchema = z.object({
    key: z.string()
        .min(1, "Section key is required")
        .max(100, "Section key must be less than 100 characters")
        .regex(/^[a-zA-Z0-9_]+$/, "Section key must contain only letters, numbers, and underscores"),
    title: z.string()
        .min(1, "Section title is required")
        .max(200, "Section title must be less than 200 characters"),
    description: z.string()
        .max(500, "Section description must be less than 500 characters")
        .optional(),
    fields: z.array(validatedFormFieldSchema)
        .max(10, "Maximum 10 fields allowed per section")
});

// Step Schema
export const formStepSchema = z.object({
    key: z.string()
        .min(1, "Step key is required")
        .max(100, "Step key must be less than 100 characters")
        .regex(/^[a-zA-Z0-9_]+$/, "Step key must contain only letters, numbers, and underscores"),
    title: z.string()
        .min(1, "Step title is required")
        .max(200, "Step title must be less than 200 characters"),
    description: z.string()
        .max(500, "Step description must be less than 500 characters")
        .optional(),
    sections: z.array(formSectionSchema)
        .min(1, "At least one section is required per step")
        .max(5, "Maximum 5 sections allowed per step")
});

// Form Configuration Schema
export const formConfigSchema = z.object({
    title: z.string()
        .min(1, "Form title is required")
        .max(200, "Form title must be less than 200 characters"),
    description: z.string()
        .max(500, "Form description must be less than 500 characters")
        .optional(),
    steps: z.array(formStepSchema)
        .min(1, "At least one step is required")
        .max(6, "Maximum 6 steps allowed")
});

// Base Form Schema (without refine)
const baseFormSchema = z.object({
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid userId format"),
    title: z.string()
        .min(1, "Form title is required")
        .max(200, "Form title must be less than 200 characters"),
    description: z.string()
        .max(500, "Form description must be less than 500 characters")
        .optional(),
    steps: z.array(formStepSchema)
        .min(1, "At least one step is required")
        .max(6, "Maximum 6 steps allowed"),
    shareUrl: z.string().url("Invalid share URL format"),
    isActive: z.boolean().default(true)
});

// Complete Form Schema (with metadata and validation)
export const formSchema = baseFormSchema.refine((data) => {
    // Validate unique keys across all steps
    const stepKeys = data.steps.map(step => step.key);
    const uniqueStepKeys = new Set(stepKeys);
    return uniqueStepKeys.size === stepKeys.length;
}, {
    message: "Step keys must be unique across the form"
}).refine((data) => {
    // Validate unique keys across all sections
    const sectionKeys = data.steps.flatMap(step => step.sections.map(section => section.key));
    const uniqueSectionKeys = new Set(sectionKeys);
    return uniqueSectionKeys.size === sectionKeys.length;
}, {
    message: "Section keys must be unique across the form"
}).refine((data) => {
    // Validate unique keys across all fields
    const fieldKeys = data.steps.flatMap(step =>
        step.sections.flatMap(section =>
            section.fields.map(field => field.key)
        )
    );
    const uniqueFieldKeys = new Set(fieldKeys);
    return uniqueFieldKeys.size === fieldKeys.length;
}, {
    message: "Field keys must be unique across the form"
});

// Form Response Schema
export const formResponseSchema = z.object({
    formId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid formId format"),
    responses: z.record(z.string(), z.any()),
    ipAddress: z.string().ip().optional(),
    userAgent: z.string().max(500).optional()
});

// Update Schemas (using base schemas)
export const formUpdateSchema = baseFormSchema.partial().omit({ userId: true });
export const formConfigUpdateSchema = formConfigSchema.partial();

// Create Form Schema (without generated fields)
export const createFormSchema = baseFormSchema.omit({
    shareUrl: true
});

// Export validation functions
export const validateFormConfig = (data: unknown) => formConfigSchema.safeParse(data);
export const validateForm = (data: unknown) => formSchema.safeParse(data);
export const validateCreateForm = (data: unknown) => createFormSchema.safeParse(data);
export const validateFormResponse = (data: unknown) => formResponseSchema.safeParse(data);
export const validateFormUpdate = (data: unknown) => formUpdateSchema.safeParse(data);

// Type inference helpers
export type FormConfigType = z.infer<typeof formConfigSchema>;
export type FormType = z.infer<typeof formSchema>;
export type BaseFormType = z.infer<typeof baseFormSchema>;
export type CreateFormType = z.infer<typeof createFormSchema>;
export type FormResponseType = z.infer<typeof formResponseSchema>;
export type FormUpdateType = z.infer<typeof formUpdateSchema>;
export type FormFieldType = z.infer<typeof validatedFormFieldSchema>;