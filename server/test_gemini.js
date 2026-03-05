require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function testGemini() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        console.log("Using API Key starting with:", apiKey.substring(0, 10) + "...");

        const ai = new GoogleGenAI({ apiKey: apiKey });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Say "API key is working perfectly!" if you receive this message.',
        });

        console.log("Success! Gemini response:");
        console.log(response.text);
    } catch (error) {
        console.error("Error testing Gemini:", error.message || error);
    }
}

testGemini();
