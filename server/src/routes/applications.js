const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { analyzeResume, scoreCandidate } = require('../services/gemini');
const router = express.Router();

// Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);
    const jwt = require('jsonwebtoken');
    jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Multer Setup
const upload = multer({
    storage: multer.memoryStorage(), // Store in memory for immediate processing
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// POST /api/applications/analyze - Step 1: Upload & Analyze
router.post('/analyze', authenticateToken, upload.single('resume'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No resume file uploaded' });

    const { jobId } = req.body;

    db.get('SELECT * FROM jobs WHERE job_id = ?', [jobId], async (err, job) => {
        if (err || !job) return res.status(404).json({ error: 'Job not found' });

        try {
            // Call Gemini
            const analysis = await analyzeResume(req.file.buffer, req.file.mimetype, job.description + "\n" + job.requirements);
            res.json({ analysis });
        } catch (error) {
            console.error("Gemini Analysis Error:", error); // Log the full error
            res.status(500).json({ error: "AI Service Error: " + error.message });
        }
    });
});

// POST /api/applications/apply - Step 2: Submit Final Application
// Note: In a real app, we would upload the file to S3 here. 
// For this demo, we will save it to a local 'uploads' folder.
const diskStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = './uploads';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const uploadDisk = multer({ storage: diskStorage });

router.post('/apply', authenticateToken, uploadDisk.single('resume'), async (req, res) => {
    const { jobId, selectedSkills } = req.body;
    const userId = req.user.userId;
    const resumePath = req.file ? req.file.path : 'path/to/resume.pdf';
    const skills = JSON.parse(selectedSkills || '[]');

    // Get Job Details for Final Scoring
    db.get('SELECT * FROM jobs WHERE job_id = ?', [jobId], async (err, job) => {
        if (err || !job) return res.status(404).json({ error: 'Job not found' });

        // Calculate Score
        // Ideally we pass the resume text extracted earlier, but efficient way is to passing 'skills' + 'job'
        // We will do a lightweight scoring or re-analysis.
        // For efficiency, we will assume we extracted text or just pass "Candidate Attributes: " + skills.join(', ')

        const jobData = {
            title: job.title,
            description: job.description,
            requirements: job.requirements,
            hidden_requirements: JSON.parse(job.hidden_requirements || '{}')
        };

        // Mocking resume text from skills for the scoring prompt
        const resumeSummary = "Candidate Skills: " + skills.join(', ');

        let scoreData = await scoreCandidate(resumeSummary, jobData, skills);

        db.run(
            `INSERT INTO applications (job_id, user_id, resume_file_path, selected_skills, total_score, jd_score, hidden_score, experience_score, ai_analysis, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                jobId, userId, resumePath,
                JSON.stringify(skills),
                scoreData.total_score,
                scoreData.jd_score,
                scoreData.hidden_score,
                scoreData.experience_score,
                JSON.stringify(scoreData),
                'Under Review'
            ],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, applicationId: this.lastID });
            }
        );
    });
});

// GET /api/applications/my - User's applications
router.get('/my', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    db.all(`
        SELECT applications.*, jobs.title, jobs.company_id, companies.company_name 
        FROM applications 
        JOIN jobs ON applications.job_id = jobs.job_id 
        JOIN companies ON jobs.company_id = companies.company_id
        WHERE applications.user_id = ?
        ORDER BY application_date DESC
    `, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const apps = rows.map(r => ({
            ...r,
            selected_skills: JSON.parse(r.selected_skills || '[]')
        }));
        res.json(apps);
    });
});

// GET /api/applications/:id - Admin/User: Get single application
router.get('/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    db.get(`
        SELECT applications.*, users.name, users.email, users.phone, jobs.title 
        FROM applications 
        JOIN users ON applications.user_id = users.user_id 
        JOIN jobs ON applications.job_id = jobs.job_id
        WHERE application_id = ?
    `, [id], (err, row) => {
        if (err || !row) return res.status(404).json({ error: 'Application not found' });

        // Access Control
        if (req.user.role === 'admin') {
            // Check if admin owns the job company
            // Check if admin owns the job company
            // First get the job's company_id from the joined query, but wait, we need to verify if the admin's user_id matches the company.
            // We can check if the company associated with this job belongs to the current admin user.
            db.get('SELECT company_id FROM companies WHERE user_id = ?', [req.user.userId], (err, adminCompany) => {
                if (err || !adminCompany) return res.status(403).json({ error: 'Not authorized as company admin' });

                // row.company_id comes from JOIN jobs.company_id
                if (row.company_id !== adminCompany.company_id) {
                    return res.status(403).json({ error: 'This application belongs to another company' });
                }
                // Success
                res.json(row);
            });
            return; // Return here to avoid falling through to user check or re-sending res
        } else if (req.user.userId !== row.user_id) {
            return res.sendStatus(403);
        }

        res.json(row);
    });
});

// GET /api/applications/job/:jobId - Admin: Get all applicants for a job
router.get('/job/:jobId', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);

    const { jobId } = req.params;

    // Verify company owns this job
    db.get('SELECT * FROM jobs WHERE job_id = ?', [jobId], (err, job) => {
        if (err || !job) return res.status(404).json({ error: 'Job not found' });

        // Check if user owns company
        db.get('SELECT * FROM companies WHERE company_id = ? AND user_id = ?', [job.company_id, req.user.userId], (err, company) => {
            if (err || !company) return res.status(403).json({ error: 'Unauthorized' });

            db.all(`
                SELECT applications.*, users.name, users.email, users.phone 
                FROM applications 
                JOIN users ON applications.user_id = users.user_id 
                WHERE job_id = ? 
                ORDER BY total_score DESC
             `, [jobId], (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                const apps = rows.map(r => ({
                    ...r,
                    selected_skills: JSON.parse(r.selected_skills || '[]'),
                    ai_analysis: JSON.parse(r.ai_analysis || '{}')
                }));
                res.json(apps);
            });
        });
    });
});

module.exports = router;
