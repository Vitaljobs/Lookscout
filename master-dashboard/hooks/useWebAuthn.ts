import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function useWebAuthn() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const registerPasskey = async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Get options
            const resp = await fetch('/api/auth/register-options', { method: 'POST' });
            const options = await resp.json();

            if (options.error) throw new Error(options.error);

            // 2. Browser Prompt
            const attResp = await startRegistration(options);

            // 3. Verify
            const verifyResp = await fetch('/api/auth/verify-registration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ response: attResp, challenge: options.challenge }),
            });

            const verification = await verifyResp.json();
            if (verification.verified) {
                alert('Passkey registered successfully!');
            } else {
                throw new Error('Verification failed');
            }

        } catch (err: any) {
            setError(err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loginWithPasskey = async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Get options
            const resp = await fetch('/api/auth/auth-options', { method: 'POST' });
            const options = await resp.json();

            // 2. Browser Prompt
            const asseResp = await startAuthentication(options);

            // 3. Verify
            const verifyResp = await fetch('/api/auth/verify-auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ response: asseResp, challenge: options.challenge }),
            });

            const verification = await verifyResp.json();
            if (verification.verified) {
                router.push('/dashboard');
            } else {
                throw new Error('Authentication failed');
            }
        } catch (err: any) {
            setError(err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return { registerPasskey, loginWithPasskey, loading, error };
}
