const express = require('express');
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
const Disease = require('../models/Disease');
const DiagnosisLog = require('../models/DiagnosisLog');
const { auth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const router = express.Router();

/**
 * POST /api/diagnosis
 * Submit a diagnosis request (authenticated users only).
 * Accepts symptoms, animalType, and optional photo upload.
 */
router.post('/', auth, upload.single('photo'), async (req, res, next) => {
    try {
        let { symptoms, animalType } = req.body;
        let aiAnalysis = null;
        let aiMatched = false;

        // If a photo was uploaded, use Gemini Vision to analyze it
        if (req.file && process.env.GEMINI_API_KEY) {
            try {
                // Read the image file and convert to base64
                const imagePath = path.join(__dirname, '..', 'uploads', req.file.filename);
                const imageBuffer = fs.readFileSync(imagePath);

                const prompt = `You are an expert veterinary AI. Analyze this image of a ${animalType || 'farm animal'}.
                1. What visible symptoms or physical abnormalities do you see?
                2. What is the most likely disease or condition?
                
                Return ONLY a valid JSON object with this exact structure:
                {
                    "symptoms": ["list", "of", "comma", "separated", "symptoms"],
                    "suspected_disease": "Name of the disease",
                    "confidence": 0.85
                }`;

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

                aiAnalysis = JSON.parse(response.text);

                // Merge AI symptoms with user-provided symptoms
                const mergedSymptoms = new Set([
                    ...(symptoms ? symptoms.toLowerCase().split(',').map(s => s.trim()) : []),
                    ...(aiAnalysis.symptoms ? aiAnalysis.symptoms.map(s => s.toLowerCase().trim()) : [])
                ]);

                symptoms = Array.from(mergedSymptoms).filter(Boolean).join(', ');
                aiMatched = true;

            } catch (aiError) {
                console.error("Gemini AI Analysis failed:", aiError);
                // Continue with just text search if AI fails
            }
        }

        if (!symptoms) {
            return res.status(400).json({ error: 'Symptoms are required for diagnosis (either typed or via photo).' });
        }

        // Parse symptoms
        const symptomList = symptoms.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);

        // Build query
        const filter = {};
        if (animalType) {
            filter.animalType = animalType.toLowerCase();
        }

        const allDiseases = await Disease.find(filter);

        // Score each disease
        const results = [];
        allDiseases.forEach(disease => {
            let matchCount = 0;
            let isAiExactMatch = false;

            // Check if Gemini exactly matched this disease name
            if (aiAnalysis && aiAnalysis.suspected_disease &&
                disease.name.toLowerCase().includes(aiAnalysis.suspected_disease.toLowerCase())) {
                isAiExactMatch = true;
                matchCount += 5; // Heavy weight for AI exact matches
            }

            symptomList.forEach(querySymptom => {
                const hasMatch = disease.symptoms.some(diseaseSymptom =>
                    diseaseSymptom.includes(querySymptom) || querySymptom.includes(diseaseSymptom)
                );
                if (hasMatch) matchCount++;
            });

            if (matchCount > 0) {
                results.push({
                    diseaseId: disease._id,
                    diseaseName: disease.name,
                    matchScore: Math.min(1, matchCount / disease.symptoms.length), // Cap at 1.0
                    isAiMatch: isAiExactMatch,
                    disease: disease.toObject()
                });
            }
        });

        // Sort by match score
        results.sort((a, b) => b.matchScore - a.matchScore);

        // Save diagnosis log
        const diagnosisLog = new DiagnosisLog({
            user: req.user._id,
            symptoms,
            animalType: animalType || '',
            results: results.map(r => ({
                diseaseId: r.diseaseId,
                diseaseName: r.diseaseName,
                matchScore: r.matchScore
            })),
            photoPath: req.file ? `/uploads/${req.file.filename}` : null
        });
        await diagnosisLog.save();

        res.json({
            message: aiMatched ? 'Diagnosis complete using AI Vision.' : 'Diagnosis complete.',
            isAiAssisted: aiMatched,
            aiRawData: aiAnalysis,
            results: results.map(r => r.disease ? {
                ...r.disease,
                matchScore: r.matchScore,
                isAiMatch: r.isAiMatch
            } : r),
            diagnosisId: diagnosisLog._id,
            photoUrl: req.file ? `/uploads/${req.file.filename}` : null
        });
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
