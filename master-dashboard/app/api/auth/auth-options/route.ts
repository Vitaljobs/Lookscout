import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    // For login, we might not know the user yet (username-less flow), 
    // OR we know them from a previous step. 
    // Titan flow: We are at "Biometric Login" screen. Ideally we ask browser "Do you have creds for this domain?"

    const options = await generateAuthenticationOptions({
        rpID: 'localhost',
        userVerification: 'preferred',
        allowCredentials: [], // Empty allowCredentials for discoverable credentials (Passkeys)
    });

    return NextResponse.json(options);
}
