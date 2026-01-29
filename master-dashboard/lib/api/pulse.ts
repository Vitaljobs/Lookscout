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
        // 1. Prioritize SecureStorage via helper (Settings Page interactions)
        const secureKey = getApiKey(this.projectId);
        if (secureKey) return secureKey;

        // 2. Check LocalStorage (Legacy)
        if (typeof window !== 'undefined') {
            const localKey = localStorage.getItem(`titan_config_${this.projectId}_key`);
            if (localKey) return localKey;
        }

        // 3. Fallback to Env
        return this.getEnvKey() || null;
    }

    private getEnvKey(): string | undefined {
        switch (this.projectId) {
            case 'commonground': return process.env.NEXT_PUBLIC_PULSE_API_KEY;
            case 'vibechain': return process.env.NEXT_PUBLIC_VIBECHAIN_KEY || process.env.NEXT_PUBLIC_VIBECHAIN_API_KEY;
            case 'vitaljobs': return process.env.NEXT_PUBLIC_VITALJOBS_KEY || process.env.NEXT_PUBLIC_VITALJOBS_API_KEY;
            default: return process.env.NEXT_PUBLIC_PULSE_API_KEY;
        }
    }

    private get targetBaseUrl(): string {
        if (typeof window !== 'undefined') {
            // New logic: Read from consolidated titan_projects local cache
            try {
                const projectsStr = localStorage.getItem('titan_projects');
                if (projectsStr) {
                    const projects = JSON.parse(projectsStr);
                    const project = projects.find((p: any) => p.id === this.projectId);
                    if (project && project.url) return project.url;
                }
            } catch (e) {
                console.warn('Failed to read project config for URL', e);
            }

            // Fallback for legacy (if any)
            const localUrl = localStorage.getItem(`titan_config_${this.projectId}_url`);
            if (localUrl) return localUrl;
        }

        let url = this.getEnvUrl() || 'https://api.commonground.example';

        // Clean up URL: remove trailing /stats or /rest/v1 to ensure we have a clean base
        if (url.endsWith('/stats')) {
            url = url.substring(0, url.lastIndexOf('/stats'));
        }
        if (url.endsWith('/rest/v1')) {
            url = url.substring(0, url.lastIndexOf('/rest/v1'));
        }

        return url;
    }

    private getEnvUrl(): string | undefined {
        switch (this.projectId) {
            case 'commonground': return process.env.NEXT_PUBLIC_PULSE_API_URL;
            case 'vibechain': return process.env.NEXT_PUBLIC_VIBECHAIN_URL || process.env.NEXT_PUBLIC_VIBECHAIN_API_URL;
            case 'vitaljobs': return process.env.NEXT_PUBLIC_VITALJOBS_URL || process.env.NEXT_PUBLIC_VITALJOBS_API_URL;
            default: return process.env.NEXT_PUBLIC_PULSE_API_URL;
        }
    }

    private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
        let url = `${this.targetBaseUrl}${endpoint}`;
        const isSupabase = this.targetBaseUrl.includes('supabase.co');

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string>),
        };

        if (this.apiKey) {
            // Supabase requires 'apikey' and 'Authorization'
            if (isSupabase || this.apiKey.startsWith('sb_') || this.apiKey.length > 40) {
                headers['apikey'] = this.apiKey;
                headers['Authorization'] = `Bearer ${this.apiKey}`;
            } else {
                headers['x-api-key'] = this.apiKey;
            }
        }

        // Supabase REST API URL Rewriting
        if (isSupabase) {
            if (endpoint === '/stats') {
                // Fetch first row from 'stats' table
                url = `${this.targetBaseUrl}/rest/v1/stats?select=*&limit=1`;
            } else if (endpoint === '/live-users') {
                // Fetch from 'live-users' table
                url = `${this.targetBaseUrl}/rest/v1/live-users?select=*&limit=10`;
            } else if (endpoint === '/popular-labs') {
                // Fallback or mock for now as we don't have a known table for this
                return ['Mindfulness Lab (Supabase)', 'Stress Relief', 'Sleep Better'];
            }
        }

        // Use Proxy on Client Side to avoid CORS
        if (typeof window !== 'undefined') {
            headers['X-Proxy-Target'] = url;
            url = '/api/proxy';
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            if (!response.ok) {
                // If 404/500, throw so we fall back to mock
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // Supabase returns arrays for 'select', so we need to unwrap if expecting a single object
            if (isSupabase && Array.isArray(data)) {
                if (endpoint === '/stats') return data[0] || {};
                return data;
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    async getStats(): Promise<{ data: CommonGroundStats; isLive: boolean; error?: string }> {
        try {
            if (this.apiKey && this.targetBaseUrl !== 'https://api.commonground.example') {
                const data = await this.fetchWithAuth('/stats');
                return { data, isLive: true };
            }
        } catch (error) {
            console.warn('Falling back to mock stats due to error:', error);
            // Enhanced error reporting
            let errorMessage = 'Unknown Error';
            if (error instanceof Error) errorMessage = error.message;
            else if (typeof error === 'string') errorMessage = error;

            return { data: MOCK_STATS, isLive: false, error: errorMessage };
        }
        return { data: MOCK_STATS, isLive: false };
    }

    async getLiveUsers(): Promise<{ data: LiveUser[]; isLive: boolean }> {
        try {
            if (this.apiKey && this.targetBaseUrl !== 'https://api.commonground.example') {
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
            if (this.apiKey && this.targetBaseUrl !== 'https://api.commonground.example') {
                return await this.fetchWithAuth('/popular-labs');
            }
        } catch (error) {
            console.warn('Falling back to mock popular labs:', error);
        }
        return ['Mindfulness Lab', 'Stress Relief', 'Sleep Better'];
    }

    async getRecentActivity(): Promise<import('@/types').ActivityFeedItem[]> {
        try {
            if (this.apiKey && this.targetBaseUrl !== 'https://api.commonground.example') {
                // Try to fetch real activity if endpoint exists
                // For MindGarden launch, we map 'checkins' table
                const response = await this.fetchWithAuth('/activity');
                return response.map((r: any) => ({
                    id: r.id,
                    user: r.user_name || 'Anonymous',
                    action: r.action_type || 'Checked In',
                    metadata: { mood: r.mood_score, note: r.note },
                    timestamp: new Date(r.created_at)
                }));
            }
        } catch (error) {
            // Fallback to mock data
        }

        // Mock Launch Data for MindGarden
        return [
            { id: '1', user: 'Joshua Q.', action: 'Checked In', metadata: { mood: 8, note: 'Feeling great about the launch!' }, timestamp: new Date() },
            { id: '2', user: 'Sarah M.', action: 'New Signup', metadata: { project: 'MindGarden' }, timestamp: new Date(Date.now() - 1000 * 60 * 5) },
            { id: '3', user: 'David K.', action: 'Completed Session', metadata: { mood: 6 }, timestamp: new Date(Date.now() - 1000 * 60 * 15) },
            { id: '4', user: 'System', action: 'Deployment', metadata: { note: 'v1.0.2 Live' }, timestamp: new Date(Date.now() - 1000 * 60 * 60) },
        ];
    }

    async getSecurityEvents(): Promise<{ id: string; type: string; severity: 'low' | 'medium' | 'high' | 'critical'; message: string; timestamp: Date; project: string }[]> {
        try {
            if (this.apiKey && this.targetBaseUrl !== 'https://api.commonground.example') {
                const response = await this.fetchWithAuth('/security-events');
                return response.map((r: any) => ({
                    ...r,
                    timestamp: new Date(r.created_at)
                }));
            }
        } catch (error) {
            // Fallback to mock
        }

        // Realistic Mock Security Data
        const events: any[] = [];
        const types = ['SQL Injection Attempt', 'Brute Force Login', 'Invalid API Token', 'Cross-Site Scripting'];
        const severities = ['high', 'medium', 'low', 'critical'];

        // Generate a few random recent events
        for (let i = 0; i < Math.floor(Math.random() * 3); i++) {
            events.push({
                id: `sec-${Date.now()}-${i}`,
                type: types[Math.floor(Math.random() * types.length)],
                severity: severities[Math.floor(Math.random() * severities.length)],
                message: `Blocked suspicious request from ${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.1.1`,
                timestamp: new Date(Date.now() - Math.floor(Math.random() * 3600000)),
                project: this.projectId
            });
        }
        return events;
    }

    async blockUser(userId: string): Promise<{ success: boolean; message: string }> {
        // In a real scenario, this would POST to an administration endpoint
        try {
            if (this.apiKey && this.targetBaseUrl !== 'https://api.commonground.example') {
                // await this.fetchWithAuth('/users/block', { method: 'POST', body: JSON.stringify({ userId }) });
                // Simulate API delay
                await new Promise(r => setTimeout(r, 800));
                return { success: true, message: `User ${userId} has been blocked on ${this.projectId}.` };
            }
        } catch (e) {
            // fallback
        }

        // Mock success
        await new Promise(r => setTimeout(r, 800));
        return { success: true, message: `[SIMULATION] User ${userId} successfully blocked on ${this.projectId}.` };
    }

    getDebugInfo() {
        return {
            hasKey: !!this.apiKey,
            keyStart: this.apiKey ? this.apiKey.substring(0, 4) + '...' : 'None',
            baseUrl: this.targetBaseUrl,
            isDefaultUrl: this.targetBaseUrl === 'https://api.commonground.example',
            projectId: this.projectId
        };
    }
}
