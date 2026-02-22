import CryptoJS from 'crypto-js';

// Server-side encryption key. 
// FALLBACK is NOT recommended for production. 
// Ensure CONNECTIONS_ENCRYPTION_KEY is set in your environment variables.
const SECRET_KEY = process.env.CONNECTIONS_ENCRYPTION_KEY || 'titan-tower-secure-vault-2026-x99';

/**
 * Encrypts a string using AES encryption.
 * @param text The plain text to encrypt
 * @returns The encrypted string
 */
export const encrypt = (text: string): string => {
    try {
        return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt data');
    }
};

/**
 * Decrypts an AES encrypted string.
 * @param ciphertext The encrypted text to decrypt
 * @returns The decrypted plain text
 */
export const decrypt = (ciphertext: string): string => {
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        if (!originalText) throw new Error('Decryption resulted in empty string');
        return originalText;
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt data');
    }
};
