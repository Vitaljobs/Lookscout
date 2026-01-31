'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { SecurityEvent, BlockedIP } from '@/types/support';
import { ShieldAlert, AlertTriangle, Ban, CheckCircle, Loader2 } from 'lucide-react';

export default function SecurityWidget() {
    const [events, setEvents] = useState<SecurityEvent[]>([]);
    const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        loadSecurityData();

        // Subscribe to real-time updates
        const eventsChannel = supabase
            .channel('security-events')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'security_events',
                },
                () => {
                    loadSecurityData();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(eventsChannel);
        };
    }, []);

    const loadSecurityData = async () => {
        try {
            // Load recent security events
            const { data: eventsData, error: eventsError } = await supabase
                .from('security_events')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            if (eventsError) throw eventsError;

            // Load blocked IPs
            const { data: blockedData, error: blockedError } = await supabase
                .from('blocked_ips')
                .select('*')
                .order('blocked_at', { ascending: false });

            if (blockedError) throw blockedError;

            setEvents(eventsData || []);
            setBlockedIPs(blockedData || []);
        } catch (error) {
            console.error('Error loading security data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getSeverityColor = (severity: string) => {
        const colors: Record<string, string> = {
            low: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
            medium: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
            high: 'text-red-400 bg-red-500/10 border-red-500/30',
            critical: 'text-red-500 bg-red-500/20 border-red-500/50 animate-pulse',
        };
        return colors[severity] || colors.low;
    };

    const getSeverityIcon = (severity: string) => {
        if (severity === 'critical' || severity === 'high') {
            return <AlertTriangle className="w-4 h-4" />;
        }
        return <ShieldAlert className="w-4 h-4" />;
    };

    const criticalCount = events.filter(e => e.severity === 'critical' || e.severity === 'high').length;

    return (
        <div className="card border-red-500/20 bg-gradient-to-b from-[var(--element-bg)] to-red-950/10 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-red-600 rounded-full blur-[60px] opacity-20" />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
                        <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider">Security Watch</h3>
                    </div>
                    {criticalCount > 0 && (
                        <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/30 animate-pulse">
                            {criticalCount} critical
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-red-400" />
                    </div>
                ) : (
                    <>
                        {/* Blocked IPs */}
                        <div className="mb-4">
                            <div className="text-xs text-gray-400 mb-2 flex items-center gap-2">
                                <Ban className="w-3 h-3" />
                                Blocked IPs ({blockedIPs.length})
                            </div>
                            {blockedIPs.length === 0 ? (
                                <div className="text-xs text-gray-500 p-2 bg-black/20 rounded border border-white/5">
                                    <CheckCircle className="w-4 h-4 inline mr-1 text-green-500" />
                                    No blocked IPs
                                </div>
                            ) : (
                                <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
                                    {blockedIPs.slice(0, 5).map((ip) => (
                                        <div
                                            key={ip.id}
                                            className="text-xs p-2 bg-red-500/5 rounded border border-red-500/20 flex items-center justify-between"
                                        >
                                            <span className="font-mono text-red-400">{ip.ip_address}</span>
                                            <span className="text-gray-500 text-[10px]">{ip.reason}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Recent Events */}
                        <div>
                            <div className="text-xs text-gray-400 mb-2">Recent Events</div>
                            {events.length === 0 ? (
                                <div className="text-xs text-gray-500 p-2 bg-black/20 rounded border border-white/5 text-center">
                                    No security events
                                </div>
                            ) : (
                                <div className="space-y-1 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
                                    {events.map((event) => (
                                        <div
                                            key={event.id}
                                            className={`text-xs p-2 rounded border flex items-start gap-2 ${getSeverityColor(event.severity)}`}
                                        >
                                            {getSeverityIcon(event.severity)}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium">{event.event_type}</div>
                                                {event.reason && (
                                                    <div className="text-[10px] opacity-80 truncate">{event.reason}</div>
                                                )}
                                                {event.ip_address && (
                                                    <div className="text-[10px] font-mono opacity-60">{event.ip_address}</div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Status footer */}
                        <div className="mt-4 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-red-300">Status</span>
                                <span className="font-bold text-red-400">MONITORING</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
