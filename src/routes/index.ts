import { Application } from 'express';

import { authenticate } from '../middlewares/authMiddleware';
import authRoutes from './authRoutes';
import expenseRouter from './expenseRoutes';
import invoiceRouter from './invoiceRoutes';
import blogRouter from './blogRoutes';
import jobsRouter from './jobsRoutes';
import formlystRouter, { publicRoutes as formlystPublicRoutes } from './formlystRouter';
import { errorHandler } from '../middlewares/errorMiddleware';

export const initRoutes = (app: Application) => {
    // Public Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/formlyst/public', formlystPublicRoutes);

    // Authentication Middleware
    app.use(authenticate);

    // Protected routes
    app.use('/api/transactions', expenseRouter);
    app.use('/api/invoice', invoiceRouter);
    app.use('/api/blogify', blogRouter);
    app.use('/api/jobscape', jobsRouter);
    app.use('/api/formlyst', formlystRouter);

    // Global error handler
    app.use(errorHandler);
};
