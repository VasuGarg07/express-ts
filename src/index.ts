import { createApplication } from './app';
import CONFIG from './config/config';
import connectDb from './config/db';
import { createServerWithSocket } from './server';

const app = createApplication(CONFIG.FRONTEND_URL);
const { server } = createServerWithSocket(app);

// Connect to MongoDb
connectDb();

// Start the server
server.listen(CONFIG.PORT, () => {
    console.log(`Server is running on port ${CONFIG.PORT}`);
});
