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

    container.innerHTML = `
        <h3>🎯 Possible Disease: ${disease.name}</h3>
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
        const suggestionDiv = document.createElement('div');
        suggestionDiv.className = 'suggestion-item';
        suggestionDiv.innerHTML = `
            <strong>${disease.name}</strong> (${(disease.confidence * 100).toFixed(0)}% confidence)
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

function setupPhotoUpload() {
    if (!uploadArea) return;

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
            showToast('Please drop an image file', 'error');
        }
    });

    // Remove photo
    if (removePhotoBtn) {
        removePhotoBtn.addEventListener('click', () => {
            uploadedPhoto = null;
            uploadedPhotoFile = null;
            photoInput.value = '';
            photoPreview.classList.add('hidden');
            uploadArea.classList.remove('hidden');
        });
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
        uploadArea.classList.add('hidden');
        photoPreview.classList.remove('hidden');
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
