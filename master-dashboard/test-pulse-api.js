const fs = require('fs');
const path = require('path');

async function testPulseApi() {
    // 1. Load Env
    const envPath = path.resolve(process.cwd(), '.env.local');
    const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    const env = {};
    envContent.split(/\r?\n/).forEach(line => {
        const parts = line.split('=');
        if (parts[0] && parts[1]) env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    });

    const anonKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
    const baseUrl = env['NEXT_PUBLIC_SUPABASE_URL']; // https://xxx.supabase.co

    console.log("🔍 Testing Pulse API Raw Fetch...");
    console.log(`   - Base URL: ${baseUrl}`);
    console.log(`   - Key: ${anonKey ? 'Present' : 'Missing'}`);

    if (!baseUrl || !anonKey) {
        console.error("❌ Missing config");
        return;
    }

    // 2. Construct URL exactly like PulseAPI
    // Target: /rest/v1/stats?select=*&limit=1
    const url = `${baseUrl}/rest/v1/stats?select=*&limit=1`;
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
            console.error("❌ Request Failed!");
        } else {
            const data = await response.json();
            console.log("✅ Success! Data:", data);
        }

    } catch (err) {
        console.error("❌ Exception:", err);
    }
}

testPulseApi();
