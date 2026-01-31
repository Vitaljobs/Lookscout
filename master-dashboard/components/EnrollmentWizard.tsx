'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

// Mock FaceAPI if models aren't loaded (Prototype fallback)
// In production, import * as faceapi from 'face-api.js';

export default function EnrollmentWizard({ onClose }: { onClose?: () => void }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [step, setStep] = useState<'start' | 'center' | 'left' | 'right' | 'processing' | 'success'>('start');
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [modelLoaded, setModelLoaded] = useState(false);

    useEffect(() => {
        const loadModels = async () => {
            const faceapi = (await import('face-api.js'));
            try {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                    faceapi.nets.faceRecognitionNet.loadFromUri('/models')
                ]);
                setModelLoaded(true);
            } catch (err) {
                console.error("Model load failed", err);
                setError("Failed to load AI models");
            }
        };
        loadModels();
    }, []);

    useEffect(() => {
        if (step !== 'start' && step !== 'success' && modelLoaded) {
            startCamera();
        }
        return () => stopCamera();
    }, [step, modelLoaded]);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            setError("Camera access required");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const captureAndAdvance = async () => {
        if (!videoRef.current) return;

        const faceapi = (await import('face-api.js'));
        const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();

        if (!detection) {
            setError("No face detected. Please position properly.");
            return;
        }

        setError(null); // Clear previous errors

        if (step === 'center') setStep('left');
        else if (step === 'left') setStep('right');
        else if (step === 'right') {
            setStep('processing');
            // We use the descriptor from the LAST capture (Right) as the profile for now.
            // In a pro version we'd average them.
            await saveProfile(Array.from(detection.descriptor));
        }
    };

    const saveProfile = async (descriptor: number[]) => {
        try {
            const res = await fetch('/api/biometric/enroll', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ descriptor }),
            });

            if (res.ok) {
                setStep('success');
            } else {
                const data = await res.json();
                console.error("Enrollment failed:", data);
                setError(data.error || 'Failed to save to cloud');
            }
        } catch (err) {
            setError('Network error');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0f1419] border border-blue-500/30 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-white/5 bg-gradient-to-r from-blue-900/20 to-transparent">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Camera className="w-5 h-5 text-blue-400" />
                        Master Enrollment
                    </h2>
                    <p className="text-xs text-blue-300/60 mt-1 uppercase tracking-wider">Project Titan • Identity Protocol</p>
                </div>

                {/* Content */}
                <div className="p-8 flex flex-col items-center">
                    {step === 'start' && (
                        <div className="text-center">
                            <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
                                <RefreshCw className="w-10 h-10 text-blue-400" />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2">Create Face Profile</h3>
                            <p className="text-gray-400 text-sm mb-8">
                                To enable universal access, we need to map your facial structure.
                                This data is encrypted and stored in the Titan Cloud.
                            </p>
                            <button
                                onClick={() => setStep('center')}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors w-full"
                            >
                                Start Enrollment
                            </button>
                        </div>
                    )}

                    {(step === 'center' || step === 'left' || step === 'right') && (
                        <div className="w-full">
                            <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-white/10 mb-6 group">
                                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover opacity-80" />
                                <div className="absolute inset-0 border-2 border-blue-500/30 rounded-lg group-hover:border-blue-500/60 transition-colors"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-48 h-64 border-2 border-dashed border-blue-400/50 rounded-full opacity-50"></div>
                                </div>
                            </div>

                            <div className="text-center mb-6">
                                <h3 className="text-lg font-bold text-white mb-1 uppercase tracking-wide">
                                    {step === 'center' && "Look Straight Ahead"}
                                    {step === 'left' && "Turn Head Left"}
                                    {step === 'right' && "Turn Head Right"}
                                </h3>
                                <p className="text-sm text-gray-500">Hold still for a moment</p>
                            </div>

                            <button
                                onClick={captureAndAdvance}
                                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/10 transition-colors"
                            >
                                Capture Angle
                            </button>
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="text-center py-12">
                            <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                            <h3 className="text-white font-medium">Encrypting Profile...</h3>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="text-center">
                            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                                <CheckCircle className="w-10 h-10 text-green-400" />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2">Enrollment Complete</h3>
                            <p className="text-gray-400 text-sm mb-8">
                                Your Master Profile has been updated. You can now use biometric login on any connected terminal.
                            </p>
                            <button
                                onClick={() => setStep('start')}
                                className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors w-full"
                            >
                                Done
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
