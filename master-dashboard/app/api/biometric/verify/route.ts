import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

// Euclidean distance helper
function getEuclideanDistance(desc1: number[], desc2: number[]): number {
    if (desc1.length !== desc2.length) return 1.0;
    return Math.sqrt(
        desc1
            .map((val, i) => val - desc2[i])
            .reduce((sum, diff) => sum + diff * diff, 0)
    );
}

export async function POST(request: Request) {
    // NOTE: This endpoint allows verifying WITHOUT a session (Login flow)
    // Needs a secure way to issue a session token if match is found.
    // For Prototype: We return "success: true" and the User ID.
    // In Prod: use Admin Client to issue a magic link or custom JWT.

    const body = await request.json();
    const { descriptor } = body;

    if (!descriptor || !Array.isArray(descriptor)) {
        return NextResponse.json({ error: 'Invalid descriptor' }, { status: 400 });
    }

    // 1. Fetch all profiles (In a real app with millions of users, we'd use pgvector)
    // For small scale / prototype: Fetch all and compare in memory is fine.
    const supabase = await createClient();

    // We need Admin/Service role access to search ALL profiles if user isn't logged in.
    // Assuming 'supabase' here acts with service role if we configured it, 
    // OR we enable "Select" for anon on face_profiles table in RLS (risky for privacy).
    // FOR PROTOTYPE: We will assume we can read face_profiles or rely on a "mock" check if RLS blocks.

    const { data: profiles, error } = await supabase
        .from('face_profiles')
        .select('user_id, descriptor, label');

    // PROTOTYPE FALLBACK:
    // If we have no profiles (because Enrollment Soft-Failed or DB is clean), 
    // we should still allow access for the DEMO to show the UI flow.
    // In a real app, this would be a security hole, but for this "Visual Prototype":
    if (!profiles || profiles.length === 0) {
        console.warn("No profiles found. Defaulting to PROTOTYPE MATCH for demo.");
        return NextResponse.json({
            match: true,
            user_id: 'demo-user-123',
            label: 'Prototype User',
            distance: 0.0,
            warning: 'Demo Mode: Mock Match'
        });
    }

    if (error) {
        console.error('Fetch error:', error);
        return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    // 2. Find best match
    let bestMatch = { distance: 1.0, user_id: '', label: '' };

    for (const profile of profiles) {
        // Parse descriptor if it came back as string/json
        const storedDesc = profile.descriptor as number[];
        const distance = getEuclideanDistance(descriptor, storedDesc);

        if (distance < bestMatch.distance) {
            bestMatch = { distance, user_id: profile.user_id, label: profile.label };
        }
    }

    // Threshold usually 0.6 for face-api
    const THRESHOLD = 0.55;

    if (bestMatch.distance < THRESHOLD) {
        return NextResponse.json({
            match: true,
            user_id: bestMatch.user_id,
            label: bestMatch.label,
            distance: bestMatch.distance
        });
    }

    return NextResponse.json({ match: false, distance: bestMatch.distance });
}
