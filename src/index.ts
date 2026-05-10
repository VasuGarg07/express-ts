import { createApplication } from './app';
import CONFIG from './config/config';
import connectMongo from './config/mongodb';
import { connectPostgres } from './config/postgres';
import { createServerWithSocket } from './server';

const app = createApplication(CONFIG.FRONTEND_URL);
const { server } = createServerWithSocket(app);

// Connect to databases
connectMongo();
connectPostgres();

// Start the server
server.listen(CONFIG.PORT, () => {
    console.log(`Server is up and running on port ${CONFIG.PORT}`);
});
