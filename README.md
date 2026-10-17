# CampusSathi AI - All-in-One AI Study Companion

A colourful, production-grade AI study platform for Indian college students.
Upload notes, chat with PDFs, quiz yourself with keyboard shortcuts, practice spoken vivas, scan handwritten notes into SM-2 flashcards, and let an AI agent plan your semester exams.

## Quick Start in 4 Commands

```bash
# 1. Clone & install dependencies
npm install

# 2. Configure environment (copy example)
cp .env.example .env

# 3. Start development server (Full-stack Express + Vite)
npm run dev

# 4. Open in browser
# Visit http://localhost:3000
```

## Features

1. **Dashboard & Analytics**: Study streak flames, XP & leveling, 14-day study time area chart, topic mastery radar, weak topics heatmap, and upcoming exam countdown chips.
2. **Study Chat (PDF RAG)**: Upload PDF notes (up to 25MB), vector + keyword hybrid chunk search, exact `[file, p.N]` citations, verified sources drawer, and out-of-scope question guard without making LLM calls.
3. **Verified AI Quiz**: Exam-pattern MCQs with 1-4 and A-D keyboard shortcuts, instant verified citations, timer countdown, and celebration confetti.
4. **Voice Viva**: Practice technical viva & placement rounds with microphone push-to-talk, Groq Whisper transcription, Web Speech API audio question playback, and faculty-grade evaluation.
5. **Study Planner Agent**: Adaptive day-by-day timetable prioritizing identified weak topics, task completion toggles, subject progress rings, and `.ics` calendar export.
6. **Notes Scanner & SM-2 Flashcards**: Gemini vision OCR for handwritten notes, structured markdown notes, summary, and Spaced Repetition (Again/Hard/Good/Easy) flashcard review.
7. **Profile & Data Sovereignty**: Avatar customizer, dark/light theme, language switcher (English, हिंदी, Hinglish), live AI connection probe, and 1-click JSON data export.

## File & Data Storage

- SQLite Database: `data/campussathi.db` (auto-created via `node:sqlite`)
- Uploaded PDF Files: `data/uploads/`
- User Data Isolation: Every table enforces strict `user_id` filtering.

## AI Provider Fallback Architecture

| Feature | Primary Provider | Fallback Provider |
|---|---|---|
| Study Chat | Groq (`llama-3.3-70b-versatile`) | Gemini (`gemini-2.5-flash`) |
| Embeddings | Gemini (`text-embedding-004`) | Hybrid BM25 keyword matching |
| Viva Speech-to-Text | Groq Whisper (`whisper-large-v3-turbo`) | Interactive text input |
| Viva Grading | Groq (`llama-3.3-70b-versatile`) | Gemini (`gemini-2.5-flash`) |
| Notes Scanner OCR | Gemini Vision | Structured markdown fallback |

## Troubleshooting Table

| Issue | Cause | Fix |
|---|---|---|
| AI Quota Exceeded (429) | Rate limits on free tier | Wait a few seconds or configure a backup API key |
| Microphone blocked | Browser permission not granted | Click the lock icon in address bar to allow microphone, or use text fallback |
| Missing API Key | `GEMINI_API_KEY` not in env | Set key in `.env` or AI Studio secrets panel |
| Out of syllabus warning | Query concepts not found in PDF | The app strictly enforces academic integrity and alerts when material lacks the answer |
