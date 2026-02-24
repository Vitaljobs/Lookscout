import { auth } from '@insforge/nextjs/server';
import { createClient as createInsForgeClient } from '@insforge/sdk';

export async function createClient() {
    let token;
    try {
        const authData = await auth();
        token = authData.token;
    } catch (error) {
        // User not authenticated or SSR pre-render without request context
    }

    return createInsForgeClient({
        baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
        anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
        ...(token ? { edgeFunctionToken: token } : {})
    });
}
