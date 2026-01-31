'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { SecurityEvent } from '@/types/support';
import { Globe, AlertTriangle, Shield } from 'lucide-react';

interface AttackLocation {
    lat: number;
    lng: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    eventType: string;
    timestamp: string;
}

// IP to geolocation mapping (simplified - in production use IP geolocation API)
const getLocationFromIP = (ip: string): { lat: number; lng: number } => {
    // Hash IP to generate consistent but pseudo-random coordinates
    const hash = ip.split('.').reduce((acc, num) => acc + parseInt(num || '0'), 0);
    const lat = ((hash % 180) - 90) + (Math.random() * 10 - 5);
    const lng = ((hash % 360) - 180) + (Math.random() * 10 - 5);
    return { lat, lng };
};

export default function AttackOriginMap() {
    const [attacks, setAttacks] = useState<AttackLocation[]>([]);
    const [stats, setStats] = useState({ total: 0, critical: 0, blocked: 0 });
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const supabase = createClient();

    useEffect(() => {
        loadAttackData();

        // Subscribe to real-time security events
        const channel = supabase
            .channel('attack-map')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'security_events',
                },
                (payload) => {
                    const event = payload.new as SecurityEvent;
                    if (event.ip_address && event.severity !== 'low') {
                        const location = getLocationFromIP(event.ip_address);
                        setAttacks((prev) => [
                            ...prev,
                            {
                                ...location,
                                severity: event.severity,
                                eventType: event.event_type,
                                timestamp: event.created_at,
                            },
                        ]);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    useEffect(() => {
        if (canvasRef.current && attacks.length > 0) {
            drawMap();
        }
    }, [attacks]);

    const loadAttackData = async () => {
        try {
            const { data: events, error } = await supabase
                .from('security_events')
                .select('*')
                .in('severity', ['medium', 'high', 'critical'])
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;

            const attackLocations: AttackLocation[] = (events || [])
                .filter((e) => e.ip_address)
                .map((event) => ({
                    ...getLocationFromIP(event.ip_address!),
                    severity: event.severity,
                    eventType: event.event_type,
                    timestamp: event.created_at,
                }));

            setAttacks(attackLocations);

            // Calculate stats
            const total = events?.length || 0;
            const critical = events?.filter((e) => e.severity === 'critical').length || 0;
            const blocked = events?.filter((e) => e.event_type.includes('block')).length || 0;

            setStats({ total, critical, blocked });
        } catch (error) {
            console.error('Error loading attack data:', error);
        }
    };

    const drawMap = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.fillStyle = '#0a0f1a';
        ctx.fillRect(0, 0, width, height);

        // Draw world map grid
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;

        // Latitude lines
        for (let i = 0; i <= 6; i++) {
            const y = (height / 6) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Longitude lines
        for (let i = 0; i <= 12; i++) {
            const x = (width / 12) * i;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // Draw attacks
        const now = Date.now();
        attacks.forEach((attack) => {
            const x = ((attack.lng + 180) / 360) * width;
            const y = ((90 - attack.lat) / 180) * height;

            // Age-based opacity
            const age = now - new Date(attack.timestamp).getTime();
            const maxAge = 3600000; // 1 hour
            const opacity = Math.max(0.2, 1 - age / maxAge);

            // Severity-based color and size
            let color = '#ef4444';
            let size = 4;

            switch (attack.severity) {
                case 'critical':
                    color = '#dc2626';
                    size = 8;
                    break;
                case 'high':
                    color = '#ef4444';
                    size = 6;
                    break;
                case 'medium':
                    color = '#f97316';
                    size = 4;
                    break;
            }

            // Pulsing effect for recent attacks
            if (age < 10000) {
                const pulse = Math.sin((age / 1000) * Math.PI * 2) * 0.3 + 0.7;
                size *= pulse;
            }

            // Draw glow
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
            gradient.addColorStop(0, `${color}${Math.floor(opacity * 0.8 * 255).toString(16).padStart(2, '0')}`);
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.fillRect(x - size * 3, y - size * 3, size * 6, size * 6);

            // Draw point
            ctx.fillStyle = `${color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        });
    };

    return (
        <div className="card relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute -left-10 -top-10 w-40 h-40 bg-red-600 rounded-full blur-[80px] opacity-20" />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-red-500" />
                        <h3 className="text-lg font-semibold text-white">Attack Origin Map</h3>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                            <span className="text-gray-400">Medium</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            <span className="text-gray-400">High</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
                            <span className="text-gray-400">Critical</span>
                        </div>
                    </div>
                </div>

                {/* Map Canvas */}
                <div className="relative bg-[#0a0f1a] rounded-lg border border-red-500/20 overflow-hidden">
                    <canvas
                        ref={canvasRef}
                        width={800}
                        height={400}
                        className="w-full h-[400px]"
                    />

                    {/* Overlay stats */}
                    <div className="absolute top-4 left-4 space-y-2">
                        <div className="backdrop-blur-md bg-black/50 px-3 py-2 rounded-lg border border-red-500/30">
                            <div className="text-xs text-gray-400">Total Threats</div>
                            <div className="text-2xl font-bold text-red-400">{stats.total}</div>
                        </div>
                    </div>

                    <div className="absolute top-4 right-4 space-y-2">
                        <div className="backdrop-blur-md bg-black/50 px-3 py-2 rounded-lg border border-red-500/30">
                            <div className="text-xs text-gray-400">Critical</div>
                            <div className="text-xl font-bold text-red-500">{stats.critical}</div>
                        </div>
                        <div className="backdrop-blur-md bg-black/50 px-3 py-2 rounded-lg border border-green-500/30">
                            <div className="text-xs text-gray-400">Blocked</div>
                            <div className="text-xl font-bold text-green-400">{stats.blocked}</div>
                        </div>
                    </div>
                </div>

                {/* Live feed */}
                <div className="mt-4 p-3 bg-black/20 rounded-lg border border-red-500/20">
                    <div className="flex items-center gap-2 text-xs text-red-400">
                        <Shield className="w-4 h-4 animate-pulse" />
                        <span>Live Threat Monitoring Active</span>
                        <span className="ml-auto text-gray-500">
                            {attacks.length} threats detected in last hour
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
