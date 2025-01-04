import CryptoJS from "crypto-js";

// Secret Key (ensure this is securely stored in .env)
const secretKey = process.env.ENCRYPTION_KEY!;

// Encrypt Function
export const encryptString = (text: string): string => {
    return CryptoJS.AES.encrypt(text, secretKey).toString();
};

// Decrypt Function
export const decryptString = (encryptedText: string): string => {
    const bytes = CryptoJS.AES.decrypt(encryptedText, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
};
