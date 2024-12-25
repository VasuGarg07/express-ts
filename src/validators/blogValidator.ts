import { z } from "zod";

// Zod schema for validating a Blog
export const BlogValidator = z.object({
    author: z
        .string()
        .min(3, "Author name must be at least 3 characters long")
        .max(100, "Author name cannot exceed 100 characters"),
    title: z
        .string()
        .min(5, "Title must be at least 5 characters long")
        .max(200, "Title cannot exceed 200 characters"),
    coverImageUrl: z
        .string()
        .url("Cover image must be a valid URL")
        .regex(/\.(jpg|jpeg|png|webp|gif)$/i, "Cover image must be an image file"),
    blogContent: z
        .string()
        .min(20, "Blog content must be at least 20 characters long"),
    tags: z
        .array(z.string().min(1, "Tag must not be empty"))
        .optional(), // Tags are optional but must be an array of non-empty strings if provided
    isArchived: z.boolean().optional(), // Optional field for soft deletes
});

export const BlogPatchValidator = BlogValidator.partial();
