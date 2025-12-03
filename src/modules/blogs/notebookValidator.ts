import { z } from "zod";

export const NotebookValidator = z.object({
    author: z
        .string()
        .min(3, "Author name must be at least 3 characters long")
        .max(100, "Author name cannot exceed 100 characters"),
    title: z
        .string()
        .min(3, "Title must be at least 3 characters long")
        .max(100, "Title cannot exceed 100 characters"),
    description: z
        .string()
        .max(500, "Description cannot exceed 500 characters")
        .optional(),
    coverImageUrl: z
        .string()
        .min(1, "Cover image URL is required")
        .url("Cover image must be a valid URL"),
    isPublic: z.boolean().optional(),
});

export const NotebookPatchValidator = NotebookValidator.partial();