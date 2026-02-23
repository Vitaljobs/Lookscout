const fs = require('fs');
const path = require('path');

async function checkMessages() {
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

    console.log("🔍 Checking for incoming messages in support_messages...");

    if (!baseUrl || !anonKey) {
        console.error("❌ Missing config");
        return;
    }

    // 2. Query support_messages
    const url = `${baseUrl}/rest/v1/support_messages?select=*,external_sites(site_name)&order=created_at.desc&limit=1`;

    try {
        const response = await fetch(url, {
            headers: {
                'apikey': anonKey,
                'Authorization': `Bearer ${anonKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.length > 0) {
                console.log("✅ Success! Recent message found:");
                console.log(JSON.stringify(data[0], null, 2));
            } else {
                console.log("⏳ No messages found yet.");
            }
        } else {
            console.error("❌ Request Failed!", await response.text());
        }

    } catch (err) {
        console.error("❌ Exception:", err);
    }
}

checkMessages();
