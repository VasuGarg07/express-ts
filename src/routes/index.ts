import { Application } from 'express';

import authRoutes from './authRoutes';
import userRoutes from './userRoutes';

export const initRoutes = (app: Application) => {
    app.use('/api/users', userRoutes);
    app.use('/api/auth', authRoutes)
};
