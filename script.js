// Main application logic
let isLoggedIn = false;
let currentUser = null;
let uploadedPhoto = null;

// DOM Elements
const loginModal = document.getElementById('loginModal');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const closeBtn = document.querySelector('.close');
const loginForm = document.getElementById('loginForm');
const searchButton = document.getElementById('searchButton');
const symptomInput = document.getElementById('symptomInput');
const resultsContainer = document.getElementById('resultsContainer');
const resultCard = document.getElementById('resultCard');
const suggestionsContainer = document.getElementById('suggestionsContainer');
const diseaseGuideDiv = document.getElementById('diseaseGuide');
const animalTypeSelect = document.getElementById('animalType');
const uploadArea = document.getElementById('uploadArea');
const photoInput = document.getElementById('photoInput');
const photoPreview = document.getElementById('photoPreview');
const previewImage = document.getElementById('previewImage');
const removePhotoBtn = document.getElementById('removePhotoBtn');

// Login functionality
loginBtn.addEventListener('click', () => {
    loginModal.style.display = 'block';
});

closeBtn.addEventListener('click', () => {
    loginModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === loginModal) {
        loginModal.style.display = 'none';
    }
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Simple authentication (in production, use backend authentication)
    if (username && password) {
        isLoggedIn = true;
        currentUser = username;
        loginModal.style.display = 'none';
        updateUI();
        alert(`Welcome, ${username}!`);
    }
});

logoutBtn.addEventListener('click', () => {
    isLoggedIn = false;
    currentUser = null;
    updateUI();
    alert('Logged out successfully');
});

// Update UI based on login status
function updateUI() {
    if (isLoggedIn) {
        loginBtn.classList.add('hidden');
        logoutBtn.classList.remove('hidden');
    } else {
        loginBtn.classList.remove('hidden');
        logoutBtn.classList.add('hidden');
    }
}

// Search and diagnosis functionality
searchButton.addEventListener('click', performSearch);
symptomInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performSearch();
    }
});

function performSearch() {
    const symptoms = symptomInput.value.toLowerCase().trim();
    const selectedAnimal = animalTypeSelect.value;

    if (!symptoms) {
        alert('Please enter at least one symptom');
        return;
    }

    const results = searchDiseases(symptoms, selectedAnimal);
    displayResults(results, symptoms);
}

function searchDiseases(symptomQuery, animalType) {
    const results = [];
    let dataToSearch = [];

    // Get data based on animal type selection
    if (animalType) {
        dataToSearch = diseaseDatabase[animalType] || [];
    } else {
        // Search all animals
        Object.values(diseaseDatabase).forEach(diseases => {
            dataToSearch = dataToSearch.concat(diseases);
        });
    }

    // Search for matching symptoms
    dataToSearch.forEach(disease => {
        const matchCount = disease.symptoms.filter(symptom =>
            symptom.includes(symptomQuery) || symptomQuery.includes(symptom)
        ).length;

        if (matchCount > 0) {
            results.push({
                ...disease,
                matchScore: matchCount / disease.symptoms.length
            });
        }
    });

    // Sort by match score
    return results.sort((a, b) => b.matchScore - a.matchScore);
}

function displayResults(results, symptomQuery) {
    resultsContainer.classList.remove('hidden');
    resultCard.innerHTML = '';

    if (results.length === 0) {
        resultCard.innerHTML = `
            <p style="color: #666;">No diseases found matching the symptoms "${symptomQuery}". 
            Please try different symptoms or consult a veterinarian.</p>
        `;
        return;
    }

    const topResult = results[0];
    resultCard.innerHTML = `
        <h3>🎯 Possible Disease: ${topResult.name}</h3>
        <div class="disease-info">
            <p><strong>Description:</strong> ${topResult.description}</p>
            
            <h4>Matching Symptoms:</h4>
            <ul>
                ${topResult.symptoms.map(s => `<li>${s}</li>`).join('')}
            </ul>
            
            ${topResult.treatment.map(treatmentGroup => `
                <div class="treatment-box">
                    <h5>${treatmentGroup.name}</h5>
                    <div class="medicine-list">
                        ${treatmentGroup.medicines.map(med => `
                            <div class="medicine-item">
                                <div class="medicine-name">${med.name}</div>
                                <div class="medicine-dosage">Dosage: ${med.dosage}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
            
            ${topResult.homemedies ? `
                <div class="treatment-box" style="background-color: #fff9e6; border-left-color: #f39c12;">
                    <h5 style="color: #f39c12;">🌿 Home Remedies</h5>
                    <div class="medicine-list">
                        ${topResult.homemedies.map(remedy => `
                            <div class="medicine-item" style="background-color: #fffbf0;">
                                <div class="medicine-name" style="color: #d68910;">${remedy.remedy}</div>
                                <div class="medicine-dosage">${remedy.instructions}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div class="confidence warning">
                <strong>⚠️ Important:</strong> Confidence level: ${(topResult.confidence * 100).toFixed(0)}%<br>
                This is a diagnostic aid only. Always consult with a licensed veterinarian for proper diagnosis and treatment.
            </div>
            
            <div class="confidence">
                <strong>Prevention:</strong> ${topResult.prevention}
            </div>
        </div>
    `;

    // Display alternative suggestions
    if (results.length > 1) {
        displaySuggestions(results.slice(1));
    }
}

function displaySuggestions(suggestions) {
    suggestionsContainer.innerHTML = '<h3>Other Possible Diseases:</h3>';
    suggestions.forEach(disease => {
        const suggestionDiv = document.createElement('div');
        suggestionDiv.className = 'suggestion-item';
        suggestionDiv.innerHTML = `
            <strong>${disease.name}</strong> (${(disease.confidence * 100).toFixed(0)}% confidence)
        `;
        suggestionDiv.addEventListener('click', () => {
            resultCard.innerHTML = `
                <h3>🎯 Selected Disease: ${disease.name}</h3>
                <div class="disease-info">
                    <p><strong>Description:</strong> ${disease.description}</p>
                    
                    <h4>Matching Symptoms:</h4>
                    <ul>
                        ${disease.symptoms.map(s => `<li>${s}</li>`).join('')}
                    </ul>
                    
                    ${disease.treatment.map(treatmentGroup => `
                        <div class="treatment-box">
                            <h5>${treatmentGroup.name}</h5>
                            <div class="medicine-list">
                                ${treatmentGroup.medicines.map(med => `
                                    <div class="medicine-item">
                                        <div class="medicine-name">${med.name}</div>
                                        <div class="medicine-dosage">Dosage: ${med.dosage}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                    
                    ${disease.homemedies ? `
                        <div class="treatment-box" style="background-color: #fff9e6; border-left-color: #f39c12;">
                            <h5 style="color: #f39c12;">🌿 Home Remedies</h5>
                            <div class="medicine-list">
                                ${disease.homemedies.map(remedy => `
                                    <div class="medicine-item" style="background-color: #fffbf0;">
                                        <div class="medicine-name" style="color: #d68910;">${remedy.remedy}</div>
                                        <div class="medicine-dosage">${remedy.instructions}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="confidence warning">
                        <strong>⚠️ Important:</strong> Confidence level: ${(disease.confidence * 100).toFixed(0)}%<br>
                        This is a diagnostic aid only. Always consult with a licensed veterinarian for proper diagnosis and treatment.
                    </div>
                    
                    <div class="confidence">
                        <strong>Prevention:</strong> ${disease.prevention}
                    </div>
                </div>
            `;
            window.scrollTo(0, resultCard.offsetTop);
        });
        suggestionsContainer.appendChild(suggestionDiv);
    });
}

// Display disease guide on page load
function displayDiseaseGuide() {
    let guideHTML = '';
    Object.entries(diseaseDatabase).forEach(([animalType, diseases]) => {
        guideHTML += `<h3 style="color: #2ecc71; margin-top: 30px; text-transform: capitalize;">${animalType} Diseases</h3>`;
        diseases.forEach(disease => {
            guideHTML += `
                <div class="disease-card">
                    <h3>${disease.name}</h3>
                    <p><strong>Confidence:</strong> ${(disease.confidence * 100).toFixed(0)}%</p>
                    <p><strong>Symptoms:</strong> ${disease.symptoms.join(', ')}</p>
                    <p>${disease.description}</p>
                </div>
            `;
        });
    });
    diseaseGuideDiv.innerHTML = guideHTML;
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    displayDiseaseGuide();
    updateUI();
    setupPhotoUpload();
});

// Photo Upload Functionality
function setupPhotoUpload() {
    // Click to upload
    uploadArea.addEventListener('click', () => {
        photoInput.click();
    });

    // File selection
    photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handlePhotoUpload(file);
        }
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.backgroundColor = '#e8f4f8';
        uploadArea.style.borderColor = 'var(--primary-color)';
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.backgroundColor = '#f8f9fa';
        uploadArea.style.borderColor = 'var(--secondary-color)';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.backgroundColor = '#f8f9fa';
        uploadArea.style.borderColor = 'var(--secondary-color)';
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handlePhotoUpload(file);
        } else {
            alert('Please drop an image file');
        }
    });

    // Remove photo
    removePhotoBtn.addEventListener('click', () => {
        uploadedPhoto = null;
        photoInput.value = '';
        photoPreview.classList.add('hidden');
        uploadArea.classList.remove('hidden');
    });
}

function handlePhotoUpload(file) {
    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        alert('File size must be less than 5MB');
        return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        alert('Please upload a valid image file (PNG, JPG, GIF)');
        return;
    }

    // Read and display image
    const reader = new FileReader();
    reader.onload = (e) => {
        uploadedPhoto = {
            name: file.name,
            data: e.target.result,
            type: file.type,
            size: file.size
        };
        
        previewImage.src = uploadedPhoto.data;
        uploadArea.classList.add('hidden');
        photoPreview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}
