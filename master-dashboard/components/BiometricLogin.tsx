'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Camera, Scan, ShieldCheck, Lock, ChevronRight } from 'lucide-react';

export default function BiometricLogin() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const router = useRouter();

    const [status, setStatus] = useState<'idle' | 'scanning' | 'identifying' | 'success' | 'denied'>('idle');
    const [scanProgress, setScanProgress] = useState(0);

    // Initial Start
    useEffect(() => {
        startCamera();
        // Simulate auto-start for "Wow" effect
        const timer = setTimeout(() => {
            handleScan();
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Camera access denied or unavailable", err);
            // Fallback visuals if no camera?
        }
    };

    const handleScan = () => {
        setStatus('scanning');
        let progress = 0;
        const interval = setInterval(() => {
            progress += 2;
            setScanProgress(progress);

            // Draw simulated mesh on canvas
            drawMeshEffect();

            if (progress >= 50 && status !== 'identifying') {
                setStatus('identifying');
            }

            if (progress >= 100) {
                clearInterval(interval);
                setStatus('success');
                setTimeout(() => {
                    router.push('/dashboard');
                }, 1500);
            }
        }, 80); // ~4 seconds total scan time for dramatic effect
    };

    const drawMeshEffect = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        canvas.width = videoRef.current?.videoWidth || 640;
        canvas.height = videoRef.current?.videoHeight || 480;

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Or keep trails?

        // Draw "Face Detection" Box
        const w = canvas.width;
        const h = canvas.height;
        const boxSize = 250;
        const cx = w / 2;
        const cy = h / 2;

        ctx.strokeStyle = status === 'success' ? '#10b981' : '#3b82f6';
        ctx.lineWidth = 2;

        // Corners
        const cornerLen = 40;

        // Dynamic "breathing" box
        const sizeOffset = Math.sin(Date.now() / 200) * 10;
        const s = boxSize + sizeOffset;

        // Draw Corners
        ctx.beginPath();
        // TL
        ctx.moveTo(cx - s / 2, cy - s / 2 + cornerLen);
        ctx.lineTo(cx - s / 2, cy - s / 2);
        ctx.lineTo(cx - s / 2 + cornerLen, cy - s / 2);

        // TR
        ctx.moveTo(cx + s / 2 - cornerLen, cy - s / 2);
        ctx.lineTo(cx + s / 2, cy - s / 2);
        ctx.lineTo(cx + s / 2, cy - s / 2 + cornerLen);

        // BR
        ctx.moveTo(cx + s / 2, cy + s / 2 - cornerLen);
        ctx.lineTo(cx + s / 2, cy + s / 2);
        ctx.lineTo(cx + s / 2 - cornerLen, cy + s / 2);

        // BL
        ctx.moveTo(cx - s / 2 + cornerLen, cy + s / 2);
        ctx.lineTo(cx - s / 2, cy + s / 2);
        ctx.lineTo(cx - s / 2, cy + s / 2 - cornerLen);

        ctx.stroke();

        // Scan Line
        if (status === 'scanning' || status === 'identifying') {
            const scanY = cy - s / 2 + (s * (scanProgress % 100) / 100);

            ctx.beginPath();
            ctx.moveTo(cx - s / 2, scanY);
            ctx.lineTo(cx + s / 2, scanY);
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#3b82f6';
            ctx.stroke();
            ctx.shadowBlur = 0; // Reset
        }
    };

    return (
        <div className="relative min-h-screen w-full bg-black overflow-hidden flex items-center justify-center font-sans tracking-wide">
            {/* Background ambiance */}
            <div className="absolute inset-0 bg-[#050510]">
                {/* Tech grid overlay */}
                <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 via-transparent to-black pointer-events-none"></div>
            </div>

            {/* Main Interface Container */}
            <div className="relative z-10 flex flex-col items-center">

                {/* Logo / Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 text-center"
                >
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <ShieldCheck className="w-8 h-8 text-blue-500" />
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                            TITAN SECURITY
                        </h1>
                    </div>
                    <p className="text-blue-500/50 text-xs tracking-[0.2em]">CONTROL TOWER ACCESS</p>
                </motion.div>

                {/* Scanner Frame */}
                <div className="relative w-[600px] h-[400px] bg-black/40 rounded-2xl border border-blue-500/20 backdrop-blur-md overflow-hidden shadow-[0_0_80px_rgba(59,130,246,0.1)]">

                    {/* Camera Feed */}
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-screen grayscale-[30%]"
                    />

                    {/* Canvas Overlay for UI graphics */}
                    <canvas
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full"
                    />

                    {/* Scanline Overlay (CSS Animation alternative if canvas lags) */}
                    {/* <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/10 to-transparent animate-scan"></div> */}

                    {/* Status Text Overlay */}
                    <div className="absolute bottom-6 left-0 right-0 text-center">
                        <motion.div
                            key={status}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 border border-white/10 backdrop-blur-md"
                        >
                            {status === 'idle' && (
                                <>
                                    <div className="w-2 h-2 rounded-full bg-gray-500" />
                                    <span className="text-gray-400 text-sm font-mono">STANDBY</span>
                                </>
                            )}
                            {(status === 'scanning' || status === 'identifying') && (
                                <>
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                    <span className="text-blue-400 text-sm font-mono tracking-wider">
                                        {status === 'scanning' ? 'SCANNING SUBJECT...' : 'IDENTIFYING...'} {Math.floor(scanProgress)}%
                                    </span>
                                </>
                            )}
                            {status === 'success' && (
                                <>
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    <span className="text-green-400 text-sm font-mono font-bold tracking-widest">IDENTITY CONFIRMED</span>
                                </>
                            )}
                        </motion.div>
                    </div>

                    {/* Corner Brackets Visuals */}
                    <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-blue-500/30 rounded-tl-lg"></div>
                    <div className="absolute top-4 right-4 w-12 h-12 border-r-2 border-t-2 border-blue-500/30 rounded-tr-lg"></div>
                    <div className="absolute bottom-4 left-4 w-12 h-12 border-l-2 border-b-2 border-blue-500/30 rounded-bl-lg"></div>
                    <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-blue-500/30 rounded-br-lg"></div>
                </div>

                {/* Manual Override Option */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2 }}
                    className="mt-8"
                >
                    <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm group">
                        <Lock className="w-4 h-4 group-hover:text-blue-400" />
                        <span>Use Encryption Key (Password)</span>
                    </button>
                </motion.div>
            </div>

            {/* Holographic Particles/Noise (optional css class or svg) */}
        </div>
    );
}
