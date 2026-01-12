const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../../resume_screener.db');
const schemaPath = path.resolve(__dirname, 'schema.sql');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema, (err) => {
        if (err) {
            console.error('Error initializing database schema:', err.message);
        } else {
            console.log('Database schema initialized.');
            // Migration: Add bio column if not exists
            db.run("ALTER TABLE users ADD COLUMN bio TEXT", (err) => {
                if (err && !err.message.includes('duplicate column name')) {
                    console.error("Error adding bio column:", err.message);
                } else {
                    console.log("Migration: Check bio column - Done.");
                }
            });
        }
    });
}

module.exports = db;
