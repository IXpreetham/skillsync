const express = require('express');
const db = require('../db');
const router = express.Router();

// Middleware to verify token and role
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) return res.sendStatus(401);

    const jwt = require('jsonwebtoken');
    const SECRET = process.env.JWT_SECRET || 'secret';

    jwt.verify(token, SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// GET /jobs - List all ACTIVE jobs (for users) or ALL jobs (for specific company)
router.get('/', authenticateToken, (req, res) => {
    const { role, userId } = req.user;

    if (role === 'admin') {
        // Find company_id for this user
        db.get('SELECT company_id FROM companies WHERE user_id = ?', [userId], (err, row) => {
            if (err || !row) return res.status(404).json({ error: 'Company not found' });

            db.all('SELECT * FROM jobs WHERE company_id = ? ORDER BY posted_date DESC', [row.company_id], (err, rows) => {
                if (err) res.status(500).json({ error: err.message });
                else {
                    // Start parsing JSON fields safely
                    const jobs = rows.map(j => ({
                        ...j,
                        visible_jd: JSON.parse(j.visible_jd || '{}'),
                        hidden_requirements: JSON.parse(j.hidden_requirements || '{}')
                    }));
                    res.json(jobs);
                }
            });
        });
    } else {
        // User sees all active jobs
        // We might want to filter out hidden reqs here but schema says keep them separate
        db.all("SELECT jobs.*, companies.company_name FROM jobs JOIN companies ON jobs.company_id = companies.company_id WHERE status = 'Active' ORDER BY posted_date DESC", [], (err, rows) => {
            if (err) res.status(500).json({ error: err.message });
            else {
                const jobs = rows.map(j => ({
                    ...j,
                    visible_jd: JSON.parse(j.visible_jd || '{}'),
                    hidden_requirements: undefined // Hide from user
                }));
                res.json(jobs);
            }
        });
    }
});

// POST /jobs - Create new job (Admin only)
router.post('/', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);

    const { title, description, requirements, visible_jd, hidden_requirements } = req.body;
    // visible_jd and hidden_reqs should be objects

    db.get('SELECT company_id FROM companies WHERE user_id = ?', [req.user.userId], (err, row) => {
        if (err || !row) return res.status(404).json({ error: 'Company not found' });

        const stmt = db.prepare(`
            INSERT INTO jobs (company_id, title, description, requirements, visible_jd, hidden_requirements) 
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            row.company_id,
            title,
            description,
            requirements,
            JSON.stringify(visible_jd),
            JSON.stringify(hidden_requirements),
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ id: this.lastID, message: 'Job posted successfully' });
            }
        );
        stmt.finalize();
    });
});

// GET /jobs/:id - Get Job Details
router.get('/:id', authenticateToken, (req, res) => {
    const jobId = req.params.id;

    // Join with company info
    db.get('SELECT jobs.*, companies.company_name FROM jobs JOIN companies ON jobs.company_id = companies.company_id WHERE job_id = ?', [jobId], (err, row) => {
        if (err || !row) return res.status(404).json({ error: 'Job not found' });

        const job = {
            ...row,
            visible_jd: JSON.parse(row.visible_jd || '{}'),
            // Only show hidden reqs to the owner (admin)
            hidden_requirements: (req.user.role === 'admin') ? JSON.parse(row.hidden_requirements || '{}') : undefined
        };

        // Increment views count if user
        if (req.user.role === 'user') {
            db.run('UPDATE jobs SET views_count = views_count + 1 WHERE job_id = ?', [jobId]);
        }

        res.json(job);
    });
});


// PUT /jobs/:id - Update Job
router.put('/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { id } = req.params;
    const { title, description, requirements, visible_jd, hidden_requirements } = req.body;

    // Check ownership
    db.get('SELECT company_id FROM companies WHERE user_id = ?', [req.user.userId], (err, co) => {
        if (err || !co) return res.status(404).json({ error: 'Company not found' });

        db.get('SELECT company_id FROM jobs WHERE job_id = ?', [id], (err, job) => {
            if (err || !job) return res.status(404).json({ error: 'Job not found' });
            if (job.company_id !== co.company_id) return res.status(403).json({ error: 'Unauthorized to update this job' });

            const stmt = db.prepare(`
                UPDATE jobs SET title = ?, description = ?, requirements = ?, visible_jd = ?, hidden_requirements = ?
                WHERE job_id = ?
            `);
            stmt.run(title, description, requirements, JSON.stringify(visible_jd), JSON.stringify(hidden_requirements), id, function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Job updated successfully' });
            });
            stmt.finalize();
        });
    });
});

// DELETE /jobs/:id - Delete Job
router.delete('/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { id } = req.params;

    // Check ownership
    db.get('SELECT company_id FROM companies WHERE user_id = ?', [req.user.userId], (err, co) => {
        if (err || !co) return res.status(404).json({ error: 'Company not found' });

        db.get('SELECT company_id FROM jobs WHERE job_id = ?', [id], (err, job) => {
            if (err || !job) return res.status(404).json({ error: 'Job not found' });
            if (job.company_id !== co.company_id) return res.status(403).json({ error: 'Unauthorized to delete this job' });

            // Ideally delete applications too or cascade. SQLite cascade might needs ON DELETE CASCADE in schema.
            // For now just delete job.
            db.run('DELETE FROM jobs WHERE job_id = ?', [id], function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Job deleted' });
            });
        });
    });
});

module.exports = router;
