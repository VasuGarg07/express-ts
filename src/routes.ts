import { Application } from 'express';

import authRoutes from './modules/auth/authRoutes';
import blogRouter from './modules/blogs/blogRoutes';
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
    app.use('/api/transactions', expenseRouter);
    app.use('/api/invoice', invoiceRouter);
    app.use('/api/blogify', blogRouter);
    app.use('/api/jobscape', jobsRouter);
    app.use('/api/formlyst', formsRouter);

    // Global error handler
    app.use(errorHandler);
};
