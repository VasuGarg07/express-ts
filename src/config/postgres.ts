import { Pool } from "pg";
import CONFIG from "./config";

const pool = new Pool({
    connectionString: CONFIG.POSTGRES_URI,
});

export const connectPostgres = async () => {
    try {
        const client = await pool.connect();
        console.log("PostgreSQL connected successfully");
        client.release();
        await initDb();
    } catch (error) {
        console.error("PostgreSQL connection error: ", error)
    }
}

const initDb = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS expenses (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(24) NOT NULL,
            title TEXT NOT NULL,
            amount NUMERIC NOT NULL CHECK (amount > 0),
            type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
            category TEXT NOT NULL,
            date BIGINT,
            description TEXT
        );
    `);
}

export default pool;