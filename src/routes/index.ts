import { Application } from 'express';
import userRoutes from './userRoutes';

export const initRoutes = (app: Application) => {
    app.use('/api/users', userRoutes);
};
