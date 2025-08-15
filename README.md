# MindForge 🧠

Molten‑forge themed, AI‑tempered idea evaluation platform for RVCE coding events. Submit your pitch and get near‑instant rubric scoring + actionable feedback from Gemini AI with a live, privacy‑respecting leaderboard.

## 🌟 Features

- **AI Rubric Evaluation (5 Dimensions)**: `aiRelevance · creativity · impact · clarity · funFactor` (0–100 each) with server‑computed aggregate `totalScore`
- **Agentic-First Evaluation**: When web search keys are present, a retrieval + context bundling step precedes baseline Gemini scoring for more grounded feasibility/originality; transparently falls back if unavailable
- **Queue-Based Burst Handling**: Async submission endpoint prevents model bottlenecks during event spikes
- **Multi-Key Gemini Load Balancing**: Optional round‑robin across `GEMINI_API_KEYS` for higher throughput; safe deterministic fallback if AI unavailable
- **Live Leaderboard**: Light polling with secure backend‑only Firestore writes
- **Molten Forge Theme**: Ember orange glow accents over deep obsidian / charcoal gradient surfaces
- **Mobile-First UX**: Prioritized for phones; responsive grid scales to large displays
- **Secure Google Auth**: Firebase Authentication (Google Sign-In)
- **Private Feedback Storage**: Detailed per‑criterion scores + narrative feedback stored only at `users/{uid}.lastEvaluation` (not in public leaderboard)
- **Resilient Fallback Mode**: If Gemini fails, a clearly marked synthetic evaluation still returns structure (never blocks submissions)
- **Extensible Core**: Modular FastAPI services (`ai_service`, `firebase_service`, `evaluation_queue`) and clean React component architecture

## 🏗️ Architecture (High Level)

Frontend (React/Vite/Tailwind) → FastAPI API → (Agentic enrichment →) Gemini → Firestore (public + private slices)

- **Frontend**: React + Vite + Tailwind (single page, sectioned panels, molten gradient surfaces)
- **Backend**: FastAPI service with agentic-first AI evaluation pipeline, queue worker, multi-key Gemini client (round-robin)
- **Agentic Mode**: A lightweight retrieval pipeline (multi-query search → snippet scoring → micro summarization) builds a `context_bundle` injected into the evaluation prompt for more grounded scoring (feasibility, trends, originality). Transparently degrades if any step fails.
- **AI**: Google Gemini 2.5 Flash (JSON constrained prompt) + deterministic synthetic fallback
- **Data**: Firestore (public leaderboard subset + private user `lastEvaluation`)
- **Auth**: Firebase Auth (Google Sign-In, ID token verified client-side; backend currently trusts provided UID for event context – future: token verification middleware)
- **Deployment**: Vercel (frontend) + Render (backend)

## 🚀 Quick Start

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` to see the application.

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
python main.py
```

API default: `http://localhost:8000`

Primary async submission flow:
1. POST `/ideas/submit_async` → `{ jobId, status: "queued" }`
2. Poll GET `/ideas/status/{jobId}` until `status: completed` with evaluation payload

The legacy direct sync path can be added if needed, but async queue is recommended under load.

For more details, see:
- Frontend guide: `frontend/README.md`
- Backend guide: `backend/README.md`

## 🎨 Theming & UI

Forged interface inspired by molten metal cooling:
- **Color Palette**: Deep charcoal / onyx bases (`#0b0604`–`#1b0f0a`) with ember accents (`#ff6b00`, `#ff9f40`) and subtle radial glows
- **Glow & Depth**: Layered gradients + thin semi‑transparent borders (`border-[#3a2516]`) for card edges
- **Micro Interactions**: Animated fact bar, pulsing status dots, smooth opacity transitions
- **Mobile First**: Sticky navbar + stacked panels; expands to multi-column on widescreens
- **Accessibility**: High contrast text, focus‑safe color choices, reduced motion friendly defaults

## 🔧 Configuration

### Environment Variables

**Frontend (`frontend/.env`):**
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...firebaseapp.com
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
VITE_API_BASE_URL=http://localhost:8000
# Production: VITE_API_BASE_URL=https://<your-backend>.onrender.com
```

**Backend (`backend/.env`):** (choose ONE credential style)
```
DEBUG=true

# Gemini (single or multi-key)
GEMINI_API_KEY=sk-...
# Optional comma-separated list to enable round-robin load balancing
GEMINI_API_KEYS=sk-1,sk-2,sk-3

# CORS
CORS_ORIGINS=http://localhost:5173,https://your-frontend.vercel.app
# Optional wildcard for preview deployments
# CORS_ALLOW_ORIGIN_REGEX=^https:\/\/.*vercel\.app$

# Firebase (split secret form – preferred for Render dashboard)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=...
FIREBASE_CLIENT_ID=...
FIREBASE_CLIENT_X509_CERT_URL=...

# (OR) Single JSON file approach
# FIREBASE_SERVICE_ACCOUNT_KEY=./firebase_admin_sdk.json
```

Optional web enrichment (agentic mode activates when BOTH provided):
```
GOOGLE_CSE_API_KEY=...
GOOGLE_CSE_CX=...
```

## 📊 Data Flow

1. **Auth**: User signs in with Google (Firebase Auth)
2. **Profile Setup**: User supplies branch + rollNumber (stored in Firestore user doc)
3. **Async Submission**: Client POSTs idea → `/ideas/submit_async` (guard: one submission per UID)
4. **Queue & AI Eval (Agentic-First)**: Worker dequeues → IF CSE keys present attempts agentic retrieval + enriched prompt → else baseline prompt → parses & validates → computes `totalScore` (synthetic fallback only if Gemini unreachable)
5. **Persistence**:
	- Public slice `{uid, name, branch, score: totalScore}` → `leaderboard` collection
	- Private full `EvaluationResponse` → `users/{uid}.lastEvaluation`
6. **Client Polls**: `/ideas/status/{jobId}` until `status=completed` then displays feedback (also cached locally for UX)
7. **Leaderboard Polling**: Lightweight periodic fetch; future: Server‑Sent Events

## 🔒 Privacy & Security

- **Public**: `name`, `branch`, `totalScore`
- **Private**: All per‑criterion scores + narrative feedback + evaluatedAt timestamp
- **No Overexposure**: No raw ideas or detailed feedback stored in public collections
- **Backend Gatekeeping**: Only backend holds Firestore Admin; frontend never writes Firestore directly
- **Resilience**: Fallback evaluation clearly labeled; prevents denial of service if AI limits hit
- **Future Hardening**: Planned ID token verification & rate limiting per UID/IP

## 🚢 Deployment

### Frontend (Vercel)
1. Connect repo → Vercel
2. Add env vars (all `VITE_...` + `VITE_API_BASE_URL`)
3. Trigger build (auto on push)

### Backend (Render)
1. New Web Service → Python / FastAPI
2. Add env vars (Gemini keys, Firebase split creds, CORS)
3. Start service (configure autoscaling if high submission bursts expected)
4. Monitor logs for AI fallback warnings (indicates key exhaustion / quota)

## 🛠️ Tech Stack

Frontend: React 19 · Vite · Tailwind · Firebase Auth · Lucide Icons
Backend: FastAPI · Gemini 2.5 Flash · Firebase Admin SDK · Pydantic
Infra: Firestore · Vercel (UI) · Render (API)
Support: Optional Google CSE (search enrichment), multi-key Gem usage

## 📝 License

© 2025 RVCE Coding Club. Built for educational purposes.

---

**Ready to temper innovation?** Drop your idea into the forge. 🔥