import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    // Initialize Supabase Client (Simple Admin/Anon Client for this route)
    // We use createClient directly to avoid cookie/SSR overhead for this simple data fetch

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;


    if (!url || !key) {
        console.error("❌ Critical: Missing Supabase Environment Variables");
        return NextResponse.json({ error: 'Configuration Error' }, { status: 500 });
    }

    const supabase = createClient(url, key);

    try {
        if (type === 'stats') {
            const { data, error } = await supabase
                .from('stats')
                .select('*')
                .limit(1)
                .single();

            if (error) throw error;

            // If table is empty, return defaults
            if (!data) {
                return NextResponse.json({
                    total_users: 0,
                    active_now: 0,
                    page_views_24h: 0,
                    popular_lab: 'N/A'
                });
            }

            return NextResponse.json(data);
        }

        if (type === 'live-users') {
            // For now, mock or return empty if table doesn't exist
            // ideally we query a 'live_users' table or 'profiles' with 'is_online'
            // returning mock list to satisfy frontend interface
            return NextResponse.json([
                { id: '1', name: 'Gebruiker 1', status: 'online', activity: 'Dashboard', location: 'Amsterdam', lastSeen: new Date().toISOString() },
                { id: '2', name: 'Gebruiker 2', status: 'online', activity: 'VIBECHAIN', location: 'Rotterdam', lastSeen: new Date().toISOString() },
            ]);
        }

        if (type === 'activity') {
            // Mock Activity Data matching expected schema in pulse.ts
            return NextResponse.json([
                { id: '1', user_name: 'Joshua Q.', action_type: 'Checked In', mood_score: 8, note: 'Feeling great about the launch!', created_at: new Date().toISOString() },
                { id: '2', user_name: 'Sarah M.', action_type: 'New Signup', mood_score: null, note: null, created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
                { id: '3', user_name: 'David K.', action_type: 'Completed Session', mood_score: 6, note: null, created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
                { id: '4', user_name: 'System', action_type: 'Deployment', mood_score: null, note: 'v1.0.2 Live', created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
            ]);
        }

        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });

    } catch (error) {
        console.error("Pulse API Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
