const fs = require('fs');
const path = require('path');

async function testConnections() {
    // 1. Load Env
    const envPath = path.resolve(process.cwd(), '.env.local');
    const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    const env = {};
    envContent.split(/\r?\n/).forEach(line => {
        const parts = line.split('=');
        if (parts[0] && parts[1]) env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    });

    const anonKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
    const baseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];

    console.log("🔍 Testing External Sites Table...");
    console.log(`   - Base URL: ${baseUrl}`);

    if (!baseUrl || !anonKey) {
        console.error("❌ Missing config");
        return;
    }

    // 2. Construct URL for external_sites
    const url = `${baseUrl}/rest/v1/external_sites?select=*`;
    console.log(`   - Target URL: ${url}`);

    // 3. Perform Fetch
    try {
        const response = await fetch(url, {
            headers: {
                'apikey': anonKey,
                'Authorization': `Bearer ${anonKey}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`   - Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Request Failed!", errorText);

            if (response.status === 404) {
                console.log("\n💡 MOGELIJKE OORZAAK: De tabel 'external_sites' bestaat waarschijnlijk nog niet in de database.");
            }
        } else {
            const data = await response.json();
            console.log("✅ Success! De tabel bestaat en is toegankelijk.");
            console.log("Data:", data);
        }

    } catch (err) {
        console.error("❌ Exception:", err);
    }
}

testConnections();
