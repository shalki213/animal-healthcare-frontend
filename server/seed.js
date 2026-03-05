/**
 * Database Seeder
 * Migrates the hardcoded diseaseDatabase from the frontend into MongoDB.
 * Run with: node seed.js
 */
const mongoose = require('mongoose');
require('dotenv').config();
const Disease = require('./models/Disease');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/animal-healthcare';

// The original disease data from database.js
const diseaseDatabase = {
    cattle: [
        {
            name: "Foot and Mouth Disease (FMD)",
            symptoms: ["blister", "mouth", "hooves", "fever", "lameness", "excessive salivation", "weight loss"],
            confidence: 0.95,
            treatment: [
                {
                    name: "Antiviral Therapy",
                    medicines: [
                        { name: "Acyclovir", dosage: "10-20 mg/kg every 8 hours" },
                        { name: "Ribavirin", dosage: "15-30 mg/kg daily in divided doses" }
                    ]
                },
                {
                    name: "Supportive Care",
                    medicines: [
                        { name: "Pain relievers (NSAIDs)", dosage: "Phenylbutazone 2-4 mg/kg BID" },
                        { name: "Antibiotics for secondary infection", dosage: "Penicillin/Streptomycin combination" }
                    ]
                }
            ],
            homeRemedies: [
                { remedy: "Saltwater rinse", instructions: "Rinse mouth and affected areas with warm saltwater (1 tsp salt per liter) 2-3 times daily" },
                { remedy: "Turmeric paste", instructions: "Mix turmeric powder with coconut oil, apply to blisters twice daily for antibacterial effect" },
                { remedy: "Soft diet", instructions: "Provide soft grains, hay and water to prevent additional mouth pain" }
            ],
            description: "Highly contagious viral disease affecting cloven-hoofed animals.",
            prevention: "Vaccination, biosecurity measures, quarantine of infected animals"
        },
        {
            name: "Mastitis",
            symptoms: ["swollen udder", "hot udder", "pain", "fever", "reduced milk", "discolored milk", "blood in milk"],
            confidence: 0.92,
            treatment: [
                {
                    name: "Antibiotics",
                    medicines: [
                        { name: "Intramammary Antibiotics", dosage: "Cephalexin 200-400 mg per infusion" },
                        { name: "Systemic Antibiotics", dosage: "Amoxicillin 10-15 mg/kg BID" },
                        { name: "Penicillin", dosage: "10,000-20,000 units/kg BID" }
                    ]
                },
                {
                    name: "Anti-inflammatory",
                    medicines: [
                        { name: "Ibuprofen", dosage: "5-10 mg/kg BID" }
                    ]
                }
            ],
            homeRemedies: [
                { remedy: "Warm water compress", instructions: "Apply warm water compresses to affected udder 15-20 minutes, 4 times daily to reduce pain" },
                { remedy: "Epsom salt bath", instructions: "Soak udder in warm Epsom salt solution (1 cup salt per gallon of water) twice daily" },
                { remedy: "Turmeric and ginger tea", instructions: "Mix turmeric powder with ginger in drinking water daily to reduce inflammation" },
                { remedy: "Frequent milking", instructions: "Milk gently and frequently (every 3-4 hours) to improve circulation and relief" }
            ],
            description: "Inflammation of the mammary gland, common in dairy cattle.",
            prevention: "Proper milking hygiene, clean housing, regular udder cleaning"
        },
        {
            name: "Bovine Pneumonia",
            symptoms: ["cough", "fever", "rapid breathing", "nasal discharge", "lethargy", "loss of appetite", "wheezing"],
            confidence: 0.88,
            treatment: [
                {
                    name: "Antibiotics",
                    medicines: [
                        { name: "Doxycycline", dosage: "10-20 mg/kg daily for 7-10 days" },
                        { name: "Enrofloxacin", dosage: "5-10 mg/kg SID" },
                        { name: "Ceftriaxone", dosage: "20-25 mg/kg BID" }
                    ]
                }
            ],
            homeRemedies: [
                { remedy: "Garlic and ginger mixture", instructions: "Mix minced garlic and ginger in feed daily to boost immunity and clear respiratory tract" },
                { remedy: "Honey drench", instructions: "Give 2-3 tablespoons of honey mixed with warm water daily - acts as natural cough suppressant" },
                { remedy: "Steam inhalation", instructions: "Place animal in steamed environment (hot water vapor) for 10-15 minutes, 2-3 times daily" },
                { remedy: "Turmeric milk", instructions: "Mix 1 tsp turmeric in warm milk, provide daily for anti-inflammatory benefits" }
            ],
            description: "Respiratory infection affecting the lungs.",
            prevention: "Good ventilation, vaccination, stress reduction"
        },
        {
            name: "Blackleg",
            symptoms: ["lameness", "swelling on leg", "fever", "depression", "muscle necrosis", "dark discoloration"],
            confidence: 0.9,
            treatment: [
                {
                    name: "Antibiotics (Early Treatment Critical)",
                    medicines: [
                        { name: "Penicillin G", dosage: "20,000-40,000 units/kg BID" },
                        { name: "Oxytetracycline", dosage: "20 mg/kg BID-TID" }
                    ]
                }
            ],
            homeRemedies: [
                { remedy: "Turmeric poultice", instructions: "Mix turmeric with mustard oil and apply to affected leg 2-3 times daily" },
                { remedy: "Hot compress", instructions: "Apply hot water compresses to reduce muscle stiffness for 15 minutes, 3-4 times daily" },
                { remedy: "Rest and support", instructions: "Isolate animal, provide soft bedding and reduce movement to prevent worsening" }
            ],
            description: "Acute, often fatal disease caused by Clostridium chauvoei.",
            prevention: "Vaccination with blackleg vaccine, proper wound care"
        },
        {
            name: "Bovine Brucellosis",
            symptoms: ["abortion", "infertility", "retained placenta", "reduced milk", "swollen testicles", "weak calves"],
            confidence: 0.94,
            treatment: [
                {
                    name: "No Effective Treatment (Cull)",
                    medicines: [
                        { name: "Antibiotics (variable success)", dosage: "Oxytetracycline combined with Streptomycin may reduce shedding, but rarely cures" }
                    ]
                }
            ],
            homeRemedies: [
                { remedy: "Immediate Isolation (First-Aid)", instructions: "Immediately separate aborting cows from the rest of the herd to prevent transmission" },
                { remedy: "Safe disposal", instructions: "Properly bury or burn aborted fetuses and placenta wearing complete protective gear (zoonotic disease)" },
                { remedy: "Disinfection", instructions: "Thoroughly disinfect the calving area with strong bleach or phenolic disinfectants" }
            ],
            description: "Highly contagious bacterial disease causing reproductive failure. Zoonotic (can infect humans).",
            prevention: "Vaccination (strain 19 or RB51), blood testing, biosecurity"
        }
    ],
    sheep: [
        {
            name: "Ovine Pneumonia",
            symptoms: ["cough", "nasal discharge", "fever", "difficult breathing", "lethargy", "loss of appetite"],
            confidence: 0.85,
            treatment: [
                {
                    name: "Antibiotics",
                    medicines: [
                        { name: "Doxycycline", dosage: "5-10 mg/kg BID" },
                        { name: "Penicillin", dosage: "15,000 units/kg BID" }
                    ]
                }
            ],
            homeRemedies: [
                { remedy: "Ginger-honey mixture", instructions: "Mix fresh ginger juice with honey, give 1 tbsp daily to soothe respiratory tract" },
                { remedy: "Lemongrass tea", instructions: "Brew lemongrass in water, cool and add to drinking water for antibacterial properties" },
                { remedy: "Garlic supplementation", instructions: "Add crushed garlic to feed 1-2 times daily for immune support" },
                { remedy: "Warm shelter", instructions: "Provide warm, well-ventilated shelter to prevent temperature stress" }
            ],
            description: "Respiratory infection in sheep.",
            prevention: "Good ventilation, proper nutrition, vaccination"
        },
        {
            name: "Foot Rot",
            symptoms: ["lameness", "foot odor", "swollen foot", "necrotic tissue", "difficulty walking"],
            confidence: 0.93,
            treatment: [
                {
                    name: "Local Treatment",
                    medicines: [
                        { name: "Foot baths with Zinc sulfate", dosage: "10% solution, 5-10 minutes" },
                        { name: "Antibiotic powder", dosage: "Apply topically after trimming" }
                    ]
                },
                {
                    name: "Systemic Antibiotics",
                    medicines: [
                        { name: "Penicillin/Streptomycin", dosage: "Combination therapy BID" }
                    ]
                }
            ],
            homeRemedies: [
                { remedy: "Saltwater foot soak", instructions: "Soak feet in warm saltwater (2 tbsp salt per liter) for 10 minutes daily" },
                { remedy: "Vinegar bath", instructions: "Mix apple cider vinegar (1:1 with water) and soak feet for antibacterial effect" },
                { remedy: "Turmeric and oil paste", instructions: "Mix turmeric powder with coconut or mustard oil, apply after trimming hooves" },
                { remedy: "Dry bedding", instructions: "Maintain dry pen with frequent straw changes to prevent moisture and infection" }
            ],
            description: "Bacterial infection of the foot, highly contagious.",
            prevention: "Foot baths, proper housing, hoof trimming, quarantine"
        },
        {
            name: "Orf (Sore Mouth)",
            symptoms: ["scabs on lips", "blister", "mouth sores", "weight loss", "reluctance to eat", "lesions on teats"],
            confidence: 0.95,
            treatment: [
                {
                    name: "Supportive Care",
                    medicines: [
                        { name: "Topical Antibiotics", dosage: "Apply to secondary bacterial infections on scabs" },
                        { name: "Pain relievers", dosage: "Mild analgesics if eating is severely reduced" }
                    ]
                }
            ],
            homeRemedies: [
                { remedy: "Soft palatable feed", instructions: "Provide very soft grass, moistened grains, and accessible water to minimize lip pain while eating" },
                { remedy: "Warm saltwater wash", instructions: "Gently dab scabs with warm saltwater to keep lesions clean (wear gloves, it is contagious to humans)" },
                { remedy: "Aloe vera gel", instructions: "Apply pure aloe vera gel gently to the crusts to soothe pain and soften scabs" }
            ],
            description: "Highly contagious viral skin disease (zoonotic).",
            prevention: "Vaccination in endemic flocks, quarantine new animals"
        }
    ],
    goat: [
        {
            name: "Caprine Arthritis Encephalitis (CAE)",
            symptoms: ["swollen joints", "lameness", "fever", "arthritis", "arthralgia"],
            confidence: 0.87,
            treatment: [
                {
                    name: "Supportive Care",
                    medicines: [
                        { name: "NSAIDs", dosage: "Meloxicam 0.5 mg/kg daily" }
                    ]
                }
            ],
            homeRemedies: [
                { remedy: "Turmeric and ginger", instructions: "Add turmeric and ginger powder to feed daily for joint pain relief" },
                { remedy: "Warm compress", instructions: "Apply warm water compresses to affected joints for 15-20 minutes, 2 times daily" },
                { remedy: "Herbal tea", instructions: "Prepare boswellia (frankincense) tea and add to drinking water for anti-inflammatory effects" }
            ],
            description: "Chronic viral disease affecting joints and nervous system.",
            prevention: "Test and cull policy, separating infected kids, vaccination"
        },
        {
            name: "Contagious Ecthyma",
            symptoms: ["scabs on mouth", "lip sores", "blister", "udder lesions", "weight loss", "reluctance to nurse"],
            confidence: 0.94,
            treatment: [
                {
                    name: "Topical Treatment",
                    medicines: [
                        { name: "Antiseptic spray", dosage: "Apply chlorhexidine or iodine spray to prevent secondary infection" }
                    ]
                }
            ],
            homeRemedies: [
                { remedy: "Honey and Turmeric paste", instructions: "Apply a paste of raw honey and turmeric to the scabs twice daily to promote healing" },
                { remedy: "Bottle feeding (First-Aid)", instructions: "If kids refuse to nurse due to lip pain, immediately bottle-feed them warm milk to prevent starvation" },
                { remedy: "Neem leaf wash", instructions: "Boil neem leaves in water, let cool, and use as an antibacterial wash for the lesions" }
            ],
            description: "A viral skin disease identical to Orf in sheep, causing painful scabs.",
            prevention: "Live vaccine applied to skin scratches"
        }
    ],
    pig: [
        {
            name: "Swine Dysentery",
            symptoms: ["diarrhea", "blood in feces", "lethargy", "weight loss", "dehydration"],
            confidence: 0.89,
            treatment: [
                {
                    name: "Antibiotics",
                    medicines: [
                        { name: "Tiamulin", dosage: "10-20 mg/kg daily for 7-14 days" },
                        { name: "Lincomycin", dosage: "10-20 mg/kg daily" }
                    ]
                },
                {
                    name: "Supportive Care",
                    medicines: [
                        { name: "Electrolyte solution", dosage: "Provide in water ad libitum" }
                    ]
                }
            ],
            homeRemedies: [
                { remedy: "Probiotics with rice bran", instructions: "Mix rice bran with fermented feed to restore gut bacteria, provide twice daily" },
                { remedy: "Ginger-garlic feed additive", instructions: "Add minced ginger and garlic to feed daily for antibacterial properties" },
                { remedy: "Coconut water and salt solution", instructions: "Provide electrolyte-rich fluids: water, salt (1 tsp/liter) and some sugar" },
                { remedy: "Soft bland diet", instructions: "Feed cooked rice, boiled eggs, and soft vegetables until recovery" }
            ],
            description: "Infectious diarrheal disease caused by Brachyspira hyodysenteriae.",
            prevention: "Biosecurity, sanitation, vaccination"
        },
        {
            name: "Porcine Parvovirus (PPV)",
            symptoms: ["mummified pigs", "stillbirth", "small litters", "infertility", "delayed return to estrus"],
            confidence: 0.96,
            treatment: [
                {
                    name: "No Treatment",
                    medicines: [
                        { name: "Supportive Care", dosage: "Provide antibiotics only if secondary uterine infections occur" }
                    ]
                }
            ],
            homeRemedies: [
                { remedy: "Maternal immunity building (First-Aid)", instructions: "Feed feces or mummified fetuses from affected pens to young gilts BEFORE breeding to establish natural immunity" },
                { remedy: "Stress reduction", instructions: "Provide extra bedding, optimal temperatures, and reduce overcrowding to minimize stress on pregnant sows" },
                { remedy: "Nutritional support", instructions: "Increase vitamin E and selenium in diet to support reproductive recovery" }
            ],
            description: "Viral disease causing reproductive failure in naive pregnant swine (SMEDI syndrome).",
            prevention: "Vaccination of all breeding stock prior to mating"
        }
    ],
    poultry: [
        {
            name: "Newcastle Disease",
            symptoms: ["twisted neck", "paralysis", "respiratory distress", "diarrhea", "depression", "reduced egg production"],
            confidence: 0.91,
            treatment: [
                {
                    name: "Supportive Care Only",
                    medicines: [
                        { name: "Vitamin A and E supplementation", dosage: "As per product label" },
                        { name: "Electrolytes", dosage: "In drinking water" }
                    ]
                }
            ],
            homeRemedies: [
                { remedy: "Vitamin-rich feed", instructions: "Provide greens like spinach, kale, and carrot tops for vitamin A and E content" },
                { remedy: "Garlic in water", instructions: "Add minced garlic to drinking water 3 times a week for immune support" },
                { remedy: "Honey and turmeric", instructions: "Mix honey and turmeric in water daily for anti-inflammatory benefits" },
                { remedy: "Separate sick birds", instructions: "Isolate affected birds to prevent spread to healthy flock" }
            ],
            description: "Highly contagious viral disease, no specific treatment.",
            prevention: "Vaccination, biosecurity, quarantine"
        },
        {
            name: "Coccidiosis",
            symptoms: ["diarrhea", "bloody droppings", "weight loss", "lethargy", "pale comb and wattles"],
            confidence: 0.90,
            treatment: [
                {
                    name: "Anticoccidials",
                    medicines: [
                        { name: "Amprolium", dosage: "125 mg/L in drinking water for 7 days" },
                        { name: "Toltrazuril", dosage: "7-20 mg/kg as single dose" },
                        { name: "Sulfaquinoxaline", dosage: "0.025% in feed or water" }
                    ]
                },
                {
                    name: "Supportive Care",
                    medicines: [
                        { name: "Vitamin K", dosage: "To prevent hemorrhage" }
                    ]
                }
            ],
            homeRemedies: [
                { remedy: "Garlic supplementation", instructions: "Add chopped garlic to feed daily for parasitic control" },
                { remedy: "Turmeric powder", instructions: "Mix 1 tsp turmeric in feed daily for anti-inflammatory and antiparasitic effects" },
                { remedy: "Apple cider vinegar", instructions: "Add 1 tbsp apple cider vinegar per liter of drinking water, 3 times per week" },
                { remedy: "Diatomaceous earth", instructions: "Mix food-grade diatomaceous earth in bedding and feed to control parasites naturally" },
                { remedy: "Clean dry bedding", instructions: "Change bedding daily to reduce oocyst contamination and moisture" }
            ],
            description: "Parasitic intestinal disease caused by Eimeria species.",
            prevention: "Coccidiostats in feed, good sanitation, moisture control"
        },
        {
            name: "Fowl Pox",
            symptoms: ["wart-like nodules", "scabs on comb", "lesions on wattles", "difficulty breathing", "drop in egg production", "loss of appetite"],
            confidence: 0.93,
            treatment: [
                {
                    name: "Supportive Care",
                    medicines: [
                        { name: "Topical iodine", dosage: "Apply directly to skin lesions to dry them out" },
                        { name: "Broad-spectrum antibiotics", dosage: "Added to water to prevent secondary bacterial infections" }
                    ]
                }
            ],
            homeRemedies: [
                { remedy: "Mosquito control (First-Aid)", instructions: "Immediately remove standing water and use natural repellents, as mosquitoes spread the virus rapidly" },
                { remedy: "Iodine dab", instructions: "Gently dab scabs with dilute iodine using a cotton swab to prevent secondary infections" },
                { remedy: "Apple cider vinegar", instructions: "Add 1 tbsp ACV per gallon of drinking water to reduce slime accumulation in throats" },
                { remedy: "Soft mash", instructions: "Soak regular feed in warm water to make a soft mash if birds have mouth lesions and struggle to eat dry pellets" }
            ],
            description: "Slow-spreading viral infection causing skin lesions or diphtheritic plaques in the mouth/respiratory tract.",
            prevention: "Wing-web vaccination, mosquito control"
        }
    ]
};

async function seedDatabase() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing diseases
        const existingCount = await Disease.countDocuments();
        if (existingCount > 0) {
            console.log(`⚠️  Found ${existingCount} existing diseases. Clearing...`);
            await Disease.deleteMany({});
        }

        // Insert diseases
        let totalInserted = 0;
        for (const [animalType, diseases] of Object.entries(diseaseDatabase)) {
            for (const diseaseData of diseases) {
                const disease = new Disease({
                    ...diseaseData,
                    animalType
                });
                await disease.save();
                totalInserted++;
                console.log(`   ✅ ${animalType}: ${diseaseData.name}`);
            }
        }

        console.log(`\n🎉 Successfully seeded ${totalInserted} diseases into MongoDB!`);
        return totalInserted;
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        throw error;
    }
}

if (require.main === module) {
    seedDatabase().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = seedDatabase;
