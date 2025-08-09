# IdeaArena 🚀

AI-powered idea evaluation platform for RVCE coding events. Submit your business ideas and get instant feedback from Gemini AI with live leaderboards!

## 🌟 Features

- **AI-Powered Evaluation**: Get instant feedback on your business ideas using Google's Gemini AI
- **Real-time Leaderboard**: Live rankings updated instantly as new ideas are submitted
- **Mobile-First Design**: Sleek, dark-themed interface optimized for mobile devices
- **Secure Authentication**: Google Sign-In with Firebase authentication
- **Private Feedback**: Detailed AI feedback stored locally, only scores are public
- **Professional UI**: Modern design with smooth animations and responsive layout

## 🏗️ Architecture

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: FastAPI + Gemini AI
- **Database**: Firebase Realtime Database
- **Authentication**: Firebase Auth (Google Sign-In)
- **Deployment**: Frontend on Vercel, Backend on Render

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
uvicorn main:app --reload
```

API will be available at `http://localhost:8000`

For more details, see:
- Frontend guide: `frontend/README.md`
- Backend guide: `backend/README.md`

## 🎨 Design Features

- **Dark Navy Theme**: Professional blue-black color scheme
- **Mobile-First**: Optimized for smartphones and tablets
- **Smooth Animations**: Loading states, transitions, and micro-interactions
- **Responsive Layout**: Adapts beautifully to all screen sizes
- **Accessibility**: Proper contrast ratios and keyboard navigation

## 🔧 Configuration

### Environment Variables

**Frontend (.env):**
```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_FIREBASE_DATABASE_URL=your_database_url
VITE_API_BASE_URL=http://localhost:8000
```

**Backend (.env):**
```
GEMINI_API_KEY=your_gemini_api_key
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_DATABASE_URL=your_database_url
CORS_ORIGINS=http://localhost:5173,https://your-domain.vercel.app
```

## 📊 Data Flow

1. **User Authentication**: Google Sign-In via Firebase Auth
2. **Profile Setup**: Branch and roll number collection
3. **Idea Submission**: Text submitted to FastAPI backend
4. **AI Evaluation**: Gemini AI processes and scores the idea
5. **Leaderboard Update**: Public data (name, branch, score) saved to Firebase
6. **Feedback Display**: Private feedback returned to user and stored locally

## 🔒 Privacy & Security

- **Public Data**: Only name, branch, and total score appear on leaderboard
- **Private Data**: Detailed feedback and individual scores stay on user's device
- **Secure API**: All backend calls use HTTPS with proper CORS configuration
- **Firebase Rules**: Leaderboard is publicly readable, backend-only writable

## 🚢 Deployment

### Frontend (Vercel)
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push

### Backend (Render)
1. Connect repository to Render
2. Set environment variables in Render dashboard
3. Deploy with auto-scaling FastAPI service

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Firebase SDK, Lucide Icons
- **Backend**: FastAPI, Google Generative AI, Firebase Admin SDK, Pydantic
- **Database**: Firebase Realtime Database
- **Authentication**: Firebase Authentication
- **AI**: Google Gemini Pro API
- **Deployment**: Vercel + Render

## 📝 License

© 2025 RVCE Coding Club. Built for educational purposes.

---

**Ready to innovate?** Submit your ideas at IdeaArena! 🎯