const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Startup Environment Checks
if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  WARNING: GEMINI_API_KEY is missing. AI Photo Diagnosis will not work.');
}
if (!process.env.JWT_SECRET) {
    console.warn('⚠️  WARNING: JWT_SECRET is missing. User Signup/Login will fail with secretOrPrivateKey errors.');
}

const { errorHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const diseaseRoutes = require('./routes/diseases');
const diagnosisRoutes = require('./routes/diagnosis');
const uploadRoutes = require('./routes/upload');

const app = express();

// ------------------------------------------------------------------
// Middleware
// ------------------------------------------------------------------

// CORS — allow the frontend origin
app.use(cors({
    origin: '*', // In production, restrict to your domain
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting — 100 requests per 15 min per IP
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Serve uploaded files statically
const uploadDir = path.join(__dirname, process.env.UPLOAD_DIR || 'uploads');
app.use('/uploads', express.static(uploadDir));

// Serve the frontend (parent directory)
app.use(express.static(path.join(__dirname, '..')));

// ------------------------------------------------------------------
// API Routes
// ------------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/diseases', diseaseRoutes);
app.use('/api/diagnosis', diagnosisRoutes);
app.use('/api/upload', uploadRoutes);

// Database Seeding Route (One-time use for production)
app.get('/api/run-seed', async (req, res) => {
    try {
        const seedDatabase = require('./seed');
        const count = await seedDatabase();
        res.json({ message: `Successfully seeded ${count} diseases into MongoDB Atlas!` });
    } catch (error) {
        res.status(500).json({ error: 'Seeding failed', details: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler (must be last)
app.use(errorHandler);

// ------------------------------------------------------------------
// Database & Server Start
// ------------------------------------------------------------------
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/animal-healthcare';

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📁 Frontend served from http://localhost:${PORT}/home.html`);
        });
    })
    .catch(err => {
        console.error('❌ MongoDB connection failed:', err.message);
        console.error('   Make sure MongoDB is running on localhost:27017');
        process.exit(1);
    });

module.exports = app;
