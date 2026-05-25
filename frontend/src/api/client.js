import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
  timeout: 20000,
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
  login:    (data) => api.post('/login', data),
  logout:   ()     => api.post('/logout'),
  me:       ()     => api.get('/me'),
  updateProfile: (data) => api.post('/user/profile', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
}

// ── Student ─────────────────────────────────────────────
export const studentAPI = {
  dashboard:     ()    => api.get('/dashboard'),
  learningPlan:  ()    => api.get('/learning-plan'),
  progress:      ()    => api.get('/progress'),
  submitQuiz:    (data)=> api.post('/quiz/submit', data),
  downloadLesson:(id)  => api.get(`/lessons/${id}/download`),
  viewLesson:    (id)  => api.post(`/lessons/${id}/view`),
  getAssignedTasks: () => api.get('/assigned-tasks'),
  completeAssignedTask: (id) => api.post(`/assigned-tasks/${id}/complete`),
}

// ── Teacher ──────────────────────────────────────────────
export const teacherAPI = {
  dashboard:    ()     => api.get('/teacher/dashboard'),
  analytics:    ()     => api.get('/teacher/analytics'),
  uploadLesson: (data) => {
    const isFormData = data instanceof FormData
    return api.post('/teacher/upload-lesson', data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
      timeout: 120000, // extra time for PDF processing (Gemini extraction can take a while)
    })
  },
  sendSMS:      (data) => api.post('/teacher/send-sms', data),
  generateSuggestions: (data) => api.post('/teacher/generate-suggestions', data),
  getStudents:  ()     => api.get('/teacher/students'),
  getAssignedTasks: () => api.get('/teacher/assigned-tasks'),
  assignTask:   (data) => api.post('/teacher/assigned-tasks', data),
}

// ── AI ──────────────────────────────────────────────────
export const aiAPI = {
  getHistory:   (params)   => api.get('/ask-ai/history', { params }),
  chat:         (data)     => api.post('/ask-ai', data, { timeout: 60000 }),
  generatePlan: (data)     => api.post('/generate-plan', data),
  translate:    (data)     => api.post('/translate', data),
  speechToText: (formData) => api.post('/speech-to-text', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }, timeout: 30000,
  }),
  ocr: (formData) => api.post('/ocr', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }, timeout: 30000,
  }),
  // Fetch unique subjects from the vector DB (direct call to AI service)
  subjects: () => {
    const aiUrl = import.meta.env.VITE_AI_URL || 'http://localhost:4000'
    return fetch(`${aiUrl}/ai/subjects`).then(r => r.json())
  },
  // Fetch vector content for a lesson directly from AI service
  getVectorContent: (lessonId) => {
    const aiUrl = import.meta.env.VITE_AI_URL || 'http://localhost:4000'
    return fetch(`${aiUrl}/ai/${lessonId}`).then(r => {
      if (!r.ok) throw new Error("Not Found")
      return r.json()
    })
  },
}

// ── Flashcards ──────────────────────────────────────────
export const flashcardsAPI = {
  generate: (data) => api.post('/flashcards/generate', data),
}

// ── Lessons ──────────────────────────────────────────────
export const lessonAPI = {
  list:    (params) => api.get('/lessons', { params }),
  get:     (id)     => api.get(`/lessons/${id}`),
  create:  (data)   => api.post('/lessons', data),
  update:  (id, d)  => api.put(`/lessons/${id}`, d),
  destroy: (id)     => api.delete(`/lessons/${id}`),
  offline: ()       => api.get('/lessons/offline'),
}

// ── Quizzes ──────────────────────────────────────────────
export const quizAPI = {
  getByLesson: (lessonId) => api.get(`/quizzes/${lessonId}`),
  store:       (data)     => api.post('/quizzes', data),
}

// ── Analytics ────────────────────────────────────────────
export const analyticsAPI = {
  teacher: () => api.get('/teacher/analytics'),
  student: () => api.get('/analytics/student'),
}

// ── Volunteer ────────────────────────────────────────────
export const volunteerAPI = {
  join:        (data) => api.post('/volunteer/join', data),
  sessions:    ()     => api.get('/sessions'),
  bookSession: (data) => api.post('/session/book', data),
  myProfile:   ()     => api.get('/volunteer/my-profile'),
}

// ── Notifications ────────────────────────────────────────
export const notificationAPI = {
  sendReminder: (data)  => api.post('/send-reminder', data),
  bulkReminder: (data)  => api.post('/bulk-reminder', data),
  examAlert:    (data)  => api.post('/exam-alert', data),
}

export default api
