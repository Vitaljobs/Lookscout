import { useState, useEffect, useCallback } from 'react';
import { useProjects } from '@/context/ProjectContext';
import { useRouter } from 'next/navigation';

interface VoiceState {
    isListening: boolean;
    transcript: string;
    lastCommand: string | null;
    error: string | null;
}

// Extend Window interface for Web Speech API
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

export function useTitanVoice() {
    const [state, setState] = useState<VoiceState>({
        isListening: false,
        transcript: '',
        lastCommand: null,
        error: null,
    });

    const { selectProject, projects } = useProjects();
    const router = useRouter();

    const processCommand = useCallback((command: string) => {
        const lowerCmd = command.toLowerCase();
        console.log("Titan processed:", lowerCmd);

        // 1. Focus Mode
        if (lowerCmd.includes('focus') || lowerCmd.includes('activeer') || lowerCmd.includes('selecteer')) {
            const project = projects.find(p => lowerCmd.includes(p.id) || lowerCmd.includes(p.name.toLowerCase()));
            if (project) {
                selectProject(project.id);
                return `Activating Focus Mode: ${project.name}`;
            }
        }

        // 2. Navigation
        if (lowerCmd.includes('security') || lowerCmd.includes('beveiliging')) {
            // Scroll to security widget
            const el = document.getElementById('security-widget');
            if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
                return "Showing Security Logs";
            }
        }

        if (lowerCmd.includes('status') || lowerCmd.includes('overzicht')) {
            selectProject(null); // Reset to global
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return "Showing Global System Status";
        }

        return null;
    }, [projects, selectProject]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setState(s => ({ ...s, error: 'Voice API not supported' }));
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'nl-NL'; // Default to Dutch as requested context, or en-US

        recognition.onstart = () => {
            setState(s => ({ ...s, isListening: true, error: null }));
        };

        recognition.onend = () => {
            // Auto-restart if we want "always on" or just stop. 
            // for now, let's keep it manual toggle or auto-restart? 
            // Let's settle for manual toggle via UI for privacy, OR auto-restart if "Wake Word" mode was real (but web speech needs activation).
            // We'll simulate "Always Listening" by restarting on end if not manually stopped.
            // But simpler: Just reflect state.
            setState(s => ({ ...s, isListening: false }));
        };

        recognition.onresult = (event: any) => {
            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript;
            const final = event.results[current].isFinal;

            setState(s => ({ ...s, transcript }));

            if (final) {
                if (transcript.toLowerCase().includes('titan')) {
                    // Wake word detected in sentence? Or just interpret command.
                    // Simple logic: If sentence contains command.
                    const feedback = processCommand(transcript);
                    if (feedback) {
                        setState(s => ({ ...s, lastCommand: feedback, transcript: '' }));
                    }
                }
            }
        };

        // Expose start/stop
        (window as any).titanRecognition = recognition;

        return () => {
            recognition.stop();
        };
    }, [processCommand]);

    const toggleListening = () => {
        const recognition = (window as any).titanRecognition;
        if (state.isListening) {
            recognition.stop();
        } else {
            recognition.start();
        }
    };

    return {
        ...state,
        toggleListening
    };
}
