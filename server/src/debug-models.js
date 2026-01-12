require('dotenv').config();
const axios = require('axios');

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API Key found in .env");
        return;
    }

    try {
        console.log(`Checking models for API Key: ${apiKey.substring(0, 8)}...`);
        const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        console.log("\nAvailable Models:");
        response.data.models.forEach(model => {
            if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes('generateContent')) {
                console.log(`- ${model.name}`);
            }
        });
    } catch (error) {
        console.error("Error listing models:", error.response ? error.response.data : error.message);
    }
}

listModels();
