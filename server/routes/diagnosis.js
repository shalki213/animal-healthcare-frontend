const express = require('express');
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
const Disease = require('../models/Disease');
const DiagnosisLog = require('../models/DiagnosisLog');
const { auth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Initialize Gemini AI securely
let ai = null;
try {
    if (process.env.GEMINI_API_KEY) {
        ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } else {
        console.warn('⚠️ GEMINI_API_KEY is missing. AI photo diagnosis features will be disabled.');
    }
} catch (error) {
    console.error('❌ Failed to initialize Gemini AI:', error.message);
}

const router = express.Router();

/**
 * POST /api/diagnosis
 * Submit a diagnosis request (authenticated users only).
 * Accepts symptoms, animalType, and optional photo upload.
 * Photos are analyzed by Gemini AI for disease identification.
 */
router.post('/', auth, upload.single('photo'), async (req, res, next) => {
    try {
        let { symptoms, animalType } = req.body;
        let aiAnalysis = null;
        let aiMatched = false;
        let aiError = null;

        // Query the database FIRST to get the EXACT diseases available
        const filter = {};
        if (animalType) {
            filter.animalType = animalType.toLowerCase();
        }
        const allDiseases = await Disease.find(filter);
        const dynamicDiseaseNames = allDiseases.map(d => d.name).join(', ') || 'Common livestock diseases';

        // If a photo was uploaded, use Gemini Vision to analyze it
        if (req.file && ai) {
            try {
                // Read the image file and convert to base64
                const imagePath = path.join(__dirname, '..', 'uploads', req.file.filename);
                const imageBuffer = fs.readFileSync(imagePath);

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
                                mimeType: req.file.mimetype
                            }
                        }
                    ],
                    config: {
                        responseMimeType: "application/json",
                    }
                });

                // Parse the AI response, handling possible markdown wrapping
                let responseText = response.text.trim();
                if (responseText.startsWith('```')) {
                    responseText = responseText.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
                }
                aiAnalysis = JSON.parse(responseText);

                // AI has generated the full profile
                aiMatched = true;

            } catch (err) {
                console.error("Gemini AI Analysis failed:", err.message || err);
                aiError = err.message || 'AI vision service unavailable';
                // Continue with fallback — don't crash
            }
        }

        // Clean up the symptoms — remove the placeholder text from the frontend
        if (symptoms) {
            symptoms = symptoms.split(',')
                .map(s => s.trim())
                .filter(s => s && !['photo analysis', 'visual inspection', 'photo analysis visual inspection'].includes(s.toLowerCase()))
                .join(', ');
        }

        // If we have a photo but NO symptoms (Gemini failed + no user input),
        // return ALL diseases as suggestions instead of an empty result
        const isPhotoOnlyRequest = req.file && !symptoms;

        // Parse symptoms
        const symptomList = symptoms
            ? symptoms.toLowerCase().split(',').map(s => s.trim()).filter(Boolean)
            : [];

        let results = [];
        let aiGeneratedDiseaseAdded = false;

        // 1. Inject the AI-generated complete disease profile as the ultimate top result
        if (aiAnalysis && aiAnalysis.name && aiAnalysis.treatment) {
            results.push({
                diseaseId: null, // AI generated, no DB ID
                diseaseName: aiAnalysis.name,
                matchScore: Math.min(1, Math.max(0.7, (aiAnalysis.confidence || 0.85))),
                isAiMatch: true,
                aiAnalysis: aiAnalysis.analysis_notes,
                disease: {
                    name: aiAnalysis.name,
                    symptoms: aiAnalysis.symptoms || [],
                    description: aiAnalysis.description || '',
                    treatment: aiAnalysis.treatment || [],
                    homeRemedies: aiAnalysis.homeRemedies || [],
                    prevention: aiAnalysis.prevention || ''
                }
            });
            aiGeneratedDiseaseAdded = true;
        }

        // 2. Normal scoring — match symptoms against local database diseases for alternative suggestions
        allDiseases.forEach(disease => {
            let matchCount = 0;
            let isAiExactMatch = false;

            // Check if Gemini exactly matched this disease name
            if (aiAnalysis && (aiAnalysis.suspected_disease || aiAnalysis.name)) {
                const suspectedLower = (aiAnalysis.suspected_disease || aiAnalysis.name).toLowerCase();
                const diseaseLower = disease.name.toLowerCase();
                if (suspectedLower.length > 3 && suspectedLower !== 'none' && suspectedLower !== 'healthy' && suspectedLower !== 'unknown') {
                    if (diseaseLower.includes(suspectedLower) || suspectedLower.includes(diseaseLower)) {
                        // If the AI generated its own custom profile, explicitly skip the DB version to avoid duplicates
                        if (aiGeneratedDiseaseAdded) return;

                        isAiExactMatch = true;
                        matchCount += 5; // Heavy weight for AI exact matches
                    }
                }
            }

            symptomList.forEach(querySymptom => {
                const hasMatch = disease.symptoms.some(diseaseSymptom =>
                    diseaseSymptom.toLowerCase().includes(querySymptom) ||
                    querySymptom.includes(diseaseSymptom.toLowerCase())
                );
                if (hasMatch) matchCount++;
            });

            if (isAiExactMatch && matchCount >= 5) {
                results.push({
                    diseaseId: disease._id,
                    diseaseName: disease.name,
                    matchScore: Math.min(1, Math.max(0.7, (aiAnalysis.confidence || 0.7))),
                    isAiMatch: true,
                    aiAnalysis: aiAnalysis.analysis_notes,
                    disease: disease.toObject()
                });
            } else if (matchCount > 0) {
                results.push({
                    diseaseId: disease._id,
                    diseaseName: disease.name,
                    matchScore: Math.min(1, matchCount / Math.max(symptomList.length, 1)),
                    isAiMatch: false,
                    aiAnalysis: aiAnalysis?.analysis_notes,
                    disease: disease.toObject()
                });
            }
        });

        // Sort by match score
        results.sort((a, b) => b.matchScore - a.matchScore);

        if (results.length === 0) {
            // No matches found by either AI or manual symptoms — return top diseases as suggestions
            const isAiImageFailure = req.file ? true : false;
            results = allDiseases.slice(0, 5).map(disease => ({
                diseaseId: disease._id,
                diseaseName: disease.name,
                matchScore: 0.3,
                isAiMatch: false,
                isSuggestion: true,
                aiAnalysis: isAiImageFailure ? (aiAnalysis?.analysis_notes || 'The AI could not identify specific disease symptoms from the photo. Make sure the affected area is clearly visible.') : undefined,
                disease: disease.toObject()
            }));
        }

        // Save diagnosis log
        const diagnosisLog = new DiagnosisLog({
            user: req.user._id,
            symptoms: symptoms || 'photo analysis',
            animalType: animalType || '',
            results: results.map(r => ({
                diseaseId: r.diseaseId,
                diseaseName: r.diseaseName,
                matchScore: r.matchScore
            })),
            photoPath: req.file ? `/uploads/${req.file.filename}` : null
        });
        await diagnosisLog.save();

        // Build response
        const responseData = {
            message: aiMatched
                ? 'Diagnosis complete using AI Vision.'
                : isPhotoOnlyRequest
                    ? 'AI vision unavailable — showing common diseases for your animal type.'
                    : 'Diagnosis complete.',
            isAiAssisted: aiMatched,
            aiRawData: aiAnalysis,
            results: results.map(r => {
                const disease = r.disease || {};
                return {
                    ...disease,
                    confidence: Math.round(r.matchScore * 100),
                    matchScore: r.matchScore,
                    isAiMatch: r.isAiMatch,
                    aiMatch: r.isAiMatch,
                    matchedViaAI: r.isAiMatch,
                    isSuggestion: r.isSuggestion || false,
                    aiAnalysis: aiAnalysis ? aiAnalysis.analysis_notes : null,
                    matchedSymptoms: disease.symptoms ? disease.symptoms.slice(0, 5) : []
                };
            }),
            diagnosisId: diagnosisLog._id,
            photoUrl: req.file ? `/uploads/${req.file.filename}` : null
        };

        // If AI had an error, include it so the frontend can inform the user
        if (aiError) {
            responseData.aiError = aiError;
        }

        res.json(responseData);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/diagnosis/history
 * Get the current user's diagnosis history.
 */
router.get('/history', auth, async (req, res, next) => {
    try {
        const history = await DiagnosisLog.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('results.diseaseId', 'name animalType');

        res.json({ history });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
