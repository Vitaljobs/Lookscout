import { CommonGroundStats, LiveUser } from '@/types';
import { getApiKey } from '../storage';

// Mock data for development
const MOCK_STATS: CommonGroundStats = {
    total_users: 12847,
    active_now: 234,
    page_views_24h: 45621,
    popular_lab: 'Mindfulness Lab'
};

const MOCK_LIVE_USERS: LiveUser[] = [
    {
        id: '1',
        name: 'Kelly Casper',
        email: 'kelly@example.com',
        activity: 'Viewing Mindfulness Lab',
        location: 'Amsterdam',
        status: 'online',
        lastSeen: new Date()
    },
    {
        id: '2',
        name: 'Jerald Braun',
        email: 'jerald@example.com',
        activity: 'Completing Check-in',
        location: 'Rotterdam',
        status: 'online',
        lastSeen: new Date()
    },
    {
        id: '3',
        name: 'Rita Pollich',
        email: 'rita@example.com',
        activity: 'Browsing Help Wall',
        location: 'Utrecht',
        status: 'online',
        lastSeen: new Date()
    },
    {
        id: '4',
        name: 'Preston Schneider',
        email: 'preston@example.com',
        activity: 'Reading Articles',
        location: 'Den Haag',
        status: 'idle',
        lastSeen: new Date(Date.now() - 5 * 60000)
    },
    {
        id: '5',
        name: 'Caleb Skiles',
        email: 'caleb@example.com',
        activity: 'Profile Settings',
        location: 'Eindhoven',
        status: 'online',
        lastSeen: new Date()
    }
];

export class PulseAPI {
    private projectId: string;

    constructor(projectId: string) {
        this.projectId = projectId;
    }

    private get apiKey(): string | null {
        if (typeof window === 'undefined') return this.getEnvKey() || null;
        return getApiKey(this.projectId) || this.getEnvKey() || null;
    }

    private getEnvKey(): string | undefined {
        switch (this.projectId) {
            case 'commonground': return process.env.NEXT_PUBLIC_PULSE_API_KEY;
            case 'vibechain': return process.env.NEXT_PUBLIC_VIBECHAIN_API_KEY;
            case 'vitaljobs': return process.env.NEXT_PUBLIC_VITALJOBS_API_KEY;
            default: return process.env.NEXT_PUBLIC_PULSE_API_KEY;
        }
    }

    private get baseUrl(): string {
        // Use local proxy when running in browser on localhost to avoid CORS
        if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
            return '/api/proxy';
        }

        let url = this.getEnvUrl() || 'https://api.commonground.example';
        if (url.endsWith('/stats')) {
            url = url.substring(0, url.lastIndexOf('/stats'));
        }
        return url;
    }

    private getEnvUrl(): string | undefined {
        switch (this.projectId) {
            case 'commonground': return process.env.NEXT_PUBLIC_PULSE_API_URL;
            case 'vibechain': return process.env.NEXT_PUBLIC_VIBECHAIN_API_URL;
            case 'vitaljobs': return process.env.NEXT_PUBLIC_VITALJOBS_API_URL;
            default: return process.env.NEXT_PUBLIC_PULSE_API_URL;
        }
    }

    private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...options.headers as Record<string, string>,
        };

        if (this.apiKey) {
            if (this.apiKey.startsWith('sb_')) {
                headers['apikey'] = this.apiKey;
                headers['Authorization'] = `Bearer ${this.apiKey}`;
            } else {
                headers['x-api-key'] = this.apiKey;
            }
        }

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers,
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    async getStats(): Promise<{ data: CommonGroundStats; isLive: boolean; error?: string }> {
        try {
            if (this.apiKey && this.baseUrl !== 'https://api.commonground.example') {
                const data = await this.fetchWithAuth('/stats');
                return { data, isLive: true };
            }
        } catch (error) {
            console.warn('Falling back to mock stats due to error:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            return { data: MOCK_STATS, isLive: false, error: errorMessage };
        }
        return { data: MOCK_STATS, isLive: false };
    }

    async getLiveUsers(): Promise<{ data: LiveUser[]; isLive: boolean }> {
        try {
            if (this.apiKey && this.baseUrl !== 'https://api.commonground.example') {
                // Assuming /live-users endpoint exists, otherwise fallback
                const data = await this.fetchWithAuth('/live-users');
                return { data, isLive: true };
            }
        } catch (error) {
            console.warn('Falling back to mock live users:', error);
        }
        return { data: MOCK_LIVE_USERS, isLive: false };
    }

    async getPopularLabs(): Promise<string[]> {
        try {
            if (this.apiKey && this.baseUrl !== 'https://api.commonground.example') {
                return await this.fetchWithAuth('/popular-labs');
            }
        } catch (error) {
            console.warn('Falling back to mock popular labs:', error);
        }
        return ['Mindfulness Lab', 'Stress Relief', 'Sleep Better'];
    }

    getDebugInfo() {
        return {
            hasKey: !!this.apiKey,
            keyStart: this.apiKey ? this.apiKey.substring(0, 4) + '...' : 'None',
            baseUrl: this.baseUrl,
            isDefaultUrl: this.baseUrl === 'https://api.commonground.example',
            projectId: this.projectId
        };
    }
}
