import { z } from "zod";

// BillingInfo schema
const BillingInfoSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    address: z.string().min(1, "Address is required"),
});

// InvoiceItem schema
const InvoiceItemSchema = z.object({
    name: z.string().min(1, "Item name is required"),
    description: z.string().optional(),
    quantity: z.number().int().positive("Quantity must be a positive integer"),
    price: z.number().nonnegative("Price must be a non-negative number"),
});

// Invoice schema
const InvoiceSchema = z.object({
    currentDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid date format for currentDate",
    }),
    dueDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid date format for dueDate",
    }),
    invoiceNumber: z.string().min(1, "Invoice number is required"),
    currency: z.string().min(1, "Currency is required"),
    currencySymbol: z.string().min(1, "Currency symbol is required"),
    billTo: BillingInfoSchema,
    billFrom: BillingInfoSchema,
    items: z.array(InvoiceItemSchema).nonempty("At least one item is required"),
    taxRate: z.number().min(0, "Tax rate must be 0 or higher").max(100, "Tax rate must be 100% or less"),
    discountRate: z.number().min(0, "Discount rate must be 0 or higher").max(100, "Discount rate must be 100% or less"),
    notes: z.string().optional(),
});

export default InvoiceSchema;
