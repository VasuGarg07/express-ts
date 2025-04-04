import { z } from "zod";

// ================== Author ==================
export const authorSchema = z.object({
    name: z.string().min(1, "Name is required"),
    avatar: z.string().min(1, "Avatar string is required"), // Can validate base64 format later if needed
});

export const authorUpdateSchema = authorSchema.partial();

// ================== Notebook ==================
export const notebookSchema = z.object({
    title: z.string().min(1, "Title is required"),
    coverImageUrl: z.string().url("Cover image must be a valid URL").optional(),
    visibility: z.enum(["public", "private"], {
        required_error: "Visibility is required",
    }),
    password: z
        .string()
        .min(4, "Password must be at least 4 characters")
        .optional()
        .or(z.literal("")), // allow empty string to remove password
});

// Validation logic for PATCH/PUT
export const notebookUpdateSchema = z.object({
    title: z.string().min(1).optional(),
    coverImageUrl: z.string().url().optional(),
    visibility: z.enum(["public", "private"]).optional(),
    password: z
        .string()
        .min(4, "Password must be at least 4 characters")
        .optional()
        .or(z.literal("")),
});

// ================== Chapter ==================
export const chapterSchema = z.object({
    notebookId: z.string().min(1, "Notebook ID is required"),
    title: z.string().min(1, "Title is required"),
    content: z.string().optional(), // markdown content
    order: z.number().int().nonnegative().optional(),
});

export const chapterUpdateSchema = z.object({
    title: z.string().optional(),
    content: z.string().optional(),
    order: z.number().int().nonnegative().optional(),
});
