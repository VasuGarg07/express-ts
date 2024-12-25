import { Application } from 'express';

import authRoutes from './authRoutes';
import expenseRouter from './expenseRoutes';
import { authenticate } from '../middlewares/authMiddleware';
import invoiceRouter from './invoiceRouter';

export const initRoutes = (app: Application) => {
    app.use('/api/auth', authRoutes);
    app.use('/api/transactions', authenticate, expenseRouter)
    app.use('/api/invoice', authenticate, invoiceRouter)
};
