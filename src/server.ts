import { createServer } from 'http';
import { Server } from 'socket.io';
import { Application } from 'express';
import { initSocket } from './modules/chats/socket';
import CONFIG from './config/config';

export const createServerWithSocket = (app: Application) => {
    const server = createServer(app);

    const io = new Server(server, {
        cors: { origin: CONFIG.FRONTEND_URL, credentials: true }
    });

    initSocket(io);

    return { server, io };
};