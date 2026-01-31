'use client';

import React, { useEffect, useRef } from 'react';
import { Activity, Database, Share2, Zap, Orbit, Layers } from 'lucide-react';

export default function AntigravityMonitor() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let time = 0;

        const nodes = [
            { name: 'Common Ground', color: '#10b981', orbit: 30, speed: 0.005, size: 4 },
            { name: 'VitalJobs', color: '#3b82f6', orbit: 45, speed: 0.003, size: 5 },
            { name: 'Echo Chamber', color: '#8b5cf6', orbit: 60, speed: 0.002, size: 4 },
            { name: 'Lookscout', color: '#f59e0b', orbit: 75, speed: 0.004, size: 5 },
        ];

        const render = () => {
            time += 1;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            // Draw Central Core (Titan)
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'rgba(99, 102, 241, 0.8)';
            ctx.fillStyle = '#6366f1';
            ctx.beginPath();
            ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Draw Pulse core
            const pulseSize = 8 + Math.sin(time * 0.05) * 4;
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.4 - Math.sin(time * 0.05) * 0.2})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
            ctx.stroke();


            nodes.forEach((node) => {
                const angle = time * node.speed;
                const x = centerX + Math.cos(angle) * node.orbit;
                const y = centerY + Math.sin(angle) * node.orbit;

                // Orbit path
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(centerX, centerY, node.orbit, 0, Math.PI * 2);
                ctx.stroke();

                // Gravity Beam (Sync Line)
                if (time % 100 < 10) { // Occasional sync pulse
                    ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 - (time % 100) / 100})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(centerX, centerY);
                    ctx.lineTo(x, y);
                    ctx.stroke();
                }

                // Node
                ctx.shadowBlur = 10;
                ctx.shadowColor = node.color;
                ctx.fillStyle = node.color;
                ctx.beginPath();
                ctx.arc(x, y, node.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    return (
        <div className="card relative overflow-hidden group border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl shrink-0 w-[300px]">
            {/* Ambient Background Glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>

            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                            <Orbit className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Gravity Well</h3>
                            <p className="text-[10px] text-gray-400">Node Synchronization</p>
                        </div>
                    </div>
                </div>

                {/* Canvas Visualization */}
                <div className="flex-1 flex items-center justify-center relative">
                    <canvas ref={canvasRef} width={260} height={180} className="rounded-lg bg-black/20" />

                    {/* Overlay Stats */}
                    <div className="absolute bottom-2 left-2 flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                            <span className="text-[10px] text-indigo-300 font-mono">CORE: STABLE</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            <span className="text-[10px] text-green-300 font-mono">NODES: 4/4</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
