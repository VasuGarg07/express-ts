import { z } from "zod";

export const expenseSchema = z.object({
    title: z.string().min(1, "Title is required"),
    amount: z.number().positive("Amount must be greater than zero"),
    type: z.enum(["income", "expense"], { message: "Type must be either 'income' or 'expense'" }),
    category: z.string().min(1, "Category is required"),
    date: z.number().int().positive("Date must be a valid Unix timestamp"),
    description: z.string().optional()
});

// For PUT or PATCH (partial updates):
export const expenseUpdateSchema = expenseSchema.partial();