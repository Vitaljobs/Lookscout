// scripts/test-alert.js
const fetch = require('node-fetch'); // Needs node-fetch setup or use native fetch in Node 18+

async function triggerAlert() {
    console.log("🚀 Triggering Titan Monitor (Forced Alert)...");

    try {
        const response = await fetch('http://localhost:3000/api/monitor/scan?force_alert=true', {
            method: 'GET'
        });

        const data = await response.json();
        console.log("📡 Response:", JSON.stringify(data, null, 2));

        if (data.success) {
            console.log("✅ Alert Scan Completed. Check your email!");
        } else {
            console.error("❌ Scan Failed.");
        }
    } catch (error) {
        console.error("❌ Error triggering alert:", error.message);
        console.log("💡 Tip: Ensure the Next.js dev server is running on port 3000");
    }
}

triggerAlert();
