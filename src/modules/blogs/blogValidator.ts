import { z } from "zod";

export const BlogValidator = z.object({
    author: z
        .string()
        .min(3, "Author name must be at least 3 characters long")
        .max(100, "Author name cannot exceed 100 characters"),
    title: z
        .string()
        .min(5, "Title must be at least 5 characters long")
        .max(200, "Title cannot exceed 200 characters"),
    blogContent: z
        .string()
        .min(20, "Blog content must be at least 20 characters long"),
    tags: z
        .array(z.string().min(1, "Tag must not be empty"))
        .optional(),
    isArchived: z.boolean().optional(),
});

export const BlogPatchValidator = BlogValidator.partial();