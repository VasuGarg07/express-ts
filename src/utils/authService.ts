import CONFIG from '../config/config';

let publicKey: string;

export const loadPublicKey = async (retries = 5, delayMs = 5000) => {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(`${CONFIG.AUTH_SERVER_URL}/auth/public-key`);
            if (!res.ok) throw new Error(`Status ${res.status}`);
            const data = await res.json() as { publicKey: string };
            publicKey = data.publicKey;
            console.log('Public key loaded');
            return;
        } catch (err) {
            console.log(`Public key fetch failed (attempt ${i + 1}/${retries}), retrying in ${delayMs}ms...`);
            if (i === retries - 1) throw err;
            await new Promise(r => setTimeout(r, delayMs));
        }
    }
};

export const getPublicKey = () => {
    if (!publicKey) throw new Error('Public key not loaded');
    return publicKey;
};