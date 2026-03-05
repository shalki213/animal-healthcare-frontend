/**
 * API Service Layer
 * Centralises all fetch() calls to the backend.
 * Include this script BEFORE script.js and guide-script.js.
 */

// Dynamically determine the API base URL based on where the frontend is hosted
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isLocalhost ? 'http://localhost:5000/api' : '/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getToken() {
    return localStorage.getItem('auth_token');
}

function setToken(token) {
    localStorage.setItem('auth_token', token);
}

function removeToken() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
}

function getStoredUser() {
    const data = localStorage.getItem('auth_user');
    return data ? JSON.parse(data) : null;
}

function setStoredUser(user) {
    localStorage.setItem('auth_user', JSON.stringify(user));
}

async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers = options.headers || {};
    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Don't set Content-Type for FormData (browser sets it with boundary)
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    try {
        const response = await fetch(url, { ...options, headers });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `Request failed with status ${response.status}`);
        }

        return data;
    } catch (error) {
        if (error.message === 'Failed to fetch') {
            throw new Error('Cannot connect to server. Make sure the backend is running.');
        }
        throw error;
    }
}

// ---------------------------------------------------------------------------
// Auth Service
// ---------------------------------------------------------------------------

const AuthService = {
    async register(username, email, password) {
        const data = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });
        setToken(data.token);
        setStoredUser(data.user);
        return data;
    },

    async login(username, password) {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        setToken(data.token);
        setStoredUser(data.user);
        return data;
    },

    async getProfile() {
        const data = await apiRequest('/auth/me');
        setStoredUser(data.user);
        return data;
    },

    logout() {
        removeToken();
    },

    isLoggedIn() {
        return !!getToken();
    },

    getUser() {
        return getStoredUser();
    }
};

// ---------------------------------------------------------------------------
// Disease Service
// ---------------------------------------------------------------------------

const DiseaseService = {
    async getAll(animalType = '') {
        const query = animalType ? `?animalType=${encodeURIComponent(animalType)}` : '';
        const data = await apiRequest(`/diseases${query}`);
        return data.diseases;
    },

    async getById(id) {
        const data = await apiRequest(`/diseases/${id}`);
        return data.disease;
    },

    async search(symptoms, animalType = '') {
        let query = `?symptoms=${encodeURIComponent(symptoms)}`;
        if (animalType) query += `&animalType=${encodeURIComponent(animalType)}`;
        const data = await apiRequest(`/diseases/search${query}`);
        return data.results;
    }
};

// ---------------------------------------------------------------------------
// Diagnosis Service
// ---------------------------------------------------------------------------

const DiagnosisService = {
    async submit(symptoms, animalType, photoFile) {
        const formData = new FormData();
        formData.append('symptoms', symptoms);
        if (animalType) formData.append('animalType', animalType);
        if (photoFile) formData.append('photo', photoFile);

        const data = await apiRequest('/diagnosis', {
            method: 'POST',
            body: formData
        });
        return data;
    },

    async getHistory() {
        const data = await apiRequest('/diagnosis/history');
        return data.history;
    }
};

// ---------------------------------------------------------------------------
// Upload Service
// ---------------------------------------------------------------------------

const UploadService = {
    async uploadPhoto(file) {
        const formData = new FormData();
        formData.append('photo', file);

        const data = await apiRequest('/upload/photo', {
            method: 'POST',
            body: formData
        });
        return data;
    }
};
