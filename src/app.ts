import express from "express";
import rateLimit from "express-rate-limit";
import cors from 'cors';
import helmet from 'helmet';
import { initRoutes } from "./routes";
import { errorHandler } from "./middlewares/errorMiddleware";
import passport from "passport";

export const createApplication = (allowedOrigins: string[]) => {
    const app = express();

    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000,
        message: 'Too many requests, please try again later.'
    });

    app.use(helmet());
    app.use(cors({ origin: allowedOrigins, credentials: true }));
    app.use(limiter);
    app.use(express.json());
    app.use(passport.initialize());

    // Health Check
    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Initialize routes
    initRoutes(app);

    // Global error handler
    app.use(errorHandler);

    return app;
}