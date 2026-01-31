import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const body = await request.json();
    const { response, challenge } = body; // Client must send back the challenge for verification context

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: challenge, // In prod, retrieve from DB/Session, don't trust client provided challenge blind if possible. logic here is simplified.
        expectedOrigin: 'http://localhost:3000', // TODO: Make dynamic
        expectedRPID: 'localhost',
    });

    if (verification.verified && verification.registrationInfo) {
        const { credentialPublicKey, credentialID, counter } = verification.registrationInfo;

        // Save to DB
        const { error } = await supabase.from('user_credentials').insert({
            user_id: user.id,
            credential_id: Buffer.from(credentialID).toString('base64'),
            credential_public_key: Buffer.from(credentialPublicKey).toString('base64'),
            counter,
            transports: response.response.transports,
        });

        if (error) {
            console.error(error);
            return NextResponse.json({ error: 'Failed to save credential' }, { status: 500 });
        }

        return NextResponse.json({ verified: true });
    }

    return NextResponse.json({ verified: false, error: 'Verification failed' }, { status: 400 });
}
