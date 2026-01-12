require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API Key found in .env");
        return;
    }

    try {
        console.log(`Checking models...`);
        const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        const models = response.data.models
            .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
            .map(m => m.name);

        fs.writeFileSync('available_models.json', JSON.stringify(models, null, 2));
        console.log("Models written to available_models.json");
    } catch (error) {
        console.error("Error listing models:", error.response ? error.response.data : error.message);
        fs.writeFileSync('available_models.json', JSON.stringify({ error: error.message }, null, 2));
    }
}

listModels();
