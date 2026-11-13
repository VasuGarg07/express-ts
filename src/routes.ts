import { Application } from 'express';

import authRoutes from './modules/auth/authRoutes';
import blogRouter from './modules/blogs/blogRoutes';
import notebookRouter from './modules/blogs/notebookRoutes';
import expenseRouter from './modules/expenses/expenseRoutes';
import invoiceRouter from './modules/invoices/invoiceRoutes';
import jobsRouter from './modules/jobs/jobsRoutes';
import { authenticate } from './middlewares/authMiddleware';

export const initRoutes = (app: Application) => {
    // Public Routes
    app.use('/api/auth', authRoutes);

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
};