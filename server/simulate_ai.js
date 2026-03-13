require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
const mongoose = require('mongoose');
const Disease = require('./models/Disease');

async function testDiagnosis() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/animal-healthcare');
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const imagePath = path.join(__dirname, '..', 'test_cow.jpg');
    if (!fs.existsSync(imagePath)) {
        console.log("Image not found at", imagePath);
        return;
    }
    const imageBuffer = fs.readFileSync(imagePath);

    // Simulating diagnosis.js prompt
    const prompt = `You are an expert veterinarian specializing in livestock diseases in East Africa.
                
Analyze this image of a cattle carefully.

Look for ANY of these common livestock disease signs:
- Skin lesions, blisters, sores, ulcers
- Swelling (joints, legs, jaw, lymph nodes)
- Discharge (nasal, eye, mouth)
- Abnormal posture, lameness, lethargy
- Discoloration (skin, mucous membranes)
- Diarrhea signs, bloating
- Respiratory distress
- Hair/feather loss, poor coat condition
- Visible parasites
- Mouth/hoof lesions (FMD)
- Lumps, nodules (Lumpy Skin Disease)

Based on what you see, identify the most likely disease from this list:
Foot and Mouth Disease, East Coast Fever, Blackleg, Lumpy Skin Disease, Mastitis, Bloat, Pneumonia, Newcastle Disease, Coccidiosis, Mange, Anthrax, Brucellosis, Anaplasmosis, Foot Rot, Trypanosomiasis

Return ONLY a valid JSON object (no markdown formatting):
{
    "visible_signs": ["list", "of", "what", "you", "see"],
    "symptoms": ["fever", "lameness", "swelling"],
    "suspected_disease": "Disease Name",
    "confidence": 0.7,
    "analysis_notes": "Brief explanation of why you suspect this disease"
}

If the image is too unclear or doesn't show an animal, still try your best but set confidence low.`;

    let aiAnalysis = null;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                prompt,
                { inlineData: { data: imageBuffer.toString("base64"), mimeType: "image/jpeg" } }
            ],
            config: { responseMimeType: "application/json" }
        });

        let responseText = response.text.trim();
        if (responseText.startsWith('\`\`\`')) {
            responseText = responseText.replace(/\`\`\`json?\n?/g, '').replace(/\`\`\`$/g, '').trim();
        }
        aiAnalysis = JSON.parse(responseText);
        console.log("Parsed AI Analysis:", aiAnalysis);
    } catch (e) {
        console.error("AI Error", e);
    }

    // Matching logic
    let symptoms = "photo analysis visual inspection";
    let animalType = "cattle";

    const mergedSymptoms = new Set([
        ...(symptoms ? symptoms.toLowerCase().split(',').map(s => s.trim()).filter(s => s && s !== 'photo analysis visual inspection') : []),
        ...(aiAnalysis && aiAnalysis.symptoms ? aiAnalysis.symptoms.map(s => s.toLowerCase().trim()) : []),
        ...(aiAnalysis && aiAnalysis.visible_signs ? aiAnalysis.visible_signs.map(s => s.toLowerCase().trim()) : [])
    ]);

    symptoms = Array.from(mergedSymptoms).filter(Boolean).join(', ');

    if (symptoms) {
        symptoms = symptoms.split(',')
            .map(s => s.trim())
            .filter(s => s && !['photo analysis', 'visual inspection', 'photo analysis visual inspection'].includes(s.toLowerCase()))
            .join(', ');
    }

    const symptomList = symptoms ? symptoms.toLowerCase().split(',').map(s => s.trim()).filter(Boolean) : [];
    console.log("Symptom List:", symptomList);

    const allDiseases = await Disease.find({ animalType });
    let results = [];

    allDiseases.forEach(disease => {
        let matchCount = 0;
        let isAiExactMatch = false;

        if (aiAnalysis && aiAnalysis.suspected_disease) {
            const suspectedLower = aiAnalysis.suspected_disease.toLowerCase();
            const diseaseLower = disease.name.toLowerCase();
            if (diseaseLower.includes(suspectedLower) || suspectedLower.includes(diseaseLower)) {
                isAiExactMatch = true;
                matchCount += 5;
            }
        }

        symptomList.forEach(querySymptom => {
            const hasMatch = disease.symptoms.some(diseaseSymptom =>
                diseaseSymptom.toLowerCase().includes(querySymptom) ||
                querySymptom.includes(diseaseSymptom.toLowerCase())
            );
            if (hasMatch) matchCount++;
        });

        if (matchCount > 0) {
            results.push({
                diseaseName: disease.name,
                matchScore: Math.min(1, matchCount / Math.max(symptomList.length, 1)),
                isAiMatch: isAiExactMatch,
                confidence: aiAnalysis ? Math.round(aiAnalysis.confidence * 100) : 0
            });
        }
    });

    console.log("Matched Results:", results);
    process.exit(0);
}

testDiagnosis();
