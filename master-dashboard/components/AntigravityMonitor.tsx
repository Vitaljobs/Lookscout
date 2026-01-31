'use client';

import React, { useEffect, useRef } from 'react';
import { Orbit, Layers } from 'lucide-react';

interface Particle {
    x: number;
    y: number;
    speed: number;
    angle: number;
    distance: number;
    color: string;
    size: number;
}

export default function AntigravityMonitor() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let time = 0;
        const particles: Particle[] = [];

        const nodes = [
            { name: 'Common Ground', color: '#10b981', orbit: 60 },
            { name: 'VitalJobs', color: '#3b82f6', orbit: 60, angleOffset: Math.PI / 2 },
            { name: 'Echo Chamber', color: '#8b5cf6', orbit: 60, angleOffset: Math.PI },
            { name: 'Lookscout', color: '#f59e0b', orbit: 60, angleOffset: -Math.PI / 2 },
        ];

        const createParticle = (originX: number, originY: number, color: string) => {
            particles.push({
                x: originX,
                y: originY,
                speed: 0.5 + Math.random() * 0.5,
                angle: Math.atan2(canvas.height / 2 - originY, canvas.width / 2 - originX),
                distance: 60,
                color: color,
                size: 1 + Math.random()
            });
        };

        const render = () => {
            time += 0.02;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            // Draw Central Core (Titan)
            ctx.shadowBlur = 20;
            ctx.shadowColor = 'rgba(99, 102, 241, 0.8)';
            ctx.fillStyle = '#6366f1';
            ctx.beginPath();
            ctx.arc(centerX, centerY, 8 + Math.sin(time * 2) * 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Draw Nodes & Spawn Particles
            nodes.forEach((node, i) => {
                const angle = time * 0.5 + (node.angleOffset || 0);
                const x = centerX + Math.cos(angle) * node.orbit;
                const y = centerY + Math.sin(angle) * node.orbit;

                // Orbit Trail
                ctx.strokeStyle = `rgba(255, 255, 255, 0.05)`;
                ctx.beginPath();
                ctx.arc(centerX, centerY, node.orbit, 0, Math.PI * 2);
                ctx.stroke();

                // Node
                ctx.shadowBlur = 10;
                ctx.shadowColor = node.color;
                ctx.fillStyle = node.color;
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;

                // Spawn particle occasionally
                if (Math.random() < 0.05) {
                    createParticle(x, y, node.color);
                }
            });

            // Update & Draw Particles (Gravity Flow)
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.distance -= p.speed;

                // Update position based on angle and new distance
                p.x = centerX + Math.cos(p.angle + Math.PI) * p.distance * -1; // Hacky math fix, essentially move towards center
                // Better math: Just lerp towards center? No, let's keep it simple.
                // Re-calculate pos:
                p.x += Math.cos(p.angle) * p.speed;
                p.y += Math.sin(p.angle) * p.speed;

                const distToCenter = Math.sqrt(Math.pow(p.x - centerX, 2) + Math.pow(p.y - centerY, 2));

                if (distToCenter < 10) {
                    particles.splice(i, 1); // Absorbed by core
                    continue;
                }

                ctx.fillStyle = p.color;
                ctx.globalAlpha = distToCenter / 60; // Fade out as getting closer
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }

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
                            <p className="text-[10px] text-gray-400">Particle Data Flow</p>
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
                            <span className="text-[10px] text-indigo-300 font-mono">FLOW: KINETIC</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
