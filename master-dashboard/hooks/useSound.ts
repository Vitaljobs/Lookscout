import { useCallback, useRef } from 'react';

// Web Audio API synthesized sounds - no external dependencies
class AudioSynthesizer {
    private audioContext: AudioContext | null = null;

    private getContext(): AudioContext {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return this.audioContext;
    }

    // Success ping for small score increases
    playSuccess(): void {
        try {
            const ctx = this.getContext();
            const now = ctx.currentTime;

            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(800, now);
            osc1.frequency.exponentialRampToValueAtTime(1600, now + 0.15);
            gain1.gain.setValueAtTime(0.15, now);
            gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

            osc1.connect(gain1).connect(ctx.destination);
            osc1.start(now);
            osc1.stop(now + 0.3);
        } catch (e) {
            console.log('Audio not available');
        }
    }

    // Level up sound - triumphant ascending chord
    playLevelUp(): void {
        try {
            const ctx = this.getContext();
            const now = ctx.currentTime;

            const frequencies = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
            const delays = [0, 0.06, 0.12, 0.18];

            frequencies.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq * 0.5, now + delays[i]);
                osc.frequency.exponentialRampToValueAtTime(freq, now + delays[i] + 0.1);

                gain.gain.setValueAtTime(0, now + delays[i]);
                gain.gain.linearRampToValueAtTime(0.12, now + delays[i] + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.01, now + delays[i] + 0.5);

                osc.connect(gain).connect(ctx.destination);
                osc.start(now + delays[i]);
                osc.stop(now + delays[i] + 0.5);
            });
        } catch (e) {
            console.log('Audio not available');
        }
    }

    // Subtle notification blip
    playBlip(): void {
        try {
            const ctx = this.getContext();
            const now = ctx.currentTime;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);

            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

            osc.connect(gain).connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.1);
        } catch (e) {
            console.log('Audio not available');
        }
    }
}

const synthesizer = new AudioSynthesizer();

export const useSound = () => {
    const lastPlayTimeRef = useRef<number>(0);

    const playSuccess = useCallback(() => {
        synthesizer.playSuccess();
    }, []);

    const playLevelUp = useCallback(() => {
        synthesizer.playLevelUp();
    }, []);

    const playBlip = useCallback(() => {
        const now = Date.now();
        // Debounce: only play if 500ms has passed since last blip
        if (now - lastPlayTimeRef.current > 500) {
            synthesizer.playBlip();
            lastPlayTimeRef.current = now;
        }
    }, []);

    return {
        playSuccess,
        playLevelUp,
        playBlip,
    };
};
