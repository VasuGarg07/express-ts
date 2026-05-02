import express from "express";
import rateLimit from "express-rate-limit";
import cors from 'cors';
import helmet from 'helmet';
import { initRoutes } from "./routes";
import { errorHandler } from "./middlewares/errorMiddleware";

export const createApplication = (frontendUrl: string) => {
    const app = express();

    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000,
        message: 'Too many requests, please try again later.'
    });

    app.use(helmet());
    app.use(cors({ origin: frontendUrl, credentials: true }));
    app.use(limiter);
    app.use(express.json());

    // Initialize routes
    initRoutes(app);

    // Global error handler
    app.use(errorHandler);

    return app;
}