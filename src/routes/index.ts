import { Application } from 'express';

import { authenticate } from '../middlewares/authMiddleware';
import authRoutes from './authRoutes';
import expenseRouter from './expenseRoutes';
import invoiceRouter from './invoiceRoutes';
import blogRouter from './blogRoutes';
import jobsRouter from './jobsRoutes';

export const initRoutes = (app: Application) => {
    // Public Routes
    app.use('/api/auth', authRoutes);

    // Authentication Middleware
    app.use(authenticate);

    // Protected routes
    app.use('/api/transactions', expenseRouter);
    app.use('/api/invoice', invoiceRouter);
    app.use('/api/blogify', blogRouter);
    app.use('/api/jobscape', jobsRouter);
};
