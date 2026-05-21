# 🎓 Eduko — AI-Powered Rural Education Platform

> Bringing quality education to every child in India through AI, multilingual support, and offline-first PWA.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (React + Vite)              │
│  Student Portal │ Teacher Dashboard │ Community Hub       │
│  Offline PWA (Service Worker + Workbox)                  │
└────────────────────────┬────────────────────────────────┘
                         │ REST API (Sanctum)
┌────────────────────────▼────────────────────────────────┐
│               BACKEND (Laravel 11 + MongoDB)             │
│  Auth │ Student │ Teacher │ Lessons │ Quiz │ Volunteer   │
│  Queue Jobs → FastAPI calls (async)                      │
│  Twilio SMS Notifications                                │
└────────┬─────────────────────────────────┬──────────────┘
         │ HTTP (Queued Jobs)              │ Redis Cache
┌────────▼──────────────┐   ┌─────────────▼──────────────┐
│  FastAPI AI Service   │   │     Redis (Queue+Cache)     │
│  LangChain + Gemini   │   └────────────────────────────┘
│  RAG (ChromaDB)       │
│  Adaptive Plans       │
│  Translation          │
│  OCR (Gemini Vision)  │
│  Speech-to-Text       │
└───────────────────────┘
         │
┌────────▼──────────────┐
│   Storage Layer        │
│  MongoDB Atlas (DB)    │
│  ChromaDB (vectors)    │
└───────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PHP 8.3+ & Composer
- Python 3.11+
- MongoDB Atlas account (or local MongoDB)

### 1. Clone & Setup

```bash
git clone <your-repo>
cd Eduko
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### 3. Backend (Laravel)
```bash
cd backend
composer install
cp .env.example .env
# Edit .env with your credentials
php artisan key:generate
php artisan serve
# → http://localhost:8000
```

### 4. AI Service (FastAPI)
```bash
cd ai-service
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 4000
# → http://localhost:4000
# Docs → http://localhost:4000/docs
```

### 5. Docker (All-in-One)
```bash
# From root directory
docker-compose up --build
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
```env
MONGODB_URI=mongodb+srv://...
GEMINI_API_KEY=AIzaSy...
TWILIO_SID=AC...
TWILIO_TOKEN=your_auth_token
TWILIO_FROM=+1XXXXXXXXXX
AI_SERVICE_URL=http://localhost:4000
QUEUE_CONNECTION=database
```

### AI Service (`ai-service/.env`)
```env
GEMINI_API_KEY=AIzaSy...
CHROMA_PERSIST_DIR=./chroma_db
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:8000/api
VITE_AI_URL=http://localhost:4000
```

---

## 🌟 Features

| Feature | Tech Stack | Status |
|---------|-----------|--------|
| AI Tutor Chatbot | LangChain + ChromaDB + Gemini 2.5 Flash | ✅ |
| RAG Pipeline | ChromaDB vector store | ✅ |
| Adaptive Learning Plans | Gemini LLM + user analytics | ✅ |
| Multilingual (Hindi/Punjabi/English) | Gemini translation chains | ✅ |
| Voice Input | Web Speech API + Gemini multimodal | ✅ |
| OCR (handwritten work) | Gemini Vision API | ✅ |
| Offline-First PWA | Vite Plugin PWA + Workbox | ✅ |
| Teacher Analytics Dashboard | Recharts + MongoDB aggregation | ✅ |
| Volunteer Hub + Session Booking | Laravel + Twilio SMS | ✅ |
| Bulk SMS Notifications | Twilio REST API | ✅ |
| Role-Based Auth | Laravel Sanctum | ✅ |
| Background Job Queue | Laravel Jobs + Redis | ✅ |

---

## 📁 Project Structure

```
Eduko/
├── frontend/          # React + Vite PWA
│   ├── src/
│   │   ├── pages/     # Landing, Dashboard, AI Tutor, Quiz, etc.
│   │   ├── components/ # ChatUI, Sidebar, Navbar, etc.
│   │   ├── api/       # Axios client for all endpoints
│   │   ├── store/     # Zustand state management
│   │   └── i18n/      # Hindi, Punjabi, English translations
│   └── vite.config.js # PWA + proxy config
│
├── backend/           # Laravel 11
│   ├── app/
│   │   ├── Http/Controllers/ # Auth, Student, Teacher, AI, etc.
│   │   ├── Jobs/       # GeneratePlan, Translate, Ingest jobs
│   │   ├── Models/     # MongoDB models
│   │   └── Services/   # TwilioService
│   └── routes/api.php  # All API routes
│
├── ai-service/        # FastAPI + LangChain
│   ├── routers/        # chat, plan, translate, speech, ocr
│   ├── services/       # rag_service, adaptive_service, content_service
│   └── main.py         # FastAPI app entry point
│
└── docker-compose.yml  # One-command startup
```

---

## 🎨 Theme

Inspired by **Academix** design:
- **Background**: Cream (#FAFAF5)
- **Primary**: Lavender (#8B5CF6, #7C3AED)
- **CTA**: Lime Green (#A3E635, #BEF264)
- **Accent**: Pink (#F472B6)
- **Font**: Outfit (headings) + Inter (body)

---

## 🔧 API Endpoints

### Auth
- `POST /api/register` — Register (student/teacher/volunteer)
- `POST /api/login` — Login → returns Sanctum token

### Student
- `GET /api/dashboard` — Dashboard stats
- `GET /api/learning-plan` — AI-generated weekly plan
- `POST /api/quiz/submit` — Submit quiz answers

### AI
- `POST /api/ask-ai` — Chat with AI Tutor
- `POST /api/generate-plan` — Generate adaptive learning plan
- `POST /api/translate` — Translate content
- `POST /api/speech-to-text` — Audio → text
- `POST /api/ocr` — Image → text (handwriting)

### Teacher
- `GET /api/teacher/analytics` — Class analytics
- `POST /api/teacher/upload-lesson` — Upload + auto-translate lesson
- `POST /api/teacher/send-sms` — Bulk SMS via Twilio

### Volunteer
- `POST /api/volunteer/join` — Register as volunteer
- `GET /api/sessions` — List upcoming sessions
- `POST /api/session/book` — Book a session (sends Twilio SMS)

---

## 📱 PWA (Offline Support)

The app caches:
- All lessons and quizzes (7 days)
- Dashboard data (1 hour)
- Static assets forever (fonts, icons)

Quiz answers submitted while offline are queued and synced automatically when internet returns.

---

## 🤖 AI Service Endpoints

```
GET  /health             — Service health check
POST /ai/chat            — RAG-powered tutoring
POST /ai/ingest          — Add lesson to vector store
POST /ai/generate-plan   — Generate 7-day study plan
GET  /ai/plan/{user_id}  — Retrieve stored plan
POST /ai/translate       — Translate + simplify content
POST /ai/translate-lesson — Translate full lesson
POST /ai/speech-to-text  — Audio transcription
POST /ai/speech-json     — Base64 audio transcription
POST /ai/ocr             — Image OCR
POST /ai/ocr-json        — Base64 image OCR
```

Interactive docs: http://localhost:4000/docs

---

Built with ❤️ for rural India 🇮🇳
