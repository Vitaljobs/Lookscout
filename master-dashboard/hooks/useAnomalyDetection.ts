import { useState, useEffect } from 'react';
import { StatCardData } from '@/types';
import { SecurityEvent } from '@/types/support';

export type AlertLevel = 'normal' | 'warning' | 'critical';

interface AnomalyStatus {
    level: AlertLevel;
    message: string | null;
    metric: string | null;
}

export function useAnomalyDetection(stats: StatCardData[], events: SecurityEvent[]) {
    const [status, setStatus] = useState<AnomalyStatus>({ level: 'normal', message: null, metric: null });

    useEffect(() => {
        analyzeMetrics();
    }, [stats, events]);

    const analyzeMetrics = () => {
        let newLevel: AlertLevel = 'normal';
        let newMessage: string | null = null;
        let newMetric: string | null = null;

        // 1. Security Analysis (Critical Priority)
        const recentCriticalEvents = events.filter(e =>
            (e.severity === 'critical' || e.severity === 'high') &&
            new Date(e.created_at).getTime() > Date.now() - 5 * 60 * 1000 // Last 5 mins
        );

        if (recentCriticalEvents.length > 2) {
            newLevel = 'critical';
            newMessage = `Security Surge: ${recentCriticalEvents.length} critical events detected in 5m`;
            newMetric = 'security';
        }

        // 2. Traffic Analysis (If no critical security threat)
        if (newLevel !== 'critical') {
            const liveUsersStat = stats.find(s => s.title === 'Live Visitors');
            const liveUsers = typeof liveUsersStat?.value === 'number' ? liveUsersStat.value : 0;

            // Mock Baseline Logic (In production, fetch historical average)
            const baseline = 1500; // Example baseline

            if (liveUsers > baseline * 1.5) {
                newLevel = 'warning'; // Positive anomaly (Viral traffic?)
                newMessage = `High Traffic: ${Math.floor((liveUsers / baseline) * 100)}% above baseline`;
                newMetric = 'traffic_spike';
            } else if (liveUsers < baseline * 0.2 && liveUsers > 0) {
                newLevel = 'warning'; // Negative anomaly (Outage?)
                newMessage = `Traffic Drop: Systems reporting unusually low activity`;
                newMetric = 'traffic_drop';
            }
        }

        setStatus({ level: newLevel, message: newMessage, metric: newMetric });
    };

    return status;
}
