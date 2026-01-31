import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { messageId, to, replyText, originalSubject } = await request.json();

        if (!to || !replyText) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const resendApiKey = process.env.RESEND_API_KEY;

        if (!resendApiKey) {
            console.error('RESEND_API_KEY not configured');
            return NextResponse.json(
                { error: 'Email service not configured' },
                { status: 500 }
            );
        }

        // Send email via Resend
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'Titan Control Tower <noreply@titan.xx.kg>',
                to: [to],
                subject: `Re: ${originalSubject}`,
                html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Titan Control Tower</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Response from Support</p>
            </div>
            <div style="background: #f9fafb; padding: 30px;">
              <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <p style="color: #374151; line-height: 1.6; white-space: pre-wrap;">${replyText}</p>
              </div>
              <p style="color: #6b7280; font-size: 12px; margin-top: 20px; text-align: center;">
                Dit bericht is verzonden vanuit Titan Control Tower
              </p>
            </div>
          </div>
        `,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Resend API error:', error);
            throw new Error('Failed to send email via Resend');
        }

        const result = await response.json();

        return NextResponse.json({
            success: true,
            emailId: result.id,
        });
    } catch (error) {
        console.error('Error in reply API:', error);
        return NextResponse.json(
            { error: 'Failed to send reply' },
            { status: 500 }
        );
    }
}
