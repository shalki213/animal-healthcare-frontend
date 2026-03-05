const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
    name: { type: String, required: true },
    dosage: { type: String, required: true }
}, { _id: false });

const treatmentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    medicines: [medicineSchema]
}, { _id: false });

const homeRemedySchema = new mongoose.Schema({
    remedy: { type: String, required: true },
    instructions: { type: String, required: true }
}, { _id: false });

const diseaseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Disease name is required'],
        trim: true
    },
    animalType: {
        type: String,
        required: [true, 'Animal type is required'],
        enum: ['cattle', 'sheep', 'goat', 'pig', 'poultry'],
        lowercase: true
    },
    symptoms: [{
        type: String,
        required: true,
        lowercase: true,
        trim: true
    }],
    confidence: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
        default: 0.5
    },
    description: {
        type: String,
        required: true
    },
    prevention: {
        type: String,
        required: true
    },
    treatment: [treatmentSchema],
    homeRemedies: [homeRemedySchema]
}, {
    timestamps: true
});

// Index for efficient symptom search
diseaseSchema.index({ symptoms: 1 });
diseaseSchema.index({ animalType: 1 });

module.exports = mongoose.model('Disease', diseaseSchema);
