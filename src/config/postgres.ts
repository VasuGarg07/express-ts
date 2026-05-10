import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import CONFIG from "./config";

const pool = new Pool({ connectionString: CONFIG.POSTGRES_URI });

export const db = drizzle(pool);

export const connectPostgres = async () => {
    try {
        const client = await pool.connect();
        console.log("PostgreSQL connected successfully");
        client.release();
    } catch (error) {
        console.error("PostgreSQL connection error: ", error)
    }
}

export default pool;
