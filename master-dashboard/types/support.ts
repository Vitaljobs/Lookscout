export interface ContactMessage {
    id: string;
    project_id: string;  // UUID foreign key to projects table
    project_source: string;  // Legacy slug field
    name: string;
    email: string;
    subject: string;
    message: string;
    status: 'new' | 'replied' | 'archived';
    sentiment?: 'positive' | 'neutral' | 'negative';
    metadata?: Record<string, any>;
    created_at: string;
    replied_at?: string;
    reply_message?: string;
    replied_by?: string;
}

export interface SecurityEvent {
    id: string;
    event_type: string;
    ip_address?: string;
    user_agent?: string;
    reason?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    project_source?: string;
    metadata?: Record<string, any>;
    created_at: string;
    resolved_at?: string;
    resolved_by?: string;
}

export interface BlockedIP {
    id: string;
    ip_address: string;
    reason: string;
    blocked_at: string;
    blocked_until?: string;
    blocked_by?: string;
    is_permanent: boolean;
}

export interface ReputationDataPoint {
    timestamp: Date;
    score: number;
    change: number;
    reason?: string;
}

export interface EchoScoreData {
    score: number;
    level: number;
    missions_completed: number;
    contributions: number;
    trend: ReputationDataPoint[];
}
