const { GoogleGenAI } = require('@google/genai');
require('dotenv').config({ path: __dirname + '/.env' });
const fs = require('fs');
const path = require('path');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const animalType = 'cattle';

async function testGemini() {
    try {
        const imagePath = 'photo-1772784125177-828137737.jpg';
        if (!imagePath) return console.log("No test image found in uploads folder.");

        const imageBuffer = fs.readFileSync(path.join(__dirname, 'uploads', imagePath));

        const prompt = `You are an expert veterinarian specializing in livestock diseases in East Africa.
                
Analyze this image of a ${animalType || 'farm animal'} carefully. Look for common disease signs.

Based on what you see, identify the most likely disease. Generate a complete, detailed disease profile from your own expert knowledge base. Do NOT restrict yourself to any specific list.

Return ONLY a valid JSON object (no markdown formatting) matching exactly this structure:
{
    "name": "Exact Disease Name",
    "confidence": 0.85,
    "analysis_notes": "Brief explanation of why you suspect this disease based on the image",
    "symptoms": ["fever", "lameness", "visible lumps"],
    "description": "Short description of the disease.",
    "treatment": [
        {
            "name": "Antibiotics / Medicine Category",
            "medicines": [
                { "name": "Medicine Name", "dosage": "Dosage instructions" }
            ]
        }
    ],
    "homeRemedies": [
        { "remedy": "Remedy Name", "instructions": "How to apply or use it" }
    ],
    "prevention": "How to prevent this disease"
}

If the image is too unclear or does not show an animal, still try your best to pick a disease but set confidence low.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                prompt,
                {
                    inlineData: {
                        data: imageBuffer.toString("base64"),
                        mimeType: "image/jpeg"
                    }
                }
            ],
            config: {
                responseMimeType: "application/json",
            }
        });

        console.log("----- RAW RESPONSE -----");
        console.log(response.text);
        console.log("------------------------");

        let responseText = response.text.trim();
        if (responseText.startsWith('```')) {
            responseText = responseText.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
        }
        const aiAnalysis = JSON.parse(responseText);
        console.log("✅ Parsed Successfully:", aiAnalysis.name);
    } catch (e) {
        console.error("❌ FAILED:", e.message || e);
    }
}
testGemini();
