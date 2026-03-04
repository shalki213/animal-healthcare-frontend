// Disease Guide Script
const guideAnimalFilter = document.getElementById('guideAnimalFilter');
const diseaseGuideDiv = document.getElementById('diseaseGuide');

// Dropdown Menu Functionality
const dropdownBtn = document.querySelector('.dropdown-btn');
const dropdown = document.querySelector('.dropdown');

if (dropdownBtn) {
    dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('active');
    });

    // Close dropdown when clicking on a link
    const dropdownLinks = document.querySelectorAll('.dropdown-content a');
    dropdownLinks.forEach(link => {
        link.addEventListener('click', () => {
            dropdown.classList.remove('active');
        });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
}

if (guideAnimalFilter) {
    guideAnimalFilter.addEventListener('change', displayFilteredGuide);
}

function displayFilteredGuide() {
    const selectedAnimal = guideAnimalFilter.value;
    let guideHTML = '';

    if (selectedAnimal) {
        // Display only selected animal's diseases
        const diseases = diseaseDatabase[selectedAnimal] || [];
        if (diseases.length === 0) {
            guideHTML = '<p>No diseases found for this animal type.</p>';
        } else {
            guideHTML = `<h3 style="color: #2ecc71; margin-top: 30px; text-transform: capitalize;">
                ${selectedAnimal} Diseases
            </h3>`;
            diseases.forEach(disease => {
                guideHTML += createDiseaseCard(disease);
            });
        }
    } else {
        // Display all animals and their diseases
        Object.entries(diseaseDatabase).forEach(([animalType, diseases]) => {
            guideHTML += `<h3 style="color: #2ecc71; margin-top: 30px; text-transform: capitalize;">
                ${animalType} Diseases
            </h3>`;
            diseases.forEach(disease => {
                guideHTML += createDiseaseCard(disease);
            });
        });
    }

    diseaseGuideDiv.innerHTML = guideHTML;
}

function createDiseaseCard(disease) {
    return `
        <div class="disease-card">
            <h4>${disease.name}</h4>
            <p><strong>Confidence:</strong> ${(disease.confidence * 100).toFixed(0)}%</p>
            <p><strong>Symptoms:</strong> ${disease.symptoms.join(', ')}</p>
            <p><strong>Description:</strong> ${disease.description}</p>
            
            <div class="disease-details">
                <h5>Treatment Options:</h5>
                ${disease.treatment.map(treatmentGroup => `
                    <div class="treatment-box">
                        <h6>${treatmentGroup.name}</h6>
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
                        <h6 style="color: #f39c12;">Home Remedies</h6>
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
                
                <p><strong>Prevention:</strong> ${disease.prevention}</p>
            </div>
        </div>
    `;
}

// Display guide on page load
window.addEventListener('DOMContentLoaded', () => {
    displayFilteredGuide();
    updateUI();
});
