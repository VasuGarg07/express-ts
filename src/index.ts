import { createApplication } from './app';
import CONFIG from './config/config';
import connectDb from './config/db';
import { createServerWithSocket } from './server';
import cron from 'node-cron'
import https from 'https'

const app = createApplication(CONFIG.ALLOWED_ORIGINS);
const { server } = createServerWithSocket(app);

// Connect to MongoDb
connectDb();

cron.schedule('*/14 * * * *', () => {
  const url = process.env.BASE_URL || 'http://localhost:3000';

  https.get(`${url}/health`, (res) => {
    console.log(`[cron] Health check ping — status: ${res.statusCode}`);
  }).on('error', (err) => {
    console.error('[cron] Health check failed:', err.message);
  });
});


// Start the server
server.listen(CONFIG.PORT, () => {
    console.log(`Server is running on port ${CONFIG.PORT}`);
});
