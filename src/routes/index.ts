import { Application } from 'express';

import { authenticate } from '../middlewares/authMiddleware';
import authRoutes from './authRoutes';
import expenseRouter from './expenseRoutes';
import invoiceRouter from './invoiceRoutes';
import blogRouter from './blogRoutes';

export const initRoutes = (app: Application) => {
    app.use('/api/auth', authRoutes);
    app.use('/api/transactions', authenticate, expenseRouter);
    app.use('/api/invoice', authenticate, invoiceRouter);
    app.use('/api/blogify', authenticate, blogRouter);
};
