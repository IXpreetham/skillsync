const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const router = express.Router();

const SECRET = process.env.JWT_SECRET || 'secret';

// Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);
    jwt.verify(token, SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Register
router.post('/signup', async (req, res) => {
    const { email, password, role, name, phone, company_name } = req.body;

    if (!email || !password || !role || !name) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.serialize(() => {
            db.run(
                `INSERT INTO users (email, password_hash, role, name, phone) VALUES (?, ?, ?, ?, ?)`,
                [email, hashedPassword, role, name, phone],
                function (err) {
                    if (err) {
                        return res.status(400).json({ error: 'Email already exists or invalid data' });
                    }
                    const userId = this.lastID;

                    if (role === 'admin' && company_name) {
                        db.run(
                            `INSERT INTO companies (company_name, user_id) VALUES (?, ?)`,
                            [company_name, userId],
                            (err) => {
                                if (err) console.error('Error creating company:', err);
                            }
                        );
                    }

                    const token = jwt.sign({ userId, role, name }, SECRET, { expiresIn: '24h' });
                    res.status(201).json({ token, user: { userId, role, name, email } });
                }
            );
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
        if (err || !user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.user_id, role: user.role, name: user.name }, SECRET, { expiresIn: '24h' });
        res.json({ token, user: { userId: user.user_id, role: user.role, name: user.name, email: user.email } });
        res.json({ token, user: { userId: user.user_id, role: user.role, name: user.name, email: user.email } });
    });
});

// GET /profile
router.get('/profile', authenticateToken, (req, res) => {
    const userId = req.user.userId; // Fixed: using userId from token
    db.get('SELECT name, email, phone, bio, role FROM users WHERE user_id = ?', [userId], (err, row) => {
        if (err || !row) return res.status(404).json({ error: 'User not found' });
        res.json(row);
    });
});

// PUT /profile
router.put('/profile', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const { name, phone, bio } = req.body;

    db.run(
        'UPDATE users SET name = ?, phone = ?, bio = ? WHERE user_id = ?',
        [name, phone, bio, userId],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Profile updated successfully' });
        }
    );
});

module.exports = router;
