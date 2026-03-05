// Disease Guide Script — wired to backend API
const guideAnimalFilter = document.getElementById('guideAnimalFilter');
const diseaseGuideDiv = document.getElementById('diseaseGuide');

if (guideAnimalFilter) {
    guideAnimalFilter.addEventListener('change', displayFilteredGuide);
}

async function displayFilteredGuide() {
    const selectedAnimal = guideAnimalFilter.value;

    // Show loading state
    diseaseGuideDiv.innerHTML = '<p style="text-align:center; color:#666;">Loading diseases...</p>';

    try {
        const diseases = await DiseaseService.getAll(selectedAnimal);

        if (!diseases || diseases.length === 0) {
            diseaseGuideDiv.innerHTML = '<p>No diseases found.</p>';
            return;
        }

        let guideHTML = '';

        if (selectedAnimal) {
            // Single animal type selected
            guideHTML += `<h3 style="color: #2ecc71; margin-top: 30px; text-transform: capitalize;">
                ${selectedAnimal} Diseases
            </h3>`;
            diseases.forEach(disease => {
                guideHTML += createDiseaseCard(disease);
            });
        } else {
            // Group diseases by animal type
            const grouped = {};
            diseases.forEach(disease => {
                const type = disease.animalType;
                if (!grouped[type]) grouped[type] = [];
                grouped[type].push(disease);
            });

            Object.entries(grouped).forEach(([animalType, diseases]) => {
                guideHTML += `<h3 style="color: #2ecc71; margin-top: 30px; text-transform: capitalize;">
                    ${animalType} Diseases
                </h3>`;
                diseases.forEach(disease => {
                    guideHTML += createDiseaseCard(disease);
                });
            });
        }

        diseaseGuideDiv.innerHTML = guideHTML;
    } catch (error) {
        diseaseGuideDiv.innerHTML = `<p style="color: #e74c3c;">Failed to load diseases: ${error.message}</p>`;
    }
}

function createDiseaseCard(disease) {
    // Normalize field name (API returns homeRemedies, original used homemedies)
    const remedies = disease.homeRemedies || disease.homemedies || [];

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
                
                ${remedies.length > 0 ? `
                    <div class="treatment-box" style="background-color: #fff9e6; border-left-color: #f39c12;">
                        <h6 style="color: #f39c12;">Home Remedies</h6>
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
                
                <p><strong>Prevention:</strong> ${disease.prevention}</p>
            </div>
        </div>
    `;
}

// Display guide on page load
window.addEventListener('DOMContentLoaded', () => {
    displayFilteredGuide();
});
