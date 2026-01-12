CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('user', 'admin')) NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS companies (
    company_id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS jobs (
    job_id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    visible_jd JSON, -- Structured JSON of JD
    hidden_requirements JSON, -- JSON of hidden criteria
    status TEXT DEFAULT 'Active', -- Active, Closed
    posted_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    views_count INTEGER DEFAULT 0,
    FOREIGN KEY (company_id) REFERENCES companies(company_id)
);

CREATE TABLE IF NOT EXISTS applications (
    application_id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    resume_file_path TEXT NOT NULL,
    selected_skills JSON, -- List of skills user checked
    application_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'Under Review',
    total_score REAL DEFAULT 0,
    jd_score REAL DEFAULT 0,
    hidden_score REAL DEFAULT 0,
    experience_score REAL DEFAULT 0,
    ai_analysis JSON, -- Full analysis from Gemini
    FOREIGN KEY (job_id) REFERENCES jobs(job_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
