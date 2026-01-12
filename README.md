# SkillSync – AI Resume Screening & JD Matching System

SkillSync is an AI-powered resume screening application that analyzes resumes against job descriptions,
generates matching scores, and identifies missing skills to improve recruitment efficiency.

## Features
- Resume upload and parsing
- Job description comparison
- AI-based resume–JD matching score
- Skill gap identification
- Secure authentication using JWT
- Role-based access for applicants and recruiters

## Tech Stack
- Frontend: React, Vite, CSS
- Backend: Node.js, Express.js
- Database: SQLite
- AI/NLP: Generative AI
- Authentication: JWT
- Tools: Git, GitHub

## Project Structure
skillsync/
├── client/        # Frontend source code
├── server/        # Backend APIs and logic
├── README.md
└── .gitignore

## Setup Instructions

### Prerequisites
- Node.js (v18 or above)
- npm

### Clone Repository
git clone https://github.com/IXpreetham/skillsync.git
cd skillsync

### Frontend Setup
cd client
npm install
npm run dev

### Backend Setup
cd ../server
npm install
npm start

## Environment Variables
Create a `.env` file inside the server folder and add:

AI_API_KEY=your_api_key_here
JWT_SECRET=your_secret_key


## Future Enhancements
- Resume ranking dashboard
- Advanced NLP-based skill normalization
- Hidden requirement matching for companies
- Cloud deployment and scalability improvements
