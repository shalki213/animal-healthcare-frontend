const express = require('express');
const Disease = require('../models/Disease');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/diseases
 * List all diseases. Optionally filter by animalType query param.
 */
router.get('/', async (req, res, next) => {
    try {
        const { animalType } = req.query;
        const filter = {};

        if (animalType) {
            filter.animalType = animalType.toLowerCase();
        }

        const diseases = await Disease.find(filter).sort({ animalType: 1, name: 1 });
        res.json({ diseases });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/diseases/search
 * Search diseases by symptoms. Optionally filter by animalType.
 * Query params: symptoms (comma-separated), animalType (optional)
 */
router.get('/search', async (req, res, next) => {
    try {
        const { symptoms, animalType } = req.query;

        if (!symptoms) {
            return res.status(400).json({ error: 'Please provide symptoms to search.' });
        }

        // Parse symptoms into array
        const symptomList = symptoms.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);

        // Build query
        const filter = {};
        if (animalType) {
            filter.animalType = animalType.toLowerCase();
        }

        const allDiseases = await Disease.find(filter);

        // Score each disease by how many symptoms match
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
                    ...disease.toObject(),
                    matchScore: matchCount / disease.symptoms.length
                });
            }
        });

        // Sort by match score (highest first)
        results.sort((a, b) => b.matchScore - a.matchScore);

        res.json({ results });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/diseases/:id
 * Get a single disease by ID.
 */
router.get('/:id', async (req, res, next) => {
    try {
        const disease = await Disease.findById(req.params.id);
        if (!disease) {
            return res.status(404).json({ error: 'Disease not found.' });
        }
        res.json({ disease });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/diseases
 * Add a new disease (admin only).
 */
router.post('/', auth, requireRole('admin'), async (req, res, next) => {
    try {
        const disease = new Disease(req.body);
        await disease.save();
        res.status(201).json({
            message: 'Disease added successfully.',
            disease
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
