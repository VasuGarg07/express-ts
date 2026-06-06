import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables from `.env.local` if it exists, otherwise `.env`.
if (fs.existsSync('.env.local')) {
    dotenv.config({ path: '.env.local' });
} else {
    dotenv.config();
}

const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/boilerplate';
const SECRET_KEY = process.env.JWT_SECRET || 'secret_key';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "encryption_key";
const DB_USERNAME = process.env.DB_USERNAME || "your_db_username";
const DB_PASSWORD = process.env.DB_PASSWORD || "your_db_password";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "your_google_client_id";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "your_google_client_secret";
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/api/auth/google/callback";

const CONFIG = {
    PORT,
    ALLOWED_ORIGINS,
    MONGO_URI,
    SECRET_KEY,
    ENCRYPTION_KEY,
    DB_USERNAME,
    DB_PASSWORD,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL
} as const;

export default CONFIG;