import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    return handleProxy(request);
}

export async function POST(request: Request) {
    return handleProxy(request);
}

async function handleProxy(request: Request) {
    try {
        const targetUrl = request.headers.get('X-Proxy-Target');

        if (!targetUrl) {
            return NextResponse.json({ error: 'Missing X-Proxy-Target header' }, { status: 400 });
        }

        let parsedUrl: URL;
        try {
            parsedUrl = new URL(targetUrl);
        } catch (e) {
            console.error('Proxy Error: Invalid target URL provided:', targetUrl);
            return NextResponse.json({ error: 'Invalid proxy target URL' }, { status: 400 });
        }

        // Prepare headers to forward
        const headers = new Headers(request.headers);
        headers.delete('host');
        headers.delete('connection');
        headers.delete('content-length');
        headers.delete('X-Proxy-Target'); // Don't forward this to the target

        let response: Response;
        try {
            response = await fetch(parsedUrl.toString(), {
                method: request.method,
                headers: headers,
                body: request.method !== 'GET' ? await request.blob() : undefined,
                // Add a timeout if possible, or just catch fetch failures
            });
        } catch (fetchError: any) {
            console.error(`Proxy Fetch Error for ${targetUrl}:`, fetchError);
            return NextResponse.json({
                error: 'Bad Gateway - Target server unreachable',
                details: fetchError.message || String(fetchError)
            }, { status: 502 });
        }

        const data = await response.json().catch(() => ({}));

        return NextResponse.json(data, {
            status: response.status,
            statusText: response.statusText
        });

    } catch (error) {
        console.error('Proxy internal error:', error);
        return NextResponse.json({ error: 'Proxy Request Failed', details: String(error) }, { status: 500 });
    }
}
