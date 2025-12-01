import { Application } from 'express';

import authRoutes from './modules/auth/authRoutes';
import blogRouter from './modules/blogs/blogRoutes';
import notebookRouter from './modules/blogs/notebookRoutes';
import expenseRouter from './modules/expenses/expenseRoutes';
import formsRouter, { publicRoutes as formsPublicRouter } from './modules/forms/formsRouter';
import invoiceRouter from './modules/invoices/invoiceRoutes';
import jobsRouter from './modules/jobs/jobsRoutes';
import { errorHandler } from './middlewares/errorMiddleware';
import { authenticate } from './middlewares/authMiddleware';

export const initRoutes = (app: Application) => {
    // Public Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/formlyst/public', formsPublicRouter);

    // Authentication Middleware
    app.use(authenticate);

    // Protected routes

    // Expense Tracker
    app.use('/api/transactions', expenseRouter);

    // Invoice Generator
    app.use('/api/invoice', invoiceRouter);

    // Blogify
    app.use('/api/blogify/notebooks', notebookRouter);
    app.use('/api/blogify/blogs', blogRouter);

    // Jobscape
    app.use('/api/jobscape', jobsRouter);

    // Formlyst
    app.use('/api/formlyst', formsRouter);

    // Global error handler
    app.use(errorHandler);
};