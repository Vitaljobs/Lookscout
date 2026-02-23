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
        // If it's a very short string, it's probably not encrypted ciphertext
        if (ciphertext.length < 10) return ciphertext;

        const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);

        // If decryption fails to produce valid Utf8, return original ciphertext
        if (!originalText) return ciphertext;

        return originalText;
    } catch (error) {
        console.warn('Decryption failed, returning ciphertext:', error);
        return ciphertext;
    }
};
