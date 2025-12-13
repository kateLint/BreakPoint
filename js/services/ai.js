/**
 * AI Service
 * Handles interactions with Google's Gemini API
 */

let API_KEY = ""; // User will need to provide this

export async function callGemini(prompt) {
    if (!API_KEY) {
        console.warn("Gemini API Key missing! Using mock response.");
        return mockResponse(prompt);
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`;

    const payload = {
        contents: [{ parts: [{ text: prompt }] }]
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate that.";
    } catch (error) {
        console.error("Gemini API failed:", error);
        return mockResponse(prompt);
    }
}

export function setApiKey(key) {
    API_KEY = key;
}

function mockResponse(prompt) {
    // Basic mock logic based on prompt keywords
    if (prompt.includes("Slack message")) {
        return "Hey team! ☕ Coffee break matches in 5 min at Kitchen A. Be there or be caffeine-deprived! 🏃‍♂️💨";
    }
    if (prompt.includes("restaurant options")) {
        return `[
            {"name": "Mock Bistro", "type": "French", "price": "$$$", "emoji": "🥖", "color": "bg-blue-100"},
            {"name": "Pixel Pizza", "type": "Italian", "price": "$$", "emoji": "🍕", "color": "bg-red-100"},
            {"name": "Code Curry", "type": "Indian", "price": "$", "emoji": "🍛", "color": "bg-yellow-100"},
            {"name": "Data Dumplings", "type": "Chinese", "price": "$$", "emoji": "🥟", "color": "bg-orange-100"}
        ]`;
    }
    return "I am just a mock AI until you add an API Key! 🤖";
}
