# CampusSathi AI - REST API Documentation 📡

Base URL: `/api`  
Authentication: `Authorization: Bearer <token>` or session cookie `campussathi_token`

---

## 1. Authentication & Profile
- `POST /api/auth/signup` - Register a new student or teacher account
- `POST /api/auth/login` - Authenticate with email and password
- `GET /api/auth/me` - Fetch active user profile, XP, streak, and role
- `POST /api/auth/switch-role` - Switch active session between `student` and `teacher` mode (for testing and hybrid roles)

---

## 2. Campus Notes Marketplace (Notes Hub ⭐)
- `GET /api/notes-library` - Query community notes with filters (`subject`, `branch`, `semester`, `university`, `search`)
- `POST /api/notes-library/upload` - Upload PDF notes, set title, branch, and optional price/free flag
- `GET /api/notes-library/:id` - Fetch single note details, ratings, and download URL
- `POST /api/notes-library/:id/rate` - Submit a 1-5 star review (⭐) with feedback comment
- `POST /api/notes-library/:id/verify` - [Teacher Only] Verify note with faculty badge

---

## 3. Campus Print & Hostel Delivery Hub
- `POST /api/printing/calculate` - Estimate print cost from page count, copies, color mode, and binding
- `GET /api/printing/orders` - List current user's print orders with live delivery status
- `POST /api/printing/orders` - Place a new campus print order (hostel address, urgency, specifications)
- `POST /api/printing/orders/:id/status` - [Admin / Delivery] Update order progress (`order_placed` $\to$ `printing` $\to$ `out_for_delivery` $\to$ `delivered`)

---

## 4. English AI Teacher & Placement Coach
- `POST /api/english/chat` - Conversational English session with grammar correction and speech tips
- `GET /api/english/history` - Retrieve previous interview scores and confidence metrics

---

## 5. Teacher / Faculty Management
- `GET /api/teacher/classes` - List faculty classes with student count and weak topic radar
- `POST /api/teacher/classes` - Create a new academic class / subject section
- `POST /api/teacher/assignments` - Generate AI-assisted assignment / test from topic and syllabus
- `GET /api/teacher/analytics` - View aggregated student performance analytics and attendance

---

## 6. Student AI Learning Suite
- `POST /api/documents/upload` - Ingest PDF, split into chunks, index in vector store
- `POST /api/chat` - Multi-turn RAG conversation with citation verification
- `POST /api/quiz/generate` - Generate 5 MCQ questions strictly grounded in uploaded notes
- `POST /api/quiz/attempt` - Submit answers, calculate score, play sound cues, and award XP
- `POST /api/viva/start` - Initiate spoken faculty examination session
- `POST /api/viva/turn` - Submit spoken student answer, receive 0-10 score and critique
- `GET /api/leaderboard` - Fetch college-wide and subject-specific top performers
