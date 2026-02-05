import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { analyzeEmail } from '@/lib/emailAnalyzer';

// Use service role key for server-side operations
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Webhook endpoint for receiving inbound emails from Resend
 * 
 * Resend will POST to this endpoint when an email is received
 * at the configured inbound address.
 * 
 * Expected payload format from Resend:
 * {
 *   "from": "sender@example.com",
 *   "to": "VOIDEZSS@GMAIL.COM",
 *   "subject": "Email subject",
 *   "text": "Plain text body",
 *   "html": "HTML body"
 * }
 */
export async function POST(request: NextRequest) {
    try {
        // Verify webhook signature (optional but recommended)
        const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
        if (webhookSecret) {
            const signature = request.headers.get('x-resend-signature');
            // TODO: Implement signature verification
            // For now, we'll skip this for simplicity
        }

        const payload = await request.json();
        console.log('📧 Inbound email received:', {
            from: payload.from,
            subject: payload.subject,
        });

        // Extract email details
        const from = payload.from || '';
        const subject = payload.subject || 'No Subject';
        const body = payload.text || payload.html || '';

        // Parse sender name and email
        const emailMatch = from.match(/<(.+)>/);
        const senderEmail = emailMatch ? emailMatch[1] : from;
        const senderName = from.replace(/<.+>/, '').trim() || senderEmail.split('@')[0];

        // Analyze email with AI
        console.log('🤖 Analyzing email with AI...');
        const analysis = await analyzeEmail(subject, body, senderEmail);
        console.log('✅ Analysis complete:', analysis);

        // Insert into database with project_id
        const { data, error } = await supabase
            .from('contact_messages')
            .insert({
                project_id: analysis.project_id,  // UUID from projects table
                project_source: analysis.project, // Keep slug for backwards compatibility
                name: senderName,
                email: senderEmail,
                subject: subject,
                message: body,
                status: 'new',
                sentiment: analysis.sentiment,
                metadata: {
                    confidence: analysis.confidence,
                    summary: analysis.summary,
                    received_at: new Date().toISOString(),
                    raw_from: from,
                },
            })
            .select()
            .single();

        if (error) {
            console.error('❌ Database error:', error);
            throw error;
        }

        console.log('✅ Email saved to database:', data.id);

        return NextResponse.json({
            success: true,
            messageId: data.id,
            analysis: {
                project: analysis.project,
                sentiment: analysis.sentiment,
            },
        });
    } catch (error) {
        console.error('❌ Error processing inbound email:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

/**
 * GET endpoint for testing
 */
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        message: 'Inbound email webhook is ready',
        endpoint: '/api/support/incoming',
    });
}
