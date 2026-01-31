import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { descriptor } = body;

    if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
        return NextResponse.json({ error: 'Invalid descriptor format' }, { status: 400 });
    }

    // Store the profile
    const { error } = await supabase.from('face_profiles').insert({
        user_id: user.id,
        descriptor: descriptor,
        label: user.email, // Or a custom label passed in
    });

    if (error) {
        console.error('Enrollment error:', error);
        return NextResponse.json({ error: 'Failed to enroll profile' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
