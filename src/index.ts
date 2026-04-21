import cors from 'cors';
import dotenv from 'dotenv';
import express, { Application } from 'express';
import fs from 'fs';
import { Server } from 'socket.io';
import { createServer } from 'http';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import connectDb from './config/db';
import { initRoutes } from './routes';
import { initSocket } from './modules/chats/socket';
import { errorHandler } from './middlewares/errorMiddleware';

// Load environment variables from `.env.local` if it exists, otherwise `.env`.
if (fs.existsSync('.env.local')) {
    dotenv.config({ path: '.env.local' });
} else {
    dotenv.config();
}

const app: Application = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests, please try again later.'
});

const io: Server = new Server(server, {
    cors: { origin: FRONTEND_URL, credentials: true }
});

// Middleware
app.use(helmet());
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(limiter);
app.use(express.json());

// Connect to MongoDb
connectDb();

// Initialize routes
initRoutes(app);

// Initialize Socket
initSocket(io);

// Global error handler
app.use(errorHandler);

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
