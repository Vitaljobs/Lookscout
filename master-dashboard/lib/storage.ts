'use client';

import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = 'master-dashboard-secret-key-2026';
const STORAGE_PREFIX = 'md_';

export class SecureStorage {
    private static encrypt(data: string): string {
        return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
    }

    private static decrypt(encryptedData: string): string {
        const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
        return bytes.toString(CryptoJS.enc.Utf8);
    }

    static setItem(key: string, value: any): void {
        try {
            const jsonValue = JSON.stringify(value);
            const encrypted = this.encrypt(jsonValue);
            localStorage.setItem(STORAGE_PREFIX + key, encrypted);
        } catch (error) {
            console.error('Error saving to secure storage:', error);
        }
    }

    static getItem<T>(key: string): T | null {
        try {
            const encrypted = localStorage.getItem(STORAGE_PREFIX + key);
            if (!encrypted) return null;

            const decrypted = this.decrypt(encrypted);
            return JSON.parse(decrypted) as T;
        } catch (error) {
            console.error('Error reading from secure storage:', error);
            return null;
        }
    }

    static removeItem(key: string): void {
        localStorage.removeItem(STORAGE_PREFIX + key);
    }

    static clear(): void {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(STORAGE_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
    }
}

// API Key management
export const saveApiKey = (projectId: string, apiKey: string): void => {
    SecureStorage.setItem(`api_key_${projectId}`, apiKey);
};

export const getApiKey = (projectId: string): string | null => {
    return SecureStorage.getItem<string>(`api_key_${projectId}`);
};

export const removeApiKey = (projectId: string): void => {
    SecureStorage.removeItem(`api_key_${projectId}`);
};
