const express = require('express');
const Disease = require('../models/Disease');
const DiagnosisLog = require('../models/DiagnosisLog');
const { auth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

/**
 * POST /api/diagnosis
 * Submit a diagnosis request (authenticated users only).
 * Accepts symptoms, animalType, and optional photo upload.
 */
router.post('/', auth, upload.single('photo'), async (req, res, next) => {
    try {
        const { symptoms, animalType } = req.body;

        if (!symptoms) {
            return res.status(400).json({ error: 'Symptoms are required for diagnosis.' });
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
                    matchScore: matchCount / disease.symptoms.length,
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
            message: 'Diagnosis complete.',
            results: results.map(r => r.disease ? { ...r.disease, matchScore: r.matchScore } : r),
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
