import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@insforge/sdk';
import { decrypt } from '@/lib/encryption';

// Initialize InsForge with Service Role for administrative access
const supabase = createClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    edgeFunctionToken: process.env.INSFORGE_SERVICE_ROLE_KEY!
});

export async function POST(request: NextRequest) {
    try {
        console.log('[API] Incoming sync request...');
        const apiKey = request.headers.get('x-api-key');
        if (!apiKey) {
            return NextResponse.json({ error: 'Missing API Key' }, { status: 401 });
        }

        const payload = await request.json();
        console.log('[API] Payload received:', JSON.stringify(payload, null, 2));
        const { site_id, sender_name, sender_email, subject, body, message_id, metadata } = payload;

        if (!site_id || !sender_email || !body) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Find the site in external_sites
        const { data: sites, error: siteError } = await supabase.database
            .from('external_sites')
            .select('*')
            .eq('site_name', site_id);

        if (siteError || !sites || sites.length === 0) {
            console.error(`[API] Site not found: ${site_id}`, siteError);
            return NextResponse.json({ error: 'Site not registered' }, { status: 404 });
        }

        // 2. Verify API Key
        let isAuthorized = false;
        let matchedSiteId = '';

        for (const site of sites) {
            try {
                const decryptedKey = decrypt(site.api_key);
                if (decryptedKey === apiKey) {
                    isAuthorized = true;
                    matchedSiteId = site.id;
                    break;
                }
            } catch (e) {
                console.warn(`[API] Decryption failed for site ${site.site_name}`);
            }
        }

        if (!isAuthorized) {
            return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 });
        }

        // 3. Save to support_messages
        const { data: message, error: messageError } = await supabase.database
            .from('support_messages')
            .insert({
                site_id: matchedSiteId,
                sender_name,
                sender_email,
                subject: subject || 'No Subject',
                body,
                status: 'open'
                // metadata column missing in DB for now
            })
            .select()
            .single();

        if (messageError) {
            console.error('[API] Failed to save message:', messageError);
            return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
        }

        console.log(`[API] Message synced successfully from ${site_id}: ${message.id}`);

        return NextResponse.json({
            success: true,
            id: message.id,
            status: message.status
        });

    } catch (error: any) {
        console.error('[API] Unexpected error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}

// OPTIONS for CORS preflight
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
        },
    });
}
