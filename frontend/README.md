# MindForge Frontend 🔥

React + Vite + Tailwind single‑page interface for the MindForge event. Molten forge aesthetic (embers + obsidian), AI‑tempered rubric scoring, async submission queue, live leaderboard polling, and Google Sign‑In.

## Tech Stack
- React 19 + Vite
- Tailwind CSS 3 (utility-first molten theme)
- Firebase Web SDK (Auth only; no direct Firestore writes)
- Lucide Icons
- Async API → FastAPI queue → Gemini 2.5 Flash

## Quick Start

```powershell
# from repo root
cd frontend
npm install
npm run dev
```

App runs at http://localhost:5173

## Environment (.env)
Create a `frontend/.env` with your project values:

```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_API_BASE_URL=http://localhost:8000
```

## Available Scripts
- `npm run dev` – start Vite dev server
- `npm run build` – production build
- `npm run preview` – preview built app

## Project Structure (Key Files)
```
frontend/
├─ index.html
├─ src/
│  ├─ App.jsx
│  ├─ firebase_config.js
│  ├─ components/
│  │  ├─ Navbar.jsx
│  │  ├─ AIFunFactBar.jsx   # Rotating AI fact ticker
│  │  ├─ Login.jsx
│  │  ├─ UserProfileSetup.jsx
│  │  ├─ EventInfo.jsx
│  │  ├─ IdeaSubmissionForm.jsx
│  │  ├─ FeedbackCard.jsx   # Displays 5 criteria + feedback
│  │  └─ Leaderboard.jsx
│  └─ utils/
│     ├─ api.js             # Wrapper for backend calls (async status polling)
│     ├─ auth.js            # Firebase auth helpers
│     └─ storage.js         # Local persistence (feedback cache)
├─ tailwind.config.js
├─ postcss.config.js
└─ vite.config.js
```

## Design Notes
- Molten / forge motif: ember gradients, subtle orange edge glows, low-noise backgrounds
- Sticky translucent navbar + rotating AI fact bar for engagement
- Panelized layout: submission, feedback, leaderboard stacked on mobile → multi-column progressively
- Accessibility: high contrast palette; minimal reliance on color alone (score labels)
- Smooth micro animations (opacity / glow pulses) kept lightweight for mobile GPUs

## Data & Evaluation Model
- 5 rubric dimensions: aiRelevance, creativity, impact, clarity, funFactor (0–100 integers)
- `totalScore` computed server-side (average, rounded)
- Private detailed evaluation pulled once after completion and cached locally
- Public leaderboard shows only name, branch, totalScore
- Optional backend agentic enrichment: if server has Google CSE credentials, it performs lightweight multi-query web search + snippet summarization before scoring (transparent to client).

## Submission Flow (Async)
1. User submits idea → POST `/ideas/submit_async`
2. Receive `{ jobId, status: "queued" }`
3. Poll `/ideas/status/{jobId}` until `status: completed`
4. Display structured scores + feedback; persist to localStorage
5. Leaderboard polling fetches updated ranking list

## Troubleshooting
- Missing glow styles? Ensure dev server restarted after Tailwind config edits.
- Scores not appearing? Check polling network calls; confirm backend job `status` is `completed`.
- Fallback evaluation? UI will mark if AI wasn't available (still valid structure).
- Grounded vs baseline scoring? If agentic mode active server-side you'll implicitly benefit—no client changes required.
- Auth popup blocked? Allow popups for localhost:5173.

## Deployment
- Recommended: Vercel
- Set the same `.env` keys in Vercel Project Settings → Environment Variables

© 2025 RVCE Coding Club
