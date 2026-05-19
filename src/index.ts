import { createApplication } from './app';
import CONFIG from './config/config';
import connectDb from './config/db';
import { createServerWithSocket } from './server';
import { loadPublicKey } from './utils/authService';

const main = async () => {
    await loadPublicKey();
    connectDb();

    const app = createApplication(CONFIG.FRONTEND_URL);
    const { server } = createServerWithSocket(app);

    server.listen(CONFIG.PORT, () => {
        console.log(`Server is running on port ${CONFIG.PORT}`);
    });
};

main().catch((err) => {
    console.error('Startup failed:', err);
    process.exit(1);
});