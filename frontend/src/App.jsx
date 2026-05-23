import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense } from 'react'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import StudentDashboard from './pages/StudentDashboard'
import TeacherDashboard from './pages/TeacherDashboard'
import AITutor from './pages/AITutor'
import LearningPlan from './pages/LearningPlan'
import ContentLibrary from './pages/ContentLibrary'
import QuizPage from './pages/QuizPage'
import Analytics from './pages/Analytics'
import Flashcards from './pages/Flashcards'
import VolunteerHub from './pages/VolunteerHub'
import Settings from './pages/Settings'
import useStore from './store/useStore'

function ProtectedRoute({ children, allowedRoles }) {
  const { token, user } = useStore()
  if (!token) return <Navigate to="/login" replace />
  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

function DashboardRedirect() {
  const user = useStore(s => s.user)
  if (user?.role === 'teacher') return <Navigate to="/teacher" replace />
  if (user?.role === 'volunteer') return <Navigate to="/volunteers" replace />
  return <Navigate to="/dashboard" replace />
}

function PageLoader() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #FAFAF5 0%, #F0EBF8 100%)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: 20,
          background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: 28, fontWeight: 900, margin: '0 auto 16px',
          boxShadow: '0 8px 32px rgba(139,92,246,0.4)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}>🎓</div>
        <p style={{ color: '#64748B', fontSize: 14, fontFamily: 'Outfit, sans-serif' }}>Loading Eduko...</p>
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
          <Route path="/"         element={<Landing />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Smart redirect */}
          <Route path="/home" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />

          {/* Student Protected */}
          <Route path="/dashboard"  element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
          <Route path="/tutor"      element={<ProtectedRoute><AITutor /></ProtectedRoute>} />
          <Route path="/plan"       element={<ProtectedRoute><LearningPlan /></ProtectedRoute>} />
          <Route path="/library"    element={<ProtectedRoute><ContentLibrary /></ProtectedRoute>} />
          <Route path="/quiz"       element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
          <Route path="/flashcards" element={<ProtectedRoute><Flashcards /></ProtectedRoute>} />
          {/* <Route path="/volunteers" element={<ProtectedRoute><VolunteerHub /></ProtectedRoute>} /> */}
          <Route path="/settings"   element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          {/* Teacher Protected */}
          <Route path="/teacher"    element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><TeacherDashboard /></ProtectedRoute>} />
          <Route path="/analytics"  element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><Analytics /></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
