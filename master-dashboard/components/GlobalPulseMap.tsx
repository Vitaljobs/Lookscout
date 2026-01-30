'use client';

import React from 'react';
import { useProjects } from '@/context/ProjectContext';

// Simplified World Map SVG Path (Robinson Projection approx)
const WorldMapPath = "M 100 60 Q 120 40 150 40 T 200 50 Q 250 30 300 40 T 400 50 Q 450 60 500 50 T 600 60 Q 650 40 700 50 T 800 60 V 300 H 0 V 60 Z";
// This is a placeholder path. For a real app, we'd use a detailed GeoJSON or a proper SVG path library.
// Since we can't install new deps and need "aesthetic", we will use a set of circles/dots for a "Cyberpunk" abstract map or a known simple path if possible.
// Better approach: Use a "Grid" representation or a stylized abstract map if we don't have exact paths.
// Let's use a stylized "Dot Matrix" map representation for that tech feel.

export default function GlobalPulseMap() {
    const { projects } = useProjects();

    // Mock locations for "Live" sessions if we don't have real geo-data yet
    // In a real scenario, 'UseTracking' would send lat/long or country codes.
    // Here we simulate activity "hubs".
    const activeHubs = [
        { x: 200, y: 150, color: '#3b82f6', pulse: true, name: 'North America' }, // US
        { x: 420, y: 140, color: '#10b981', pulse: true, name: 'Europe' },        // EU
        { x: 600, y: 180, color: '#f59e0b', pulse: true, name: 'Asia' },          // ASIA
        { x: 300, y: 250, color: '#ef4444', pulse: false, name: 'South America' } // SA
    ];

    return (
        <div className="card relative h-[400px] w-full overflow-hidden bg-[#111827] border border-[var(--glass-border)] shadow-2xl group">
            {/* Background Grid */}
            <div className="absolute inset-0" style={{
                backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
                backgroundSize: '40px 40px'
            }} />

            <div className="absolute top-4 left-4 z-10">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Global Echo Pulse
                </h3>
                <p className="text-xs text-gray-400">Live Session Activity (Real-time)</p>
            </div>

            {/* Abstract World Map using SVG */}
            <svg
                viewBox="0 0 800 400"
                className="w-full h-full opacity-40 hover:opacity-60 transition-opacity duration-500"
            >
                {/* Simplified "Land" masses - Abstract styling */}
                <path
                    d="M 50,80 Q 150,20 250,80 T 400,100 T 550,80 T 750,120 V 300 H 50 Z"
                    fill="none"
                    stroke="rgba(59, 130, 246, 0.3)"
                    strokeWidth="2"
                />
                <circle cx="200" cy="150" r="40" fill="rgba(59, 130, 246, 0.1)" />
                <circle cx="420" cy="140" r="30" fill="rgba(16, 185, 129, 0.1)" />
                <circle cx="600" cy="180" r="50" fill="rgba(245, 158, 11, 0.1)" />
            </svg>

            {/* Active Session Dots */}
            {activeHubs.map((hub, i) => (
                <div
                    key={i}
                    className="absolute w-3 h-3 rounded-full cursor-pointer transition-transform hover:scale-150"
                    style={{ left: `${hub.x / 8}%`, top: `${hub.y / 4}%`, backgroundColor: hub.color }}
                >
                    <div className={`absolute -inset-2 rounded-full opacity-40 animate-ping`} style={{ backgroundColor: hub.color }} />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {hub.name}
                    </div>
                </div>
            ))}

            {/* Total Active Count Overlay */}
            <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10">
                <div className="text-xs text-gray-400">Total Live Echoes</div>
                <div className="text-2xl font-mono text-white font-bold flex items-center gap-2">
                    428
                    <span className="text-xs text-green-400 flex items-center">
                        ▲ 12%
                    </span>
                </div>
            </div>
        </div>
    );
}

// Note: In a production version with 'react-simple-maps', we would render a proper GeoJSON map.
// This component simulates the visual effect requested ("Live Heatmap") using abstract hubs for the v2.0 aesthetic.
