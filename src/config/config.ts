import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables from `.env.local` if it exists, otherwise `.env`.
if (fs.existsSync('.env.local')) {
    dotenv.config({ path: '.env.local' });
} else {
    dotenv.config();
}

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/boilerplate';
const SECRET_KEY = process.env.JWT_SECRET || 'secret_key';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "encryption_key";
const DB_USERNAME = process.env.DB_USERNAME || "your_db_username";
const DB_PASSWORD = process.env.DB_PASSWORD || "your_db_password";

const CONFIG = {
    PORT,
    FRONTEND_URL,
    MONGO_URI,
    SECRET_KEY,
    ENCRYPTION_KEY,
    DB_USERNAME,
    DB_PASSWORD
} as const;

export default CONFIG;