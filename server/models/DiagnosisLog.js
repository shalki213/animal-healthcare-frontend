const mongoose = require('mongoose');

const diagnosisResultSchema = new mongoose.Schema({
    diseaseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Disease',
        required: false // Made optional so AI-generated diseases without a DB footprint can be saved
    },
    diseaseName: { type: String },
    matchScore: { type: Number }
}, { _id: false });

const diagnosisLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    symptoms: {
        type: String,
        required: [true, 'Symptoms are required']
    },
    animalType: {
        type: String,
        enum: ['', 'cattle', 'sheep', 'goat', 'pig', 'poultry'],
        default: ''
    },
    results: [diagnosisResultSchema],
    photoPath: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Index for user history queries
diagnosisLogSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('DiagnosisLog', diagnosisLogSchema);
