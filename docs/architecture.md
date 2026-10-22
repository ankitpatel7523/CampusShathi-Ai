# CampusSathi AI - Enterprise Startup Architecture 🎓🚀

CampusSathi AI is an all-in-one AI-driven academic ecosystem and campus services super-app designed for college students and faculty across Indian universities.

---

## 1. High-Level System Architecture

```
                                  [ Students & Faculty (Browser / PWA) ]
                                                    │
                                     HTTPS / WSS / REST API
                                                    │
                                    ┌───────────────▼───────────────┐
                                    │      Reverse Proxy / CDN      │
                                    │       (Cloudflare / Nginx)    │
                                    └───────────────┬───────────────┘
                                                    │
                                    ┌───────────────▼───────────────┐
                                    │     Express API Gateway       │
                                    │ (Node.js 22 / TypeScript tsx) │
                                    └───────┬───────────────┬───────┘
                                            │               │
                     ┌──────────────────────┴──────┐ ┌──────┴──────────────────────┐
                     ▼                             ▼ ▼                             ▼
          [ Auth & Role RBAC ]             [ AI Orchestrator ]            [ Campus Logistics ]
          - Student Dashboard              - Gemini 3.8 Flash             - Print Hub Engine
          - Faculty / Teacher Portal       - Groq Qwen 27B                - Local Print Aggregator
          - Campus Captains                - Whisper Voice STT            - Hostel Delivery Router
          - Admin Moderation               - Native Web Audio TTS         - UPI / Razorpay Gateway
                     │                             │                               │
                     └──────────────────────┬──────┴───────────────────────────────┘
                                            ▼
                               [ Persistent Data Tier ]
                 Local Dev / Staging: SQLite with DatabaseSync (`data/campussathi.db`)
                 Production Cloud: MongoDB Atlas Cluster / Google Cloud Firestore
                 Object Store: Cloudinary / Cloud Storage for PDFs & Scan OCRs
```

---

## 2. Core Functional Modules

### A. Student Learning Hub
1. **AI Study Chat (PDF RAG):** Upload any university syllabus, lab manual, or handwritten PDF. Uses chunk embeddings and BM25 hybrid search to answer with exact page citations (`[Document.pdf, p.4]`).
2. **AI Quiz Arena & Leaderboard:** Dynamic MCQ generation from uploaded notes with Web Audio sound effects, instant explanations, and college-wide podium rankings.
3. **Voice Viva Simulator:** Real-time spoken academic viva with examiner persona, push-to-talk mic, Whisper transcription, and 0-10 faculty evaluation rubric.
4. **English & Placement AI Coach:** Conversational voice mock interviews (HR, Technical, GD), live grammar correction, and placement readiness score.
5. **Night Before Exam (Pass Mode):** Top 10 high-frequency PYQs (Previous Year Questions) and 5-minute audio capsules for last-minute exam passing.

### B. Faculty & Teacher Portal
1. **Classroom Insights:** Heatmap of topics where students struggle most in viva and quizzes.
2. **1-Click Assignment & Quiz Creator:** Generates standardized question papers from course syllabus.
3. **Faculty Verification Badge:** Review community-uploaded notes and award the "Faculty Certified" gold badge (increasing trust and downloads).

### C. Campus Marketplace & Star Economy (⭐)
1. **Crowdsourced Notes Library:** Students upload handwritten notes.
2. **Star Hype Engine:** Peers upvote high-quality notes with stars.
3. **Creator Monetization:** Toppers earn Campus Coins or micro-payments (₹19 - ₹49) when other students unlock their notes (70% to creator, 30% platform take-rate).

### D. Campus Print & Hostel Delivery Service
1. **Automated Page Counter:** Reads PDF structure and calculates exact page count instantly.
2. **Custom Binding Configurator:** B&W (₹0.80) / Color (₹2.50), Single or Back-to-Back, Spiral Binding (₹25), Hardbound (₹120).
3. **Next-Morning 9 AM Delivery:** Directly to hostel gate or college canteen via local photostat shop tie-up.

---

## 3. Production Environment & Real-World Configuration

To switch the local SQLite dev setup to a production-grade cloud deployment:
- **Database:** Connect MongoDB Atlas by setting `MONGODB_URI` in `.env` or Firebase Firestore by setting `FIREBASE_PROJECT_ID`.
- **File Storage:** Use Cloudinary (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) for PDF uploads.
- **AI Models:** Gemini 3.8 Flash for multi-turn RAG reasoning; Groq for ultra-low latency voice chat.
- **Payments:** Integrate Razorpay Node SDK in `backend/src/services/payments/razorpay.service.ts` for UPI QR code checkout.
