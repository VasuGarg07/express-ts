import { z } from 'zod';

export const registerSchema = z.object({
    username: z.string().min(6, 'Username must be at least 6 characters long'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    confirmPassword: z.string().min(8),
    securityQuestion: z.string(),
    securityAnswer: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'], // Path for the error
});

export const loginSchema = z.object({
    username: z.string().min(1, 'Username or email is required'),
    password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z
    .object({
        username: z.string().min(1, 'Username or email is required'),
        securityAnswer: z.string().min(1, 'Security answer is required'),
        newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
        confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters long'),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'Passwords must match',
        path: ['confirmPassword'],
    });
