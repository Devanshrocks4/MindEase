# MindEase 🧠✨

[![Netlify Status](https://api.netlify.com/api/v1/badges/ongoing-deploy/master/badge.svg)](https://mindeasewell.netlify.app/) [![React](https://img.shields.io/badge/React-18-green)](https://reactjs.org) [![Firebase](https://img.shields.io/badge/Firebase-Realtime-orange)](https://firebase.google.com) [![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-blue)](https://tailwindcss.com) [![Netlify](https://img.shields.io/badge/Netlify-Deployed-brightgreen)](https://netlify.com)

## 🚀 Live Demo
[https://mindeasewell.netlify.app/](https://mindeasewell.netlify.app/) – AI-Powered Mental Wellness Platform

**Clinically-validated assessments** (PSS-10, GAD-7, PHQ-9 + 6 more), **Gemini AI Therapy Chat**, **Real-time dashboards**, **PDF Reports**, **Admin Panel** – all in one secure, beautiful app.

## 🎯 Key Features

| Feature | Description |
|---------|-------------|
| **9 Clinical Assessments** | PSS-10 (Stress), GAD-7 (Anxiety), PHQ-9 (Depression), RSES (Self-Esteem), DERS (Emotional Regulation), BIS-11 (Impulsivity), UCLA Loneliness, PSQI (Sleep), IAT (Digital Wellness) |
| **AI Chat Therapy** | Gemini-powered conversational AI, real-time via Socket.io + Netlify Functions |
| **User Dashboard** | Personalized results, progress tracking, recommendations |
| **Admin Dashboard** | Chat management, group sessions, user analytics (Recharts) |
| **PDF Reports** | Professional assessment reports (jsPDF) |
| **Specialist Directory** | Verified psychologists across India |
| **Real-time** | Socket.io for live chat & notifications |
| **PWA Ready** | Offline-capable, installable |

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │◄──►│   Firebase       │◄──►│   Backend API   │
│  React 18 +     │    │  Auth/Firestore  │    │  Express.js     │
│  Tailwind +     │    │  Realtime DB     │    │  + Firebase     │
│  Framer Motion  │    └──────────────────┘    │  Admin SDK      │
└─────────────────┘                            └─────────────────┘
         │                                              │
         ▼                                              ▼
┌─────────────────┐                           ┌─────────────────┐
│ Netlify Static  │                           │ Heroku/Vercel   │
│ Hosting + Edge  │                           │ (Optional)      │
│ Functions       │                           └─────────────────┘
└─────────────────┘
```

- **Monorepo**: `mindease-prod/` (frontend + backend)
- **State**: React Context API (Auth, Theme)
- **Routing**: React Router v6 w/ lazy loading + Protected Routes
- **Animations**: Framer Motion (3D cards, particles, smooth transitions)
- **Styling**: TailwindCSS + Custom Glassmorphism

## 🛠️ Tech Stack

| Category | Technologies |
|----------|--------------|
| **Frontend** | React 18, React Router v6, TailwindCSS, Framer Motion, Recharts, jsPDF, Socket.io-client, react-hot-toast |
| **Backend** | Node.js, Express.js, Firebase Admin SDK |
| **Database** | Firebase Firestore (realtime), Firebase Auth |
| **Deployment** | Netlify (Frontend + Functions), Heroku/Vercel (Backend) |
| **Dev Tools** | ESLint, Prettier, Vite (optional), Nodemon |
| **Other** | Gemini AI API, PDF Generation, PWA Manifest |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Firebase Project (for Auth/Firestore)
- Netlify CLI (optional)

### 1. Clone & Install
```bash
git clone <repo-url>
cd mindease-prod

# Frontend
cd frontend  # or directly in root
npm install

# Backend
cd backend
npm install
```

### 2. Environment Setup
Create `.env` files:

**frontend/.env**
```
REACT_APP_FIREBASE_API_KEY=xxx
REACT_APP_FIREBASE_AUTH_DOMAIN=xxx
REACT_APP_FIREBASE_PROJECT_ID=xxx
# ... other Firebase config
```

**backend/.env**
```
PORT=5000
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
FRONTEND_URL=http://localhost:3000
```

### 3. Run Locally
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
npm start
```

**Access**: http://localhost:3000

### 4. Netlify Deployment
```bash
npm run build
netlify deploy --prod --dir=build
```

## 📱 Pages & User Flow

```
Home (9 Assessment Cards) ──→ AssessmentTest ──→ ResultsPage (Charts + PDF) ──→ Dashboard
    ↓
Login/Register ──→ Chat (AI Therapy) ──→ Recommendations
    ↓
AdminLogin ──→ AdminDashboard (Chat/Group Mgmt)
```

- **Home**: Hero + Assessment grid (3D hover cards)
- **Assessments**: Dynamic forms w/ validation
- **Chat**: Real-time AI conversations
- **Admin**: Full management suite

## 📁 Project Structure

```
mindease-prod/
├── backend/                 # Express API
│   ├── server.js           # Entry point
│   ├── routes/             # API routes
│   │   ├── users.js
│   │   ├── assessments.js
│   │   └── chat.js
│   └── middleware/
├── src/                    # React App
│   ├── components/         # UI Components
│   │   ├── Chat.js
│   │   ├── AdminDashboard.js
│   │   └── AssessmentTest.js
│   ├── contexts/           # State Management
│   ├── services/           # Firebase, API calls
│   ├── utils/              # PDF Generator
│   └── App.js              # Router + Layout
├── public/                 # Static assets
├── netlify/functions/      # Serverless Chat
└── package.json            # Dependencies
```

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service status |
| POST | `/api/users` | User registration/login |
| POST | `/api/assessments` | Submit assessment |
| POST/GET | `/api/chat` | AI chat messages |

**Auth**: Firebase JWT tokens

## ☁️ Deployment

### Netlify (Recommended)
1. Connect GitHub repo
2. Build command: `npm run build`
3. Publish dir: `build`
4. Functions: `netlify/functions`

### Backend (Separate)
Deploy `backend/` to Heroku/Railway:
```bash
heroku create
git push heroku main
```

## 🔮 Future Roadmap

- [ ] Mobile App (React Native)
- [ ] Video Consultations (WebRTC)
- [ ] ML Prediction Models
- [ ] Multi-language Support
- [ ] Payment Integration

## 🤝 Contributing

1. Fork & clone
2. Create feature branch: `git checkout -b feature/amazing`
3. Commit: `git commit -m 'Add amazing feature'`
4. Push & PR

**Issues**: Report bugs/features [here](https://github.com/yourusername/mindease/issues)

## 📄 License
MIT – Built with ❤️ by [Devansh Gupta](https://github.com/devanshgupta) & Team

---

**MindEase** – Making mental wellness accessible, one assessment at a time. 🧠✨
