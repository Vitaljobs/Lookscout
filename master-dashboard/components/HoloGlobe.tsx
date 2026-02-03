'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useProjects } from '@/context/ProjectContext';
import { GlobeMethods } from 'react-globe.gl';

// Dynamically import Globe to avoid SSR issues with WebGL
const Globe = dynamic(() => import('react-globe.gl'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-[400px] bg-black/20 text-blue-400">
            <div className="animate-pulse">Initializing Holo-Core...</div>
        </div>
    )
});

interface ArcData {
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
    color: string[];
    name: string;
    project: string;
}

interface PointData {
    lat: number;
    lng: number;
    size: number;
    color: string;
    name: string;
    project: string;
    type: 'visitor' | 'security';
}

export type AlertLevel = 'normal' | 'warning' | 'critical';

interface HoloGlobeProps {
    alertLevel?: AlertLevel;
    alertMessage?: string | null;
    projectId?: string;
}

export default function HoloGlobe({ alertLevel = 'normal', alertMessage, projectId }: HoloGlobeProps) {
    const globeEl = useRef<GlobeMethods | undefined>(undefined);
    const { selectedProjectId: contextProjectId } = useProjects();
    const selectedProjectId = projectId || contextProjectId;
    const [mounted, setMounted] = useState(false);

    // Decorative Visualization (Real geo-tracking requires IP logging - privacy sensitive)
    const { arcsData, pointsData } = useMemo(() => {
        const arcs: ArcData[] = [];
        const points: PointData[] = [];

        // Locations
        const serverLoc = { lat: 52.3676, lng: 4.9041 }; // Amsterdam (Server)
        const locations = [
            { lat: 40.7128, lng: -74.0060, name: 'New York', project: 'vitaljobs' },
            { lat: 35.6762, lng: 139.6503, name: 'Tokyo', project: 'commonground' },
            { lat: 51.5074, lng: -0.1278, name: 'London', project: 'lookscout' },
            { lat: -33.8688, lng: 151.2093, name: 'Sydney', project: 'echo-chamber' },
            { lat: 19.0760, lng: 72.8777, name: 'Mumbai', project: 'commonground' },
            { lat: 37.7749, lng: -122.4194, name: 'San Francisco', project: 'vitaljobs' },
            { lat: 55.7558, lng: 37.6173, name: 'Moscow', project: 'security_threat' }, // Security Event
            { lat: -23.5505, lng: -46.6333, name: 'Sao Paulo', project: 'lookscout' }
        ];

        // Generate Traffic
        locations.forEach(loc => {
            if (loc.project === 'security_threat') return; // Don't draw normal arcs for threats

            // Traffic Arcs
            arcs.push({
                startLat: loc.lat,
                startLng: loc.lng,
                endLat: serverLoc.lat,
                endLng: serverLoc.lng,
                color: getProjectColors(loc.project),
                name: `${loc.name} -> AMS`,
                project: loc.project
            });

            // Activity Points
            points.push({
                lat: loc.lat,
                lng: loc.lng,
                size: 0.5,
                color: getProjectColorHex(loc.project),
                name: `${loc.name} Activity`,
                project: loc.project,
                type: 'visitor'
            });
        });

        // Security Threats (Red Arcs/Points)
        const threats = locations.filter(l => l.project === 'security_threat');
        threats.forEach(t => {
            points.push({
                lat: t.lat,
                lng: t.lng,
                size: 1.2,
                color: '#ef4444',
                name: `THREAT DETECTED: ${t.name}`,
                project: 'all', // Show on all or filter? Let's show on all for now, or filter if we map threats to projects
                type: 'security'
            });

            // Attack Arc
            arcs.push({
                startLat: t.lat,
                startLng: t.lng,
                endLat: serverLoc.lat,
                endLng: serverLoc.lng,
                color: ['#ef4444', '#7f1d1d'],
                name: `ATTACK: ${t.name}`,
                project: 'security' // Special category
            });
        });

        return { arcsData: arcs, pointsData: points };
    }, []);

    const filteredArcs = useMemo(() => {
        if (!selectedProjectId) return arcsData;
        return arcsData.filter(d => d.project === selectedProjectId || d.project === 'security');
    }, [selectedProjectId, arcsData]);

    const filteredPoints = useMemo(() => {
        if (!selectedProjectId) return pointsData;
        // Security events usually global relevance, but we can filter if needed. 
        // Let's keep security events always visible as "Critical Alerts" unless we strictly want project isolation.
        // Per v2.5.1 specs, SecurityWidget filters. So visually we should probably filter too, 
        // OR keep them because they are cool. Let's filter to be consistent with "Context".
        return pointsData.filter(d => d.project === selectedProjectId || (d.type === 'security' && selectedProjectId === 'commonground')); // Using commonground as 'primary' for threats? Or just hide? 
        // Let's just filter STRICTLY by project ID for visitors. For security, we assign them random projects in real app. 
        // For now, let's just show matching project points.

    }, [selectedProjectId, pointsData]);


    useEffect(() => {
        setMounted(true);
        // Auto-rotation
        if (globeEl.current) {
            globeEl.current.controls().autoRotate = true;
            globeEl.current.controls().autoRotateSpeed = 0.5;
        }
    }, []);

    const atmosphereColor = useMemo(() => {
        switch (alertLevel) {
            case 'critical': return '#ef4444'; // Red
            case 'warning': return '#f59e0b'; // Orange
            default: return '#3b82f6'; // Blue
        }
    }, [alertLevel]);

    const glowColor = useMemo(() => {
        switch (alertLevel) {
            case 'critical': return 'bg-red-500';
            case 'warning': return 'bg-orange-500';
            default: return 'bg-blue-500';
        }
    }, [alertLevel]);

    // Helper for colors
    function getProjectColors(projectId: string): string[] {
        switch (projectId) {
            case 'commonground': return ['#10b981', '#064e3b']; // Green
            case 'vitaljobs': return ['#3b82f6', '#1e3a8a']; // Blue
            case 'echo-chamber': return ['#8b5cf6', '#4c1d95']; // Purple
            case 'lookscout': return ['#f59e0b', '#78350f']; // Orange
            default: return ['#ffffff', '#888888'];
        }
    }

    function getProjectColorHex(projectId: string): string {
        switch (projectId) {
            case 'commonground': return '#10b981';
            case 'vitaljobs': return '#3b82f6';
            case 'echo-chamber': return '#8b5cf6';
            case 'lookscout': return '#f59e0b';
            default: return '#ffffff';
        }
    }

    if (!mounted) return null;

    return (
        <div className={`card relative overflow-hidden h-96 md:h-[500px] w-full bg-black/40 transition-colors duration-1000 ${alertLevel === 'critical' ? 'border-red-500/40 shadow-[0_0_50px_rgba(220,38,38,0.2)]' :
            alertLevel === 'warning' ? 'border-orange-500/40' :
                'border-blue-500/20'
            }`}>
            {/* Header Overlay */}
            <div className="absolute top-4 left-6 z-10 pointer-events-none">
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full animate-ping ${glowColor}`} />
                    <h3 className={`text-sm font-bold tracking-widest uppercase ${alertLevel === 'critical' ? 'text-red-400' :
                        alertLevel === 'warning' ? 'text-orange-400' :
                            'text-blue-400'
                        }`}>
                        {alertLevel === 'critical' ? 'CRITICAL ALERT DETECTED' :
                            alertLevel === 'warning' ? 'ANOMALY DETECTED' :
                                'Titan Holo-Globe'}
                    </h3>
                </div>
                <p className={`text-xs mt-1 font-mono ${alertLevel === 'critical' ? 'text-red-500' :
                    alertLevel === 'warning' ? 'text-orange-500' :
                        'text-blue-500/60'
                    }`}>
                    {alertMessage || (selectedProjectId ? `TRACKING: ${selectedProjectId.toUpperCase()}` : 'GLOBAL TRAFFIC MONITORING')}
                </p>
            </div>

            <Globe
                ref={globeEl}
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                backgroundColor="rgba(0,0,0,0)"
                width={1200} // Ensuring it fills nice on wide screens, responsive CSS usually handles container
                height={500}

                // Arcs
                arcsData={filteredArcs}
                arcColor="color"
                arcDashLength={() => Math.random()}
                arcDashGap={() => Math.random()}
                arcDashAnimateTime={() => Math.random() * 4000 + 500}
                arcStroke={0.5}

                // Points (Rings)
                ringsData={filteredPoints}
                ringColor="color"
                ringMaxRadius="size"
                ringPropagationSpeed={2}
                ringRepeatPeriod={1000}

                // Atmosphere
                atmosphereColor={atmosphereColor}
                atmosphereAltitude={0.15}
            />

            {/* Holographic Grid Overlay (CSS) */}
            <div className="absolute inset-0 pointer-events-none bg-[url('/grid-pattern.png')] opacity-10 mix-blend-overlay"></div>
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[var(--card-bg)] to-transparent pointer-events-none"></div>
        </div>
    );
}
