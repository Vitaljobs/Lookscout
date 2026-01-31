import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Webhook endpoint to receive Echo Score updates from Echo Chamber
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { user_id, score, level, missions_completed, contributions, timestamp } = body;

        // Validate webhook (you can add API key validation here)
        const webhookSecret = request.headers.get('x-webhook-secret');
        if (webhookSecret !== process.env.ECHO_WEBHOOK_SECRET) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const supabase = await createClient();

        // Store Echo Score data in a new table for tracking
        const { error } = await supabase.from('echo_score_sync').insert({
            user_id,
            score,
            level,
            missions_completed,
            contributions,
            synced_at: timestamp || new Date().toISOString(),
        });

        if (error) {
            console.error('Error storing Echo Score:', error);
            throw error;
        }

        return NextResponse.json({
            success: true,
            message: 'Echo Score synced successfully',
        });
    } catch (error) {
        console.error('Error in Echo Score webhook:', error);
        return NextResponse.json(
            { error: 'Failed to sync Echo Score' },
            { status: 500 }
        );
    }
}

// GET endpoint to fetch latest Echo Score data
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get latest Echo Score data
        const { data, error } = await supabase
            .from('echo_score_sync')
            .select('*')
            .order('synced_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;

        return NextResponse.json({
            echoScore: data || null,
        });
    } catch (error) {
        console.error('Error fetching Echo Score:', error);
        return NextResponse.json(
            { error: 'Failed to fetch Echo Score' },
            { status: 500 }
        );
    }
}
