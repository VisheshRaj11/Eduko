import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
  timeout: 15000,
})

// ── Request: attach auth token ───────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eduko_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response: handle 401 / errors ───────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('eduko_token')
      localStorage.removeItem('eduko_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/register', data),
  login: (data) => api.post('/login', data),
  logout: () => api.post('/logout'),
}

// ── Student ─────────────────────────────────────────────
export const studentAPI = {
  dashboard: () => api.get('/dashboard'),
  learningPlan: () => api.get('/learning-plan'),
  submitQuiz: (data) => api.post('/quiz/submit', data),
}

// ── AI ──────────────────────────────────────────────────
export const aiAPI = {
  chat: (data) => api.post('/ask-ai', data),
  generatePlan: (data) => api.post('/generate-plan', data),
  translate: (data) => api.post('/translate', data),
  speechToText: (formData) => api.post('/speech-to-text', formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 30000 }),
  ocr: (formData) => api.post('/ocr', formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 30000 }),
}

// ── Lessons ──────────────────────────────────────────────
export const lessonAPI = {
  list: (params) => api.get('/lessons', { params }),
  get: (id) => api.get(`/lessons/${id}`),
  create: (data) => api.post('/lessons', data),
  update: (id, data) => api.put(`/lessons/${id}`, data),
}

// ── Quizzes ──────────────────────────────────────────────
export const quizAPI = {
  getByLesson: (lessonId) => api.get(`/quizzes/${lessonId}`),
}

// ── Analytics ────────────────────────────────────────────
export const analyticsAPI = {
  teacher: () => api.get('/analytics/teacher'),
  student: () => api.get('/analytics/student'),
}

// ── Volunteer ────────────────────────────────────────────
export const volunteerAPI = {
  join: (data) => api.post('/volunteer/join', data),
  sessions: () => api.get('/sessions'),
  bookSession: (data) => api.post('/session/book', data),
}

export default api
