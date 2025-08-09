# IdeaArena Frontend

React + Vite + Tailwind CSS SPA for the IdeaArena event. Mobile-first, dark navy theme with real-time Firebase listeners and Google Sign-In.

## Tech Stack
- React 19 + Vite
- Tailwind CSS 3
- Firebase Web SDK (Auth + Realtime Database)
- Lucide Icons

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
VITE_FIREBASE_DATABASE_URL=https://<project-id>-default-rtdb.firebaseio.com
VITE_API_BASE_URL=http://localhost:8000
```

## Available Scripts
- `npm run dev` – start Vite dev server
- `npm run build` – production build
- `npm run preview` – preview built app

## Project Structure
```
frontend/
├─ index.html
├─ src/
│  ├─ App.jsx
│  ├─ index.css
│  ├─ firebase_config.js
│  └─ components/
│     ├─ Navbar.jsx
│     ├─ Login.jsx
│     ├─ UserProfileSetup.jsx
│     ├─ EventInfo.jsx
│     ├─ IdeaSubmissionForm.jsx
│     ├─ FeedbackCard.jsx
│     └─ Leaderboard.jsx
├─ public/
│  ├─ RVCE_Logo_With_Text.png
│  └─ CCLogo_BG_Removed.png
├─ tailwind.config.js
├─ postcss.config.js
└─ vite.config.js
```

## Design Notes
- Dark navy palette via Tailwind theme (`dark` and `navy` scales)
- Centered sections with decorative grid and radial glows
- Cards use subtle borders and shadows (`card-glow` helper)

## Firebase
- Auth: Google Sign-In
- Database: Realtime DB for `/leaderboard` (public read, backend-only write)

## Troubleshooting
- If Tailwind classes like `bg-dark-800` don’t work, ensure Tailwind is set up with `tailwindcss` in `postcss.config.js` and run a fresh dev server.
- For image sizing, prefer the `Logo` component to preserve aspect ratios.

## Deployment
- Recommended: Vercel
- Set the same `.env` keys in Vercel Project Settings → Environment Variables

© 2025 RVCE Coding Club
