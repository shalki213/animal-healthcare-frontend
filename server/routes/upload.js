const express = require('express');
const { auth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

/**
 * POST /api/upload/photo
 * Upload an animal photo (authenticated users only).
 * Returns the photo URL.
 */
router.post('/photo', auth, upload.single('photo'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No photo file uploaded.' });
        }

        const photoUrl = `/uploads/${req.file.filename}`;

        res.json({
            message: 'Photo uploaded successfully.',
            photoUrl,
            filename: req.file.filename,
            size: req.file.size,
            mimetype: req.file.mimetype
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
