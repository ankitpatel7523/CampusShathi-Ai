# CampusSathi AI

CampusSathi AI is a study assistant for college students. It helps with PDF study chat, AI-generated quizzes, voice viva practice, handwritten notes scanning, flashcards, and exam planning.

## Features
- PDF upload and study Q&A
- Quiz generation from uploaded material
- Voice viva practice with text fallback
- Handwritten notes OCR and flashcards
- Study planner and task tracking
- User-specific dashboard and profile data

## Setup
1. Copy `.env.example` to `.env`
2. Fill in your API keys if you want AI features enabled
3. Install dependencies:
   npm install
4. Run the app:
   npm run dev

## Notes
- This project is designed as a real MVP, not a hardcoded demo.
- Demo login and fake startup data are disabled by default.
- If no AI key is configured, the app fails gracefully instead of returning fake data.
