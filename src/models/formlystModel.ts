import mongoose, { Document, Schema, Types } from "mongoose";

// Field Types
export type FieldType = 'text' | 'number' | 'select' | 'multi_select' | 'boolean' | 'range';

// Validation Configuration Interface
export interface IValidationConfig {
    minLength?: number;
    maxLength?: number;
    minValue?: number;
    maxValue?: number;
    regex?: string;
}

// Base Field Interface
export interface IBaseField {
    key: string;
    label: string;
    type: FieldType;
    required: boolean;
}

// Specific Field Interfaces
export interface ITextField extends IBaseField {
    type: 'text';
    validation?: Pick<IValidationConfig, 'minLength' | 'maxLength' | 'regex'>;
}

export interface INumberField extends IBaseField {
    type: 'number';
    validation?: Pick<IValidationConfig, 'minValue' | 'maxValue'>;
}

export interface ISelectField extends IBaseField {
    type: 'select';
    options: string[];
}

export interface IMultiSelectField extends IBaseField {
    type: 'multi_select';
    options: string[];
}

export interface IBooleanField extends IBaseField {
    type: 'boolean';
}

export interface IRangeField extends IBaseField {
    type: 'range';
    min: number;
    max: number;
}

// Union type for all field types
export type IFormField = ITextField | INumberField | ISelectField | IMultiSelectField | IBooleanField | IRangeField;

// Section Interface
export interface IFormSection {
    key: string;
    title: string;
    description?: string;
    fields: IFormField[];
}

// Step Interface
export interface IFormStep {
    key: string;
    title: string;
    description?: string;
    sections: IFormSection[];
}

// Form Configuration Interface
export interface IFormConfig {
    title: string;
    description?: string;
    steps: IFormStep[];
}

// Main Form Document Interface
export interface IForm extends Document {
    userId: Types.ObjectId;
    title: string;
    description?: string;
    steps: IFormStep[];
    shareUrl: string;
    isActive: boolean;
    responseCount: number;
    createdAt: Date;
    updatedAt: Date;
}

// Form Response Interface
export interface IFormResponse extends Document {
    formId: Types.ObjectId;
    responses: Record<string, any>;
    submittedAt: Date;
    ipAddress?: string;
    userAgent?: string;
}

// Validation Configuration Schema
const validationConfigSchema = new Schema<IValidationConfig>({
    minLength: { type: Number },
    maxLength: { type: Number },
    minValue: { type: Number },
    maxValue: { type: Number },
    regex: { type: String }
}, { _id: false });


// Field Schema with discriminators for different field types
const fieldSchema = new Schema<IFormField>({
    key: { type: String, required: true },
    label: { type: String, required: true },
    type: {
        type: String,
        required: true,
        enum: ['text', 'number', 'select', 'multi_select', 'boolean', 'range']
    },
    required: { type: Boolean, default: false },
    // Text field specific
    validation: { type: validationConfigSchema },
    // Select/Multi-select field specific
    options: [{ type: String }],
    // Range field specific
    min: { type: Number },
    max: { type: Number }
}, { _id: false });

// Section Schema
const sectionSchema = new Schema<IFormSection>({
    key: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    fields: [fieldSchema]
}, { _id: false });

// Step Schema
const stepSchema = new Schema<IFormStep>({
    key: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    sections: [sectionSchema]
}, { _id: false });

// Main Form Schema
const formSchema = new Schema<IForm>(
    {
        userId: { type: Schema.Types.ObjectId, required: true, ref: "users" },
        title: { type: String, required: true, maxlength: 200 },
        description: { type: String, maxlength: 500 },
        steps: [stepSchema],
        shareUrl: { type: String, required: true, unique: true },
        isActive: { type: Boolean, default: true },
        responseCount: { type: Number, default: 0 }
    },
    {
        timestamps: true,
        toJSON: {
            transform: (_, ret) => {
                ret.id = ret._id;
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    }
);

// Form Response Schema
const formResponseSchema = new Schema<IFormResponse>(
    {
        formId: { type: Schema.Types.ObjectId, required: true, ref: "forms" },
        responses: { type: Schema.Types.Mixed, required: true },
        submittedAt: { type: Date, default: Date.now },
        ipAddress: { type: String },
        userAgent: { type: String }
    },
    {
        toJSON: {
            transform: (_, ret) => {
                ret.id = ret._id;
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    }
);

// Indexes for performance
formSchema.index({ userId: 1, createdAt: -1 });
formSchema.index({ shareUrl: 1 });
formSchema.index({ isActive: 1 });

formResponseSchema.index({ formId: 1, submittedAt: -1 });

// Models
const Form = mongoose.model<IForm>('forms', formSchema);
const FormResponse = mongoose.model<IFormResponse>('formResponses', formResponseSchema);

export { Form, FormResponse };