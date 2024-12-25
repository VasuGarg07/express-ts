import { Application } from 'express';

import { authenticate } from '../middlewares/authMiddleware';
import authRoutes from './authRoutes';
import expenseRouter from './expenseRoutes';
import invoiceRouter from './invoiceRouter';
import blogRouter from './blogRouter';

export const initRoutes = (app: Application) => {
    app.use('/api/auth', authRoutes);
    app.use('/api/transactions', authenticate, expenseRouter);
    app.use('/api/invoice', authenticate, invoiceRouter);
    app.use('/api/blogify', authenticate, blogRouter);
};
