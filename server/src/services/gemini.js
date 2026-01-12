const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AI_KEY_PLACEHOLDER');

async function analyzeResume(fileBuffer, mimeType, jobDescription) {
    // No try-catch here, let the route handle errors or fail aloud
    // Switching to gemini-flash-latest to avoid 2.0 rate limits and 1.5 naming issues
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
        You are an expert HR Resume Screener. 
        I will provide you with a resume (PDF) and a Job Description.
        Your task is to analyze the resume against the job description.

        JOB DESCRIPTION:
        ${jobDescription}

        OUTPUT INSTRUCTIONS:
        Return a strictly valid JSON object (no markdown formatting).
        The logic should be:
        1. Extract all skills from the resume.
        2. Match them against the JD (Semantic Match e.g. ReactJS = React).
        3. Identify "Missing Skills": Skills explicitly in JD but completely absent in Resume.
        4. Suggest "Potential Skills": Skills the candidate might have based on context but didn't list.
        5. Calculate match score.
        
        JSON FORMAT:
        {
            "extracted_skills": ["skill1", "skill2"],
            "missing_skills": ["missing1", "missing2"],
            "match_score": 85.5,
            "skill_suggestions": [
                { "skill": "React", "category": "Technical", "reason": "Mentioned in JD, implied by 'Frontend Dev' role", "importance": "high" }
            ],
            "analysis_summary": "Candidate has strong matching experience in..."
        }
    `;

    const imagePart = {
        inlineData: {
            data: fileBuffer.toString("base64"),
            mimeType: mimeType
        },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = result.response;
    const text = response.text();

    return JSON.parse(cleanJson(text));
}

async function scoreCandidate(resumeText, jobData, selectedSkills) {
    // No try-catch here either
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
        Perform a comprehensive candidate evaluation.
        
        JOB TITLE: ${jobData.title}
        VISIBLE JD: ${jobData.description} ${jobData.requirements}
        HIDDEN CRITERIA (Visible only to Admin): ${JSON.stringify(jobData.hidden_requirements)}
        
        CANDIDATE DATA:
        Resume Text/Summary: ${resumeText}
        Confirmed Skills (User selected): ${JSON.stringify(selectedSkills)}
        
        SCORING RULES:
        1. JD Match (70%): Skills match, responsibilities alignment.
        2. Hidden Criteria (20%): Must check against hidden reqs strictly.
        3. Experience (10%): Years of experience match.

        OUTPUT STRICT JSON:
        {
            "total_score": float,
            "jd_score": float (0-70),
            "hidden_score": float (0-20),
            "experience_score": float (0-10),
            "detailed_analysis": {
                "jd_match": { "matching_skills": [], "missing_skills": [], "reasoning": "" },
                "hidden_criteria": { "criteria_met": [], "criteria_not_met": [], "reasoning": "" },
                "experience": { "years_match": boolean, "reasoning": "" }
            },
            "recommendation": "Strong Match/Good Match/Fair Match/Weak Match"
        }
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return JSON.parse(cleanJson(response.text()));
}

function cleanJson(text) {
    // Remove markdown code blocks if present
    return text.replace(/```json/g, '').replace(/```/g, '').trim();
}

module.exports = { analyzeResume, scoreCandidate };
