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
        const isSignup = submitBtn.getAttribute('data-i18n') === 'btn_signup';

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
        const lang = document.querySelector('.lang-btn.active')?.dataset.lang || 'en';

        // Check if currently showing Login (in either language)
        if (formTitle.getAttribute('data-i18n') === 'login_title' || formTitle.textContent === 'Farmer Login') {
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
    const lang = document.querySelector('.lang-btn.active')?.dataset.lang || 'en';

    formTitle.setAttribute('data-i18n', 'login_title');
    formTitle.textContent = translations[lang]['login_title'];

    submitBtn.setAttribute('data-i18n', 'btn_login');
    submitBtn.textContent = translations[lang]['btn_login'];

    toggleText.innerHTML = `<span data-i18n="txt_no_account">${translations[lang]['txt_no_account']}</span> <a href="#signup" data-i18n="link_signup">${translations[lang]['link_signup']}</a>`;

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
    const lang = document.querySelector('.lang-btn.active')?.dataset.lang || 'en';

    formTitle.setAttribute('data-i18n', 'signup_title');
    formTitle.textContent = translations[lang]['signup_title'];

    submitBtn.setAttribute('data-i18n', 'btn_signup');
    submitBtn.textContent = translations[lang]['btn_signup'];

    toggleText.innerHTML = `<span data-i18n="txt_has_account">${translations[lang]['txt_has_account']}</span> <a href="#login" data-i18n="link_login">${translations[lang]['link_login']}</a>`;

    // Add email field before password if not present
    if (!document.getElementById('signupEmail')) {
        const emailInput = document.createElement('input');
        emailInput.type = 'email';
        emailInput.id = 'signupEmail';
        emailInput.placeholder = translations[lang]['ph_email'] || 'Email Address';
        emailInput.setAttribute('data-i18n-placeholder', 'ph_email');
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
            if (formTitle.getAttribute('data-i18n') === 'login_title' || formTitle.textContent === 'Farmer Login') {
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
// Farmer UX Features - Phase 6
// ---------------------------------------------------------------------------

// 1. Quick Disease Chips
const symptomChips = document.querySelectorAll('.symptom-chip');
symptomChips.forEach(chip => {
    chip.addEventListener('click', () => {
        const disease = chip.getAttribute('data-symptom');

        // Deselect others and select this one visually
        symptomChips.forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');

        // Set the input value to the exact disease name
        if (symptomInput) {
            symptomInput.value = disease;

            // Scroll to search input if needed and trigger search
            symptomInput.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Trigger automatic search
            setTimeout(() => {
                if (typeof performSearch === 'function') {
                    performSearch();
                }
            }, 300);
        }
    });
});

// 2. Voice Input (Web Speech API)
const voiceInputBtn = document.getElementById('voiceInputBtn');
const voiceStatus = document.getElementById('voiceStatus');
let recognition = null;

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    // Set language based on toggle
    recognition.lang = document.querySelector('.lang-btn.active')?.dataset.lang === 'sw' ? 'sw-KE' : 'en-US';

    recognition.onstart = function () {
        voiceInputBtn.classList.add('recording');
        voiceStatus.classList.remove('hidden');
    };

    recognition.onresult = function (event) {
        const transcript = event.results[0][0].transcript;
        const currentVal = symptomInput.value.trim();
        symptomInput.value = currentVal ? `${currentVal}, ${transcript}` : transcript;
        showToast('🎙️ Symptom recognized: ' + transcript, 'success');

        // Auto-search if we got a good transcript
        setTimeout(performSearch, 500);
    };

    recognition.onerror = function (event) {
        console.error('Speech recognition error', event.error);
        showToast('Microphone error: ' + event.error, 'error');
        voiceInputBtn.classList.remove('recording');
        voiceStatus.classList.add('hidden');
    };

    recognition.onend = function () {
        voiceInputBtn.classList.remove('recording');
        voiceStatus.classList.add('hidden');
    };

    if (voiceInputBtn) {
        voiceInputBtn.addEventListener('click', () => {
            if (voiceInputBtn.classList.contains('recording')) {
                recognition.stop();
            } else {
                recognition.lang = document.querySelector('.lang-btn.active').dataset.lang === 'sw' ? 'sw-KE' : 'en-US';
                recognition.start();
            }
        });
    }
} else {
    // Hide mic button if not supported by browser
    if (voiceInputBtn) voiceInputBtn.style.display = 'none';
}

// 3. Language Toggle (English / Swahili)
// Very basic dictionary for demo purposes
const translations = {
    'en': {
        // Nav & Auth
        'login_title': 'Farmer Login',
        'ph_username': 'Username',
        'ph_password': 'Password',
        'btn_login': 'Login',
        'txt_no_account': 'Don\'t have an account?',
        'link_signup': 'Sign up here',
        'logo_sub': 'Empowering Farmers through Early Detection',
        'btn_menu': '☰ Menu',
        'nav_home': 'Home',
        'nav_diagnosis': 'Diagnosis',
        'nav_guide': 'Disease Guide',
        'btn_nav_login': 'Login',
        'btn_nav_logout': 'Logout',
        // Signup Forms
        'signup_title': 'Create Account',
        'btn_signup': 'Sign Up',
        'txt_has_account': 'Already have an account?',
        'link_login': 'Login here',
        'ph_email': 'Email Address',
        // Search & Symptoms
        'search_title': '🔍 Search for Disease Diagnosis',
        'search_subtitle': 'Type your animal\'s symptoms below — or tap the common diseases',
        'search_placeholder': 'E.g., cough, fever, diarrhea, loss of appetite...',
        'search_btn': 'Search Symptoms',
        'listening': 'Listening... speak now',
        'quick_symptoms_title': '⚡ Select a Common Disease:',
        'sym_fmd': 'Foot and Mouth Disease',
        'sym_mastitis': 'Mastitis',
        'sym_pneumonia': 'Bovine Pneumonia',
        'sym_blackleg': 'Blackleg',
        'sym_orf': 'Orf (Sore Mouth)',
        'sym_swine': 'Swine Dysentery',
        'sym_newcastle': 'Newcastle Disease',
        'sym_coccidiosis': 'Coccidiosis',
        'animal_type': '🐄 Animal Type:',
        'all_animals': 'All Animals',
        // Photo & AI
        'photo_ai_title': '📸 AI Photo Diagnosis',
        'photo_ai_desc': 'Take a photo or upload one — our AI will analyze it for disease symptoms',
        'tab_camera': 'Take Photo',
        'tab_upload': 'Upload File',
        'camera_point': 'Point your camera at the sick animal',
        'cam_open': 'Open Camera',
        'cam_capture': 'Capture Photo',
        'cam_flip': 'Flip',
        'cam_close': 'Close',
        'upload_tap': 'Tap here to choose a file',
        'upload_hint': 'PNG, JPG, GIF up to 5MB',
        'btn_analyze': 'Analyze Photo with AI',
        'btn_remove': 'Remove',
        'photo_ready': '✅ Photo ready — tap Analyze to scan',
        'scan_analyzing': '🔬 AI is analyzing your photo...',
        'scan_wait': 'This may take a few seconds',
        'photo_tips_title': '💡 Tips for a Good Photo',
        'tip_close_strong': 'Get close',
        'tip_close_text': '— focus on the affected area (swelling, wound, eyes)',
        'tip_lighting_strong': 'Good lighting',
        'tip_lighting_text': '— natural daylight works best',
        'tip_steady_strong': 'Hold steady',
        'tip_steady_text': '— avoid blurry photos for better AI results',
        'tip_angles_strong': 'Multiple angles',
        'tip_angles_text': '— take photos from different sides if possible',
        // History & Actions
        'save_share': 'Save or Share Report',
        'print_report': 'Print Report',
        'share_whatsapp': 'Share to Vet (WhatsApp)',
        'history_title': '🕒 My Past Diagnoses',
        'emergency_title': 'Animal Emergency?',
        'emergency_desc': 'If your animal is in critical condition, contact a vet immediately',
        'call_vet': 'Call Vet',
        // Home Page
        'hero_title': 'Is Your Animal Sick?',
        'hero_subtitle': 'Get an instant diagnosis and first-aid treatment in seconds — no vet visit needed.',
        'stat_diseases': 'Diseases Covered',
        'stat_animals': 'Animal Types',
        'stat_ai': 'Photo Analysis',
        'hero_btn': 'Diagnose My Animal Now',
        'how_title': 'How It Works',
        'how_subtitle': 'Three simple steps to help your livestock',
        'step1_title': 'Select Your Animal',
        'step1_desc': 'Choose from cattle, sheep, goats, pigs, or poultry',
        'step2_title': 'Describe Symptoms',
        'step2_desc': 'Type what you see — fever, cough, diarrhea, lameness, or upload a photo',
        'step3_title': 'Get Treatment',
        'step3_desc': 'Receive step-by-step treatment plans, medicines, and home remedies instantly',
        'feat1_title': 'Quick Diagnosis',
        'feat1_desc': 'Enter your animal\'s symptoms and get matched to diseases from our database of 15 common livestock diseases.',
        'feat1_btn': 'Start Diagnosis →',
        'feat2_title': 'AI Photo Analysis',
        'feat2_desc': 'Upload a photo of your sick animal and let our AI vision system identify symptoms and suggest a diagnosis automatically.',
        'feat2_btn': 'Upload Photo →',
        'feat3_title': 'Disease Reference',
        'feat3_desc': 'Browse our comprehensive guide covering treatments, home remedies, dosages, and prevention for all 15 livestock diseases.',
        'feat3_btn': 'View Guide →',
        'animals_title': 'Animals We Cover',
        'animals_subtitle': 'Our database includes diseases for all major livestock categories',
        'ans_cattle': 'Cattle',
        'ans_sheep': 'Sheep',
        'ans_goats': 'Goats',
        'ans_pigs': 'Pigs',
        'ans_poultry': 'Poultry',
        'footer_desc': 'Empowering Farmers through Early Detection and Accessible Livestock Health Information',
        'footer_disc_strong': 'Disclaimer:',
        'footer_disc_text': 'This tool is a diagnostic aid only. Always consult a licensed veterinarian for proper diagnosis and treatment. Do not rely solely on this application for medical decisions.',
        'footer_copy': '© 2026 AgriVet Diagnosis System. All rights reserved.',
        // Guide Page
        'guide_logo': 'Animal Diagnosis & Remedies',
        'guide_logo_sub': 'Quick symptom diagnosis and treatment guidance for livestock',
        'guide_title': 'Disease Reference Guide',
        'guide_subtitle': 'Comprehensive information about common livestock diseases',
        'guide_filter_label': 'Filter by Animal Type:',
        'footer_desc_guide': 'Empowering Farmers through Early Detection',
        'footer_disc_text_short': 'This tool is a diagnostic aid only. Always consult a licensed veterinarian for proper diagnosis and treatment.',
        'guide_confidence': 'Confidence:',
        'guide_symptoms': 'Symptoms:',
        'guide_description': 'Description:',
        'guide_treatment_opts': 'Treatment Options:',
        'guide_dosage': 'Dosage:',
        'guide_home_remedies': 'Home Remedies:',
        'guide_prevention': 'Prevention:'
    },
    'sw': {
        // Nav & Auth
        'login_title': 'Ingia Mkaguzi',
        'ph_username': 'Jina la mtumiaji',
        'ph_password': 'Nenosiri',
        'btn_login': 'Ingia',
        'txt_no_account': 'Huna akaunti?',
        'link_signup': 'Jisajili hapa',
        'logo_sub': 'Kuwezesha Wakulima kupitia Kugundua Magonjwa Mapema',
        'btn_menu': '☰ Menyu',
        'nav_home': 'Nyumbani',
        'nav_diagnosis': 'Uchunguzi',
        'nav_guide': 'Mwongozo wa Magonjwa',
        'btn_nav_login': 'Ingia',
        'btn_nav_logout': 'Toka',
        // Signup Forms
        'signup_title': 'Fungua Akaunti',
        'btn_signup': 'Jisajili',
        'txt_has_account': 'Tayari una akaunti?',
        'link_login': 'Ingia hapa',
        'ph_email': 'Barua Pepe',
        // Search & Symptoms
        'search_title': '🔍 Tafuta Ugonjwa',
        'search_subtitle': 'Andika dalili za mnyama wako hapa chini — au gusa magonjwa ya kawaida',
        'search_placeholder': 'Mfano. kukohoa, homa, kuhara, kukosa hamu ya kula...',
        'search_btn': 'Tafuta Dalili',
        'listening': 'Ninasikiliza... ongea sasa',
        'quick_symptoms_title': '⚡ Chagua Ugonjwa wa Kawaida:',
        'sym_fmd': 'Ugonjwa wa Miguu na Midomo (FMD)',
        'sym_mastitis': 'Mastitis (Uvimbe wa Kiwele)',
        'sym_pneumonia': 'Homa ya Mapafu ya Ng\'ombe',
        'sym_blackleg': 'Kimeta cha Miguu (Blackleg)',
        'sym_orf': 'Orf (Ugonjwa wa Mdomo)',
        'sym_swine': 'Kuhara Damu kwa Nguruwe',
        'sym_newcastle': 'Ugonjwa wa Kideri (Newcastle)',
        'sym_coccidiosis': 'Koksidiosisi',
        'animal_type': '🐄 Aina ya Mnyama:',
        'all_animals': 'Wanyama Wote',
        // Photo & AI
        'photo_ai_title': '📸 Uchunguzi Kupitia Picha ya AI',
        'photo_ai_desc': 'Piga picha au pakia — AI yetu itachunguza dalili za magonjwa',
        'tab_camera': 'Piga Picha',
        'tab_upload': 'Pakia Faili',
        'camera_point': 'Elekeza kamera kwa mnyama mgonjwa',
        'cam_open': 'Fungua Kamera',
        'cam_capture': 'Chukua Picha',
        'cam_flip': 'Geuza',
        'cam_close': 'Funga',
        'upload_tap': 'Gusa hapa kuchagua faili',
        'upload_hint': 'PNG, JPG, GIF hadi 5MB',
        'btn_analyze': 'Chunguza Picha kwa AI',
        'btn_remove': 'Ondoa',
        'photo_ready': '✅ Picha ipo tayari — gusa Chunguza',
        'scan_analyzing': '🔬 AI inachunguza picha yako...',
        'scan_wait': 'Hii inaweza kuchukua sekunde chache',
        'photo_tips_title': '💡 Vidokezo vya Picha Nzuri',
        'tip_close_strong': 'Sogelea karibu',
        'tip_close_text': '— lenga eneo lenye ugonjwa (uvimbe, kidonda, macho)',
        'tip_lighting_strong': 'Mwangaza mzuri',
        'tip_lighting_text': '— mwanga wa jua ni bora zaidi',
        'tip_steady_strong': 'Shika imara',
        'tip_steady_text': '— epuka picha zenye ukungu ili AI ifanye kazi vizuri',
        'tip_angles_strong': 'Piga pande tofauti',
        'tip_angles_text': '— piga picha kutoka pande mbalimbali ikiwezekana',
        // History & Actions
        'save_share': 'Hifadhi au Tuma Ripoti',
        'print_report': 'Chapisha Ripoti',
        'share_whatsapp': 'Tuma kwa Daktari (WhatsApp)',
        'history_title': '🕒 Magonjwa Yangu ya Nyuma',
        'emergency_title': 'Dharura ya Mnyama?',
        'emergency_desc': 'Kama mnyama wako yuko mahututi, wasiliana na daktari mara moja',
        'call_vet': 'Piga Daktari',
        // Home Page
        'hero_title': 'Je, Mnyama Wako Mgonjwa?',
        'hero_subtitle': 'Pata uchunguzi wa haraka na huduma ya kwanza kwa sekunde chache — hakuna haja ya kumtembelea daktari wa mifugo.',
        'stat_diseases': 'Magonjwa Yanayoangaziwa',
        'stat_animals': 'Aina za Wanyama',
        'stat_ai': 'Uchunguzi wa Picha',
        'hero_btn': 'Chunguza Mnyama Wangu Sasa',
        'how_title': 'Jinsi Inavyofanya Kazi',
        'how_subtitle': 'Hatua tatu rahisi kusaidia mifugo yako',
        'step1_title': 'Chagua Mnyama Wako',
        'step1_desc': 'Chagua kati ya ng\'ombe, kondoo, mbuzi, nguruwe, au kuku',
        'step2_title': 'Eleza Dalili',
        'step2_desc': 'Andika unachokiona — homa, kukohoa, kuhara, kuchechemea, au pakia picha',
        'step3_title': 'Pata Matibabu',
        'step3_desc': 'Pata mipango ya matibabu ya hatua kwa hatua, dawa, na tiba mbadala mara moja',
        'feat1_title': 'Uchunguzi wa Haraka',
        'feat1_desc': 'Ingiza dalili za mnyama wako ili kuoanishwa na magonjwa kutoka hifadhidata yetu ya magonjwa 15 ya kawaida.',
        'feat1_btn': 'Anza Uchunguzi →',
        'feat2_title': 'Uchunguzi wa Picha za AI',
        'feat2_desc': 'Pakia picha ya mnyama wako mgonjwa na uruhusu mfumo wetu wa AI utambue dalili na kupendekeza ugonjwa.',
        'feat2_btn': 'Pakia Picha →',
        'feat3_title': 'Mwongozo wa Magonjwa',
        'feat3_desc': 'Pitia mwongozo wetu unaojumuisha matibabu, tiba za nyumbani, vipimo, na kinga kwa magonjwa yote 15.',
        'feat3_btn': 'Tazama Mwongozo →',
        'animals_title': 'Wanyama Tunaowaangazia',
        'animals_subtitle': 'Hifadhidata yetu inajumuisha magonjwa kwa makundi yote makuu ya mifugo',
        'ans_cattle': 'Ng\'ombe',
        'ans_sheep': 'Kondoo',
        'ans_goats': 'Mbuzi',
        'ans_pigs': 'Nguruwe',
        'ans_poultry': 'Kuku',
        'footer_desc': 'Kuwezesha Wakulima kupitia Kugundua Magonjwa Mapema na Habari za Afya ya Mifugo',
        'footer_disc_strong': 'Kanusho:',
        'footer_disc_text': 'Zana hii ni msaada wa uchunguzi pekee. Daima muone daktari wa mifugo aliyepewa leseni kwa uchunguzi na matibabu sahihi. Usitegemee programu hii pekee kwa maamuzi ya matibabu.',
        'footer_copy': '© 2026 Mfumo wa Uchunguzi wa AgriVet. Haki zote zimehifadhiwa.',
        // Guide Page
        'guide_logo': 'Uchunguzi wa Wanyama na Tiba',
        'guide_logo_sub': 'Uchunguzi wa haraka wa dalili na mwongozo wa matibabu kwa mifugo',
        'guide_title': 'Mwongozo wa Kumbukumbu za Magonjwa',
        'guide_subtitle': 'Maelezo ya kina kuhusu magonjwa ya kawaida ya mifugo',
        'guide_filter_label': 'Chuja kwa Aina ya Mnyama:',
        'footer_desc_guide': 'Kuwezesha Wakulima kupitia Kugundua Magonjwa Mapema',
        'footer_disc_text_short': 'Zana hii ni msaada wa uchunguzi pekee. Daima muone daktari wa mifugo kwa uchunguzi na matibabu sahihi.',
        'guide_confidence': 'Uhakika:',
        'guide_symptoms': 'Dalili:',
        'guide_description': 'Maelezo:',
        'guide_treatment_opts': 'Chaguzi za Matibabu:',
        'guide_dosage': 'Kipimo:',
        'guide_home_remedies': 'Tiba za Nyumbani:',
        'guide_prevention': 'Kinga:'
    }
};

// 3. Language Toggle (English / Swahili)
window.applyTranslations = function (lang) {
    if (!translations[lang]) return;

    // Update basic texts
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            el.innerHTML = translations[lang][key];
        }
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[lang][key]) {
            el.placeholder = translations[lang][key];
        }
    });

    // Optional: Update speech recognition lang if running
    if (typeof voiceInputBtn !== 'undefined' && voiceInputBtn && !voiceInputBtn.classList.contains('recording')) {
        if (typeof symptomInput !== 'undefined' && symptomInput && translations[lang]['search_placeholder']) {
            symptomInput.placeholder = translations[lang]['search_placeholder'];
        }
    }
};

const langBtns = document.querySelectorAll('.lang-btn');
langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Toggle active class
        langBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const lang = btn.dataset.lang;
        window.applyTranslations(lang);
    });
});

// Auto-apply on load based on active button
document.addEventListener('DOMContentLoaded', () => {
    const activeBtn = document.querySelector('.lang-btn.active');
    if (activeBtn) window.applyTranslations(activeBtn.dataset.lang);
});

// 4. Print and Share Functions
const printReportBtn = document.getElementById('printReportBtn');
const shareWhatsAppBtn = document.getElementById('shareWhatsAppBtn');

if (printReportBtn) {
    printReportBtn.addEventListener('click', () => {
        window.print();
    });
}

if (shareWhatsAppBtn) {
    shareWhatsAppBtn.addEventListener('click', () => {
        const topDisease = document.querySelector('.scan-result-card h4')?.textContent || 'Animal Assessment';
        const animalType = document.getElementById('animalType').options[document.getElementById('animalType').selectedIndex].text.replace(/[^a-zA-Z\s]/g, '').trim() || 'my animal';
        const symptomsTxt = document.getElementById('symptomInput').value || 'Unspecified symptoms';

        const text = `*AgriVet Diagnosis Report*%0A%0A*Animal:* ${animalType}%0A*Symptoms:* ${symptomsTxt}%0A*Suspected:* ${topDisease}%0A%0AI need professional veterinary assistance.`;
        window.open(`https://wa.me/?text=${text}`, '_blank');
    });
}

// 5. Load Diagnosis History
async function loadDiagnosisHistory() {
    if (!isLoggedIn) return;
    const historySection = document.getElementById('historySection');
    const historyList = document.getElementById('historyList');
    if (!historySection || !historyList) return;

    try {
        const history = await DiagnosisService.getHistory();
        if (history && history.length > 0) {
            historySection.classList.remove('hidden');
            let html = '';

            history.forEach(log => {
                const date = new Date(log.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                const topMatch = log.results && log.results.length > 0 ? log.results[0].diseaseName : 'No match found';
                const score = log.results && log.results.length > 0 ? Math.round(log.results[0].matchScore * 100) : 0;

                html += `
                    <div class="history-card">
                        <div class="history-header">
                            <span class="history-date">📅 ${date}</span>
                            <span class="history-badge" style="color: ${score >= 70 ? '#2ecc71' : '#f39c12'}">${score}% Confident</span>
                        </div>
                        <div class="history-top-match">${topMatch}</div>
                        <div class="history-symptoms">📝 Symptoms: ${log.symptoms}</div>
                    </div>
                `;
            });
            historyList.innerHTML = html;
        }
    } catch (err) {
        console.error("Failed to load history:", err);
    }
}

// Load history when login modal closes if authenticated (or on initial load)
document.addEventListener('DOMContentLoaded', () => {
    if (isLoggedIn) {
        setTimeout(loadDiagnosisHistory, 1000);
    }
});

// We should also intercept the login to load history
const originalSubmitListener = loginForm?.addEventListener('submit', () => { });
if (loginForm) {
    loginForm.addEventListener('submit', () => {
        // Just reload history after a short delay so the login can complete
        setTimeout(loadDiagnosisHistory, 1500);
    });
}

// Show Action buttons when returning a successful search
// (This is patched inside performSearch)

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

    const actionsDiv = document.getElementById('diagnosisActions');

    if (!results || results.length === 0) {
        resultCard.innerHTML = `
            <p style="color: #666;">No diseases found matching the symptoms "${symptomQuery}". 
            Please try different symptoms or consult a veterinarian.</p>
        `;
        if (actionsDiv) actionsDiv.classList.add('hidden');
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

    // Show Print/Share buttons since we have a result
    if (actionsDiv) actionsDiv.classList.remove('hidden');

    // Refresh history silently if logged in
    if (isLoggedIn) {
        setTimeout(loadDiagnosisHistory, 1000);
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

                // Show AI error info banner if Gemini failed
                let headerHtml = '';
                if (data.aiError) {
                    headerHtml += `
                        <div class="scan-result-card" style="border-color: rgba(243, 156, 18, 0.3); background: rgba(243, 156, 18, 0.06);">
                            <h4 style="color: #f39c12;">⚠️ AI Vision Temporarily Unavailable</h4>
                            <p style="color: #b0bec5;">The AI image scanner couldn't process your photo right now. Here are common diseases for your animal type instead.</p>
                            <p style="color: #8b949e; font-size: 13px;"><strong>Tip:</strong> Try typing symptoms manually above for a more accurate diagnosis.</p>
                        </div>
                    `;
                }

                if (results.length === 0) {
                    scanResultContent.innerHTML = headerHtml + `
                        <div class="scan-result-card">
                            <h4>🤔 No Match Found</h4>
                            <p>The AI could not confidently identify a disease from this photo. Try:</p>
                            <ul>
                                <li>📸 Taking a clearer photo with better lighting</li>
                                <li>🎯 Focusing on the affected area (wound, swelling, eyes)</li>
                                <li>🐄 Selecting the correct animal type above</li>
                                <li>✍️ Entering symptoms manually in the search box</li>
                            </ul>
                        </div>
                    `;
                } else {
                    let html = headerHtml;
                    html += data.isAiAssisted
                        ? '<h4 class="scan-results-title">🔬 AI Scan Results</h4>'
                        : '<h4 class="scan-results-title">📋 Common Diseases to Consider</h4>';

                    results.forEach((result, index) => {
                        const isAiMatch = result.aiMatch || result.matchedViaAI;
                        const isSuggestion = result.isSuggestion;
                        const confidence = result.confidence || 30;
                        const confidenceColor = confidence >= 70 ? '#2ecc71' : confidence >= 40 ? '#f39c12' : '#e74c3c';

                        html += `
                            <div class="scan-result-card ${index === 0 && !isSuggestion ? 'top-result' : ''}">
                                ${index === 0 && !isSuggestion ? '<span class="top-badge">🏆 Best Match</span>' : ''}
                                ${isAiMatch ? '<span class="ai-badge">🤖 AI Vision Match</span>' : ''}
                                ${isSuggestion ? '<span class="ai-badge" style="background: linear-gradient(135deg, #f39c12, #e67e22);">📋 Suggested</span>' : ''}
                                <h4>${result.disease || result.name}</h4>
                                ${!isSuggestion ? `
                                    <div class="confidence-bar">
                                        <div class="confidence-fill" style="width: ${confidence}%; background: ${confidenceColor}"></div>
                                        <span class="confidence-text">${confidence}% confidence</span>
                                    </div>
                                ` : ''}
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

                    // Show action buttons and refresh history for AI scan too
                    const actionsDiv = document.getElementById('diagnosisActions');
                    if (actionsDiv) actionsDiv.classList.remove('hidden');
                    if (isLoggedIn) setTimeout(loadDiagnosisHistory, 1000);
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
