import { createApplication } from './app';
import CONFIG from './config/config';
import connectMongo from './config/mongodb';
import { connectPostgres } from './config/postgres';
import { createServerWithSocket } from './server';
import cron from 'node-cron'
import https from 'https'

const app = createApplication(CONFIG.ALLOWED_ORIGINS);
const { server } = createServerWithSocket(app);

// Connect to databases
connectMongo();
connectPostgres();

if (CONFIG.NODE_ENV === "prod") {
  cron.schedule('*/14 * * * *', () => {
    const url = process.env.BASE_URL || 'http://localhost:3000';
  
    https.get(`${url}/health`, (res) => {
      console.log(`[cron] Health check ping — status: ${res.statusCode}`);
    }).on('error', (err) => {
      console.error('[cron] Health check failed:', err.message);
    });
  });
}

// Start the server
server.listen(CONFIG.PORT, () => {
    console.log(`Server is up and running on port ${CONFIG.PORT}`);
});
