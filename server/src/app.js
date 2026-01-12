const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database init
const db = require('./db');

const authRoutes = require('./routes/auth');

const jobsRoutes = require('./routes/jobs');
const applicationRoutes = require('./routes/applications');

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/applications', applicationRoutes);

app.get('/', (req, res) => {
    res.send('AI Resume Screener API is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
