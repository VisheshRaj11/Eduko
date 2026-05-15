# 🌱 Eduko — AI-Powered Rural Education Platform

> AI-driven, multilingual, offline-first education platform for rural India.
> Built with React (Vite/PWA), Laravel, FastAPI, MongoDB, Redis, and Gemini 2.5.

---

## 📁 Project Structure

```
Eduko/
├── frontend/       # React Vite PWA (port 5173)
├── backend/        # Laravel 11 API (port 8000)
└── ai-service/     # FastAPI AI Microservice (port 8001)
```

---

## ⚡ Quick Start

### Prerequisites

| Tool         | Version  | Download |
|---|---|---|
| Node.js      | ≥ 20     | https://nodejs.org |
| PHP          | ≥ 8.2    | https://php.net |
| Composer     | ≥ 2      | https://getcomposer.org |
| Python       | ≥ 3.11   | https://python.org |
| MongoDB      | ≥ 7      | https://mongodb.com |
| Redis        | ≥ 7      | https://redis.io |
| Tesseract    | ≥ 5      | https://github.com/tesseract-ocr/tesseract |

---

## 🎨 Frontend (React + Vite + PWA)

```powershell
cd frontend
npm install
cp .env.example .env        # Edit VITE_API_URL if needed
npm run dev                  # → http://localhost:5173
```

### Build for production
```powershell
npm run build
npm run preview
```

**Pages available:**
- `/` — Landing page
- `/login` — Login
- `/register` — Register (student / teacher / volunteer)
- `/dashboard` — Student dashboard with stats
- `/tutor` — AI Tutor chat (multilingual, voice, OCR)
- `/plan` — AI-generated weekly study plan
- `/library` — Content library with filters
- `/quiz` — Interactive quiz with feedback
- `/analytics` — Teacher analytics dashboard
- `/volunteers` — Volunteer hub + session booking
- `/settings` — Profile, notifications, language

---

## ⚙️ Backend (Laravel 11)

```powershell
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan serve                              # → http://localhost:8000
php artisan queue:work redis --queue=ai,default  # Start queue worker
```

### Environment Variables (backend/.env)
```
DB_CONNECTION=mongodb
DB_HOST=127.0.0.1
DB_PORT=27017
DB_DATABASE=eduko

QUEUE_CONNECTION=redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

AI_SERVICE_URL=http://localhost:8001
FAST2SMS_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
```

### API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/register | ❌ | Register user |
| POST | /api/login | ❌ | Login → token |
| GET | /api/dashboard | ✅ | Student dashboard data |
| GET | /api/learning-plan | ✅ | Weekly AI plan |
| POST | /api/quiz/submit | ✅ | Submit quiz score |
| POST | /api/ask-ai | ✅ | AI tutor chat |
| POST | /api/generate-plan | ✅ | Generate new AI plan |
| GET | /api/lessons | ✅ | List lessons |
| POST | /api/lessons | ✅ | Create lesson |
| GET | /api/analytics/teacher | ✅ | Teacher analytics |
| POST | /api/volunteer/join | ✅ | Join as volunteer |
| POST | /api/session/book | ✅ | Book tutor session |

---

## 🤖 AI Service (FastAPI + Gemini 2.5)

```powershell
cd ai-service
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env      # Add GEMINI_API_KEY
python main.py             # → http://localhost:8001
```

### AI Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /ai/chat | RAG-powered tutor chat |
| POST | /ai/generate-plan | 7-day study plan generation |
| POST | /ai/translate | Multilingual translation |
| POST | /ai/speech-to-text | Whisper STT (local, free) |
| POST | /ai/ocr | Tesseract OCR |
| POST | /ai/ingest | Add lesson to vector DB |
| GET | /health | Service health check |
| GET | /docs | Swagger UI |

### Get a Gemini API Key
1. Go to https://aistudio.google.com/
2. Click "Get API Key" → Create API key
3. Copy to `GEMINI_API_KEY` in both `.env` files

---

## 📡 SMS (Fast2SMS — Free)

Fast2SMS provides a free SMS tier for India:
1. Register at https://www.fast2sms.com/
2. Get API key from Dashboard → Dev API
3. Add to `backend/.env` as `FAST2SMS_API_KEY`
4. Free tier: 200 SMS credits on signup

---

## 🔌 Offline / PWA

- Install the app on Android: Open in Chrome → Menu → "Add to Home Screen"
- Lessons and quizzes are cached by the service worker
- Answers entered offline are queued in IndexedDB and synced when online
- The offline indicator in the navbar shows current connectivity status

---

## 🗄️ MongoDB Collections

| Collection | Key Fields |
|---|---|
| users | name, phone (unique), role, language |
| students | user_id, grade_level, progress_summary |
| teachers | user_id, specialization |
| lessons | title, subject, language, difficulty, content_blocks |
| quizzes | lesson_id, questions[] |
| progress | student_id, lesson_id, score, attempts |
| learning_plans | student_id, weekly_plan[], generated_at |
| chat_messages | user_id, message, response, language |
| volunteers | user_id, name, specialization, availability |
| sessions | volunteer_id, student_id, scheduled_time, status |

---

## 🚀 Production Deployment

| Service | Recommended Platform |
|---|---|
| Frontend | Vercel / Netlify |
| Laravel | Railway / Render / DigitalOcean |
| FastAPI | Railway / Render |
| MongoDB | MongoDB Atlas (free M0 tier) |
| Redis | Upstash Redis (free tier) |

---

## 🌍 Multilingual Support

The platform supports three languages:

| Language | Code | Script |
|---|---|---|
| English | `en` | Latin |
| Hindi | `hi` | Devanagari (हिंदी) |
| Punjabi | `pa` | Gurmukhi (ਪੰਜਾਬੀ) |

Switch language using the globe icon in the navbar. Preference is saved in localStorage.

---

## 📞 Support

Built with ❤️ for rural India's students. Questions? Open an issue on GitHub.
