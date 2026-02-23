const fs = require('fs');
const path = require('path');

async function clearInvalidSites() {
    // 1. Load Env
    const envPath = path.resolve(process.cwd(), '.env.local');
    const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    const env = {};
    envContent.split(/\r?\n/).forEach(line => {
        const parts = line.split('=');
        if (parts[0] && parts[1]) env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    });

    const serviceKey = env['SUPABASE_SERVICE_ROLE_KEY']; // Use service role to bypass RLS if needed, although policies were set to true
    const baseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];

    if (!baseUrl || !serviceKey) {
        console.error("❌ Missing config");
        return;
    }

    console.log("🧹 Clearing invalid External Sites...");

    // 2. Delete the dummy record
    const url = `${baseUrl}/rest/v1/external_sites?api_key=eq.dummy`;

    try {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'apikey': serviceKey,
                'Authorization': `Bearer ${serviceKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            console.log("✅ Success! Ongeldige (dummy) data verwijderd.");
        } else {
            console.error("❌ Verwijderen mislukt:", await response.text());
        }

    } catch (err) {
        console.error("❌ Exception:", err);
    }
}

clearInvalidSites();
