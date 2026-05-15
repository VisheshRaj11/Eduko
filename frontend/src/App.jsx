import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense } from 'react'
import '../src/i18n/index.js'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import StudentDashboard from './pages/StudentDashboard'
import AITutor from './pages/AITutor'
import LearningPlan from './pages/LearningPlan'
import ContentLibrary from './pages/ContentLibrary'
import QuizPage from './pages/QuizPage'
import Analytics from './pages/Analytics'
import VolunteerHub from './pages/VolunteerHub'
import Settings from './pages/Settings'
import useStore from './store/useStore'

function ProtectedRoute({ children }) {
  const token = useStore(s => s.token)
  return token ? children : <Navigate to="/login" replace />
}

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 animate-pulse-slow">E</div>
        <p className="text-slate-500 text-sm">Loading Eduko...</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected */}
          <Route path="/dashboard"  element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
          <Route path="/tutor"      element={<ProtectedRoute><AITutor /></ProtectedRoute>} />
          <Route path="/plan"       element={<ProtectedRoute><LearningPlan /></ProtectedRoute>} />
          <Route path="/library"    element={<ProtectedRoute><ContentLibrary /></ProtectedRoute>} />
          <Route path="/quiz"       element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
          <Route path="/analytics"  element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/volunteers" element={<ProtectedRoute><VolunteerHub /></ProtectedRoute>} />
          <Route path="/settings"   element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
