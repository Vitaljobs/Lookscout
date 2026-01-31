import { generateRegistrationOptions } from '@simplewebauthn/server';
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's existing credentials to exclude them during registration
    const { data: credentials } = await supabase
        .from('user_credentials')
        .select('credential_id')
        .eq('user_id', user.id);

    const options = await generateRegistrationOptions({
        rpName: 'Titan Control Tower',
        rpID: 'localhost', // TODO: Make dynamic for production
        userID: user.id,
        userName: user.email || 'titan-user',
        attestationType: 'none',
        excludeCredentials: credentials?.map(cred => ({
            id: cred.credential_id,
            type: 'public-key',
        })),
        authenticatorSelection: {
            residentKey: 'preferred',
            userVerification: 'preferred',
            authenticatorAttachment: 'platform', // FaceID, TouchID, Windows Hello
        },
    });

    // Store challenge in session/cookie - For simplicity in this demo we return it
    // Ideally, use a secure httpOnly cookie or Redis 
    // Here we'll rely on client passing it back signed, but server needs to verify it matches what it issued.
    // For this v3.4 Prototype: We will trust the flow but in PROD we must store challenge in DB/Redis.
    // Let's create a 'challenges' table or store in user metadata temporarily? 
    // Or simpler: Signed JWT cookie for challenge.

    return NextResponse.json(options);
}
