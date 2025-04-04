import cors from 'cors';
import dotenv from 'dotenv';
import express, { Application } from 'express';
import fs from 'fs';

import connectDb from './config/db';
import { initRoutes } from './routes';
import { syncAuthors } from './controllers/notebook/syncAuthor';

// Load environment variables from `.env.local` if it exists, otherwise `.env`.
if (fs.existsSync('.env.local')) {
    dotenv.config({ path: '.env.local' });
} else {
    dotenv.config();
}

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDb
connectDb();

// Initialize routes
initRoutes(app);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
