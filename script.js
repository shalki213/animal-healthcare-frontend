// Main application logic — wired to backend APIs
let isLoggedIn = AuthService.isLoggedIn();
let currentUser = AuthService.getUser();
let uploadedPhoto = null;
let uploadedPhotoFile = null; // Keep the raw File object for API upload

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
const animalTypeSelect = document.getElementById('animalType');
const uploadArea = document.getElementById('uploadArea');
const photoInput = document.getElementById('photoInput');
const photoPreview = document.getElementById('photoPreview');
const previewImage = document.getElementById('previewImage');
const removePhotoBtn = document.getElementById('removePhotoBtn');

// Dropdown Menu Functionality
const dropdownBtn = document.querySelector('.dropdown-btn');
const dropdown = document.querySelector('.dropdown');

if (dropdownBtn) {
    dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('active');
    });

    const dropdownLinks = document.querySelectorAll('.dropdown-content a');
    dropdownLinks.forEach(link => {
        link.addEventListener('click', () => {
            dropdown.classList.remove('active');
        });
    });

    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
}

// ---------------------------------------------------------------------------
// Login / Register Modal
// ---------------------------------------------------------------------------

if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        showLoginForm();
        loginModal.style.display = 'block';
    });
}

if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        loginModal.style.display = 'none';
    });
}

window.addEventListener('click', (event) => {
    if (event.target === loginModal) {
        loginModal.style.display = 'none';
    }
});

// Handle login form submission
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;

        // Check if we're in signup mode
        const isSignup = submitBtn.textContent === 'Create Account';

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = isSignup ? 'Creating account...' : 'Logging in...';

            if (isSignup) {
                const username = document.getElementById('username').value;
                const email = document.getElementById('signupEmail').value;
                const password = document.getElementById('password').value;
                const data = await AuthService.register(username, email, password);
                isLoggedIn = true;
                currentUser = data.user;
                loginModal.style.display = 'none';
                updateUI();
                showToast(`Welcome, ${data.user.username}! Account created successfully.`, 'success');
            } else {
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                const data = await AuthService.login(username, password);
                isLoggedIn = true;
                currentUser = data.user;
                loginModal.style.display = 'none';
                updateUI();
                showToast(`Welcome back, ${data.user.username}!`, 'success');
            }
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

// Toggle between login and signup forms
const toggleSignupLink = document.querySelector('.toggle-signup a');
if (toggleSignupLink) {
    toggleSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        const formTitle = loginModal.querySelector('h2');

        if (formTitle.textContent === 'Farmer Login') {
            showSignupForm();
        } else {
            showLoginForm();
        }
    });
}

function showLoginForm() {
    const formTitle = loginModal.querySelector('h2');
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const toggleText = document.querySelector('.toggle-signup');

    formTitle.textContent = 'Farmer Login';
    submitBtn.textContent = 'Login';
    toggleText.innerHTML = 'Don\'t have an account? <a href="#signup">Sign up here</a>';

    // Remove email field if it exists
    const emailField = document.getElementById('signupEmail');
    if (emailField) emailField.remove();

    // Re-attach toggle listener
    reattachToggleListener();
}

function showSignupForm() {
    const formTitle = loginModal.querySelector('h2');
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const toggleText = document.querySelector('.toggle-signup');
    const passwordField = document.getElementById('password');

    formTitle.textContent = 'Create Account';
    submitBtn.textContent = 'Create Account';
    toggleText.innerHTML = 'Already have an account? <a href="#login">Login here</a>';

    // Add email field before password if not present
    if (!document.getElementById('signupEmail')) {
        const emailInput = document.createElement('input');
        emailInput.type = 'email';
        emailInput.id = 'signupEmail';
        emailInput.placeholder = 'Email';
        emailInput.required = true;
        passwordField.parentNode.insertBefore(emailInput, passwordField);
    }

    // Re-attach toggle listener
    reattachToggleListener();
}

function reattachToggleListener() {
    const newToggleLink = document.querySelector('.toggle-signup a');
    if (newToggleLink) {
        newToggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            const formTitle = loginModal.querySelector('h2');
            if (formTitle.textContent === 'Farmer Login') {
                showSignupForm();
            } else {
                showLoginForm();
            }
        });
    }
}

// Logout
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        AuthService.logout();
        isLoggedIn = false;
        currentUser = null;
        updateUI();
        showToast('Logged out successfully', 'success');
    });
}

// Update UI based on login status
function updateUI() {
    if (loginBtn && logoutBtn) {
        if (isLoggedIn) {
            loginBtn.classList.add('hidden');
            logoutBtn.classList.remove('hidden');
            logoutBtn.textContent = `Logout (${currentUser?.username || 'User'})`;
        } else {
            loginBtn.classList.remove('hidden');
            logoutBtn.classList.add('hidden');
            logoutBtn.textContent = 'Logout';
        }
    }
}

// ---------------------------------------------------------------------------
// Toast notifications (replaces alert() calls)
// ---------------------------------------------------------------------------

function showToast(message, type = 'info') {
    // Remove existing toasts
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Auto-dismiss
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ---------------------------------------------------------------------------
// Search and diagnosis functionality
// ---------------------------------------------------------------------------

if (searchButton) {
    searchButton.addEventListener('click', performSearch);
}
if (symptomInput) {
    symptomInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
}

async function performSearch() {
    const symptoms = symptomInput.value.toLowerCase().trim();
    const selectedAnimal = animalTypeSelect ? animalTypeSelect.value : '';

    if (!symptoms) {
        showToast('Please enter at least one symptom', 'error');
        return;
    }

    // Show loading state
    searchButton.disabled = true;
    searchButton.textContent = 'Searching...';
    resultsContainer.classList.remove('hidden');
    resultCard.innerHTML = '<p style="text-align:center; color:#666;">🔍 Searching diseases...</p>';

    try {
        // If user is logged in, use the diagnosis endpoint (saves history + supports photo)
        if (isLoggedIn && uploadedPhotoFile) {
            const data = await DiagnosisService.submit(symptoms, selectedAnimal, uploadedPhotoFile);
            displayResults(data.results, symptoms);
        } else {
            // Use the public search endpoint
            const results = await DiseaseService.search(symptoms, selectedAnimal);
            displayResults(results, symptoms);
        }
    } catch (error) {
        resultCard.innerHTML = `<p style="color: #e74c3c;">${error.message}</p>`;
        showToast(error.message, 'error');
    } finally {
        searchButton.disabled = false;
        searchButton.textContent = 'Search Symptoms';
    }
}

function displayResults(results, symptomQuery) {
    resultsContainer.classList.remove('hidden');
    resultCard.innerHTML = '';

    if (!results || results.length === 0) {
        resultCard.innerHTML = `
            <p style="color: #666;">No diseases found matching the symptoms "${symptomQuery}". 
            Please try different symptoms or consult a veterinarian.</p>
        `;
        return;
    }

    const topResult = results[0];
    renderDiseaseDetail(topResult, resultCard);

    // Display alternative suggestions
    if (results.length > 1) {
        displaySuggestions(results.slice(1));
    } else if (suggestionsContainer) {
        suggestionsContainer.innerHTML = '';
    }
}

function renderDiseaseDetail(disease, container) {
    // Normalize field names: API may return homeRemedies, original DB uses homemedies
    const remedies = disease.homeRemedies || disease.homemedies || [];

    // Add AI badge if this was matched via Gemini
    const badgeHTML = disease.isAiMatch ?
        `<span style="background: linear-gradient(135deg, #a8c0ff, #3f2b96); color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; margin-left: 10px; vertical-align: middle;">✨ AI Vision Match</span>`
        : '';

    container.innerHTML = `
        <h3>🎯 Possible Disease: ${disease.name} ${badgeHTML}</h3>
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
            
            ${remedies.length > 0 ? `
                <div class="treatment-box" style="background-color: #fff9e6; border-left-color: #f39c12;">
                    <h5 style="color: #f39c12;">🌿 Home Remedies</h5>
                    <div class="medicine-list">
                        ${remedies.map(remedy => `
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
}

function displaySuggestions(suggestions) {
    if (!suggestionsContainer) return;
    suggestionsContainer.innerHTML = '<h3>Other Possible Diseases:</h3>';

    suggestions.forEach(disease => {
        const aiBadge = disease.isAiMatch ? ' <span style="font-size: 10px; color: #3f2b96; font-weight: bold;">✨ AI</span>' : '';
        const suggestionDiv = document.createElement('div');
        suggestionDiv.className = 'suggestion-item';
        suggestionDiv.innerHTML = `
            <strong>${disease.name}</strong> (${(disease.confidence * 100).toFixed(0)}% confidence)${aiBadge}
        `;
        suggestionDiv.addEventListener('click', () => {
            renderDiseaseDetail(disease, resultCard);
            window.scrollTo(0, resultCard.offsetTop);
        });
        suggestionsContainer.appendChild(suggestionDiv);
    });
}

// ---------------------------------------------------------------------------
// Photo Upload Functionality
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Photo Upload + Camera Capture (Enhanced)
// ---------------------------------------------------------------------------

let cameraStream = null;
let facingMode = 'environment'; // Start with rear camera (for animals)

function setupPhotoUpload() {
    // --- Tab Switching ---
    const cameraTabBtn = document.getElementById('cameraTabBtn');
    const uploadTabBtn = document.getElementById('uploadTabBtn');
    const cameraTab = document.getElementById('cameraTab');
    const uploadTab = document.getElementById('uploadTab');

    if (!uploadArea && !cameraTabBtn) return;

    if (cameraTabBtn && uploadTabBtn) {
        cameraTabBtn.addEventListener('click', () => {
            cameraTabBtn.classList.add('active');
            uploadTabBtn.classList.remove('active');
            cameraTab.classList.add('active');
            uploadTab.classList.remove('active');
        });

        uploadTabBtn.addEventListener('click', () => {
            uploadTabBtn.classList.add('active');
            cameraTabBtn.classList.remove('active');
            uploadTab.classList.add('active');
            cameraTab.classList.remove('active');
            // Stop camera if it's running when switching tabs
            stopCamera();
        });
    }

    // --- Camera Controls ---
    const startCameraBtn = document.getElementById('startCameraBtn');
    const captureBtn = document.getElementById('captureBtn');
    const switchCameraBtn = document.getElementById('switchCameraBtn');
    const stopCameraBtn = document.getElementById('stopCameraBtn');
    const cameraFeed = document.getElementById('cameraFeed');
    const captureCanvas = document.getElementById('captureCanvas');
    const cameraOverlay = document.querySelector('.camera-overlay');

    if (startCameraBtn) {
        startCameraBtn.addEventListener('click', async () => {
            try {
                await startCamera();
                startCameraBtn.classList.add('hidden');
                captureBtn.classList.remove('hidden');
                switchCameraBtn.classList.remove('hidden');
                stopCameraBtn.classList.remove('hidden');
                if (cameraOverlay) cameraOverlay.classList.add('hidden');
                showToast('Camera ready — point at your animal', 'success');
            } catch (err) {
                console.error('Camera error:', err);
                if (err.name === 'NotAllowedError') {
                    showToast('Camera permission denied. Please allow camera access in your browser settings.', 'error');
                } else if (err.name === 'NotFoundError') {
                    showToast('No camera found on this device. Use the Upload tab instead.', 'error');
                } else {
                    showToast('Could not open camera. Try the Upload tab instead.', 'error');
                }
            }
        });
    }

    if (captureBtn) {
        captureBtn.addEventListener('click', () => {
            if (!cameraFeed || !cameraFeed.srcObject) return;

            // Draw video frame to canvas
            captureCanvas.width = cameraFeed.videoWidth;
            captureCanvas.height = cameraFeed.videoHeight;
            const ctx = captureCanvas.getContext('2d');
            ctx.drawImage(cameraFeed, 0, 0);

            // Convert to blob → File
            captureCanvas.toBlob((blob) => {
                if (!blob) return;
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const file = new File([blob], `animal-photo-${timestamp}.jpg`, { type: 'image/jpeg' });
                handlePhotoUpload(file);
                stopCamera();
                showToast('📸 Photo captured! Hit Search to analyze.', 'success');
            }, 'image/jpeg', 0.9);
        });
    }

    if (switchCameraBtn) {
        switchCameraBtn.addEventListener('click', async () => {
            facingMode = facingMode === 'environment' ? 'user' : 'environment';
            stopCamera();
            try {
                await startCamera();
            } catch (err) {
                showToast('Could not switch camera', 'error');
            }
        });
    }

    if (stopCameraBtn) {
        stopCameraBtn.addEventListener('click', () => {
            stopCamera();
            startCameraBtn.classList.remove('hidden');
            captureBtn.classList.add('hidden');
            switchCameraBtn.classList.add('hidden');
            stopCameraBtn.classList.add('hidden');
            if (cameraOverlay) cameraOverlay.classList.remove('hidden');
        });
    }

    // --- File Upload (Upload Tab) ---
    if (uploadArea) {
        uploadArea.addEventListener('click', () => {
            photoInput.click();
        });
    }

    if (photoInput) {
        photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                handlePhotoUpload(file);
            }
        });
    }

    // Drag and drop
    if (uploadArea) {
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#2ecc71';
            uploadArea.style.backgroundColor = 'rgba(46, 204, 113, 0.08)';
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = '';
            uploadArea.style.backgroundColor = '';
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '';
            uploadArea.style.backgroundColor = '';
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                handlePhotoUpload(file);
            } else {
                showToast('Please drop an image file', 'error');
            }
        });
    }

    // Remove photo
    if (removePhotoBtn) {
        removePhotoBtn.addEventListener('click', () => {
            uploadedPhoto = null;
            uploadedPhotoFile = null;
            if (photoInput) photoInput.value = '';
            photoPreview.classList.add('hidden');
            if (uploadArea) uploadArea.classList.remove('hidden');

            // Restore tabs visibility
            const photoTabs = document.getElementById('photoTabs');
            const cameraTab = document.getElementById('cameraTab');
            const uploadTab = document.getElementById('uploadTab');
            const cameraTabBtn = document.getElementById('cameraTabBtn');
            const uploadTabBtn = document.getElementById('uploadTabBtn');
            if (photoTabs) photoTabs.classList.remove('hidden');
            // Restore the previously active tab
            if (cameraTabBtn && cameraTabBtn.classList.contains('active')) {
                if (cameraTab) cameraTab.classList.remove('hidden');
            } else if (uploadTabBtn && uploadTabBtn.classList.contains('active')) {
                if (uploadTab) uploadTab.classList.remove('hidden');
            }

            // Also clear any AI scan results
            const aiScanResults = document.getElementById('aiScanResults');
            if (aiScanResults) aiScanResults.classList.add('hidden');
        });
    }

    // --- AI Analyze Photo Button ---
    const analyzePhotoBtn = document.getElementById('analyzePhotoBtn');
    if (analyzePhotoBtn) {
        analyzePhotoBtn.addEventListener('click', async () => {
            if (!uploadedPhotoFile) {
                showToast('No photo to analyze', 'error');
                return;
            }

            if (!isLoggedIn) {
                showToast('Please login to use AI photo analysis', 'error');
                return;
            }

            const aiScanResults = document.getElementById('aiScanResults');
            const scanProgress = document.getElementById('scanProgress');
            const scanResultContent = document.getElementById('scanResultContent');

            // Show scanning animation
            aiScanResults.classList.remove('hidden');
            scanProgress.classList.remove('hidden');
            scanResultContent.innerHTML = '';
            analyzePhotoBtn.disabled = true;
            analyzePhotoBtn.textContent = '⏳ Scanning...';

            try {
                const selectedAnimal = animalTypeSelect ? animalTypeSelect.value : '';
                const data = await DiagnosisService.submit(
                    'photo analysis visual inspection',
                    selectedAnimal,
                    uploadedPhotoFile
                );

                // Hide progress
                scanProgress.classList.add('hidden');

                // Display AI results
                const results = data.results || [];
                if (results.length === 0) {
                    scanResultContent.innerHTML = `
                        <div class="scan-result-card">
                            <h4>🤔 No Match Found</h4>
                            <p>The AI could not confidently identify a disease from this photo. Try:</p>
                            <ul>
                                <li>Taking a clearer photo with better lighting</li>
                                <li>Focusing on the affected area</li>
                                <li>Also entering symptoms manually above</li>
                            </ul>
                        </div>
                    `;
                } else {
                    let html = '<h4 class="scan-results-title">🔬 AI Scan Results</h4>';
                    results.forEach((result, index) => {
                        const isAiMatch = result.aiMatch || result.matchedViaAI;
                        const confidenceColor = result.confidence >= 70 ? '#2ecc71' : result.confidence >= 40 ? '#f39c12' : '#e74c3c';

                        html += `
                            <div class="scan-result-card ${index === 0 ? 'top-result' : ''}">
                                ${index === 0 ? '<span class="top-badge">🏆 Best Match</span>' : ''}
                                ${isAiMatch ? '<span class="ai-badge">🤖 AI Vision Match</span>' : ''}
                                <h4>${result.disease || result.name}</h4>
                                <div class="confidence-bar">
                                    <div class="confidence-fill" style="width: ${result.confidence}%; background: ${confidenceColor}"></div>
                                    <span class="confidence-text">${result.confidence}% confidence</span>
                                </div>
                                ${result.aiAnalysis ? `<p class="ai-analysis"><strong>AI Notes:</strong> ${result.aiAnalysis}</p>` : ''}
                                <p class="scan-symptoms"><strong>Key Symptoms:</strong> ${(result.symptoms || result.matchedSymptoms || []).join(', ')}</p>
                                ${result.description ? `<p class="scan-description">${result.description}</p>` : ''}
                                ${(result.treatment && result.treatment.length > 0) ? `
                                    <div class="scan-treatment">
                                        <h5>💊 Recommended Treatment</h5>
                                        ${result.treatment.map(t => `
                                            <div class="treatment-item">
                                                <strong>${t.name || t.type}</strong>
                                                ${t.medicines ? t.medicines.map(m => `<p>• ${m.name} — ${m.dosage}</p>`).join('') : ''}
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : ''}
                                ${(result.homeRemedies && result.homeRemedies.length > 0) ? `
                                    <div class="scan-remedies">
                                        <h5>🌿 Home Remedies</h5>
                                        <ul>${result.homeRemedies.map(r => `<li>${typeof r === 'string' ? r : r.remedy || r.name}</li>`).join('')}</ul>
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    });
                    scanResultContent.innerHTML = html;
                }

                showToast('✅ Photo analysis complete!', 'success');
            } catch (error) {
                scanProgress.classList.add('hidden');
                scanResultContent.innerHTML = `
                    <div class="scan-result-card scan-error">
                        <h4>❌ Analysis Failed</h4>
                        <p>${error.message}</p>
                        <p>Try entering symptoms manually above instead.</p>
                    </div>
                `;
                showToast(error.message, 'error');
            } finally {
                analyzePhotoBtn.disabled = false;
                analyzePhotoBtn.textContent = '🔬 Analyze Photo with AI';
            }
        });
    }
}

async function startCamera() {
    const cameraFeed = document.getElementById('cameraFeed');
    if (!cameraFeed) return;

    const constraints = {
        video: {
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
        }
    };

    cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
    cameraFeed.srcObject = cameraStream;
    cameraFeed.style.display = 'block';
}

function stopCamera() {
    const cameraFeed = document.getElementById('cameraFeed');
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    if (cameraFeed) {
        cameraFeed.srcObject = null;
        cameraFeed.style.display = 'none';
    }
}

function handlePhotoUpload(file) {
    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        showToast('File size must be less than 5MB', 'error');
        return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        showToast('Please upload a valid image file (PNG, JPG, GIF)', 'error');
        return;
    }

    // Save the raw File object for API upload
    uploadedPhotoFile = file;

    // Read and display image preview
    const reader = new FileReader();
    reader.onload = (e) => {
        uploadedPhoto = {
            name: file.name,
            data: e.target.result,
            type: file.type,
            size: file.size
        };

        previewImage.src = uploadedPhoto.data;
        if (uploadArea) uploadArea.classList.add('hidden');
        photoPreview.classList.remove('hidden');

        // Hide tabs and tab content so preview replaces them visually
        const photoTabs = document.getElementById('photoTabs');
        const cameraTab = document.getElementById('cameraTab');
        const uploadTab = document.getElementById('uploadTab');
        if (photoTabs) photoTabs.classList.add('hidden');
        if (cameraTab) cameraTab.classList.add('hidden');
        if (uploadTab) uploadTab.classList.add('hidden');
    };
    reader.readAsDataURL(file);
}

// ---------------------------------------------------------------------------
// Restore session on page load
// ---------------------------------------------------------------------------

window.addEventListener('DOMContentLoaded', async () => {
    // Restore login state from localStorage
    if (AuthService.isLoggedIn()) {
        isLoggedIn = true;
        currentUser = AuthService.getUser();

        // Verify token is still valid
        try {
            const data = await AuthService.getProfile();
            currentUser = data.user;
        } catch (error) {
            // Token expired or invalid — log out
            AuthService.logout();
            isLoggedIn = false;
            currentUser = null;
        }
    }

    updateUI();
    setupPhotoUpload();
});
