import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { authAPI } from '../api/client'
import useStore from '../store/useStore'
import { FiMail, FiLock, FiArrowRight, FiEye, FiEyeOff } from 'react-icons/fi'

const ROLES = [
  { value: 'student',   label: 'Student',   emoji: '👨‍🎓', desc: 'Learn & grow' },
  { value: 'teacher',   label: 'Teacher',   emoji: '👨‍🏫', desc: 'Teach & inspire' },
  { value: 'volunteer', label: 'Volunteer', emoji: '🤝', desc: 'Give back' },
]

export default function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setUser, setToken } = useStore()
  const [form, setForm] = useState({ email: '', password: '', role: 'student' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const { data } = await authAPI.login({ email: form.email, password: form.password })
      setToken(data.token)
      setUser(data.user)
      // Role-based redirect
      if (data.user?.role === 'teacher') navigate('/teacher')
      else if (data.user?.role === 'volunteer') navigate('/volunteers')
      else navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* LEFT — Purple gradient panel */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        style={{
          flex: 1, display: 'none',
          background: 'linear-gradient(135deg, #4C1D95 0%, #7C3AED 40%, #8B5CF6 70%, #A78BFA 100%)',
          position: 'relative', overflow: 'hidden', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
          padding: 48,
        }}
        className="md-flex">
        <style>{`.md-flex { display: flex !important; } @media (max-width: 768px) { .md-flex { display: none !important; } }`}</style>

        {/* Decorative circles */}
        {[{ size: 300, opacity: 0.1, top: -100, left: -100 }, { size: 200, opacity: 0.08, bottom: -80, right: -80 }].map((c, i) => (
          <div key={i} style={{
            position: 'absolute', width: c.size, height: c.size, borderRadius: '50%',
            background: 'white', opacity: c.opacity, top: c.top, left: c.left, bottom: c.bottom, right: c.right,
          }} />
        ))}

        <div style={{ position: 'relative', textAlign: 'center', color: 'white', maxWidth: 320 }}>
          <div style={{ fontSize: 60, marginBottom: 24 }}>🎓</div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 32, fontWeight: 900, marginBottom: 16 }}>
            Welcome to Eduko
          </h2>
          <p style={{ opacity: 0.85, lineHeight: 1.7, marginBottom: 32, fontSize: 16 }}>
            AI-powered education for rural India. Learn in Hindi, Punjabi, or English — even offline.
          </p>

          {/* Testimonial */}
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: '20px 24px', backdropFilter: 'blur(10px)', textAlign: 'left' }}>
            <p style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 12, fontStyle: 'italic', opacity: 0.95 }}>
              "Eduko's AI tutor explained fractions in Hindi. I finally understood what I couldn't in 2 years!"
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👧</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Meera Devi, Class 8</div>
                <div style={{ opacity: 0.7, fontSize: 11 }}>Village Sujanpur, Himachal Pradesh</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* RIGHT — Login form */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        style={{
          width: '100%', maxWidth: 480,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '40px 40px', background: 'white',
        }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 4px 16px rgba(139,92,246,0.4)' }}>🎓</div>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 26, color: '#1A1A2E' }}>Eduko</span>
        </div>

        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 28, color: '#1A1A2E', marginBottom: 6 }}>
          Welcome Back! 👋
        </h1>
        <p style={{ color: '#64748B', marginBottom: 28, fontSize: 15 }}>Sign in to continue learning</p>

        {/* Role selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, width: '100%' }}>
          {ROLES.map(r => (
            <button key={r.value} onClick={() => setForm(f => ({ ...f, role: r.value }))}
              style={{
                flex: 1, padding: '10px 4px', borderRadius: 12,
                border: `2px solid ${form.role === r.value ? '#8B5CF6' : '#E8E3F0'}`,
                background: form.role === r.value ? '#F3F0FF' : 'white',
                cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center',
              }}>
              <div style={{ fontSize: 18, marginBottom: 2 }}>{r.emoji}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: form.role === r.value ? '#7C3AED' : '#64748B', fontFamily: 'Outfit, sans-serif' }}>{r.label}</div>
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', color: '#B91C1C', fontSize: 13, marginBottom: 16, fontWeight: 600 }}>
              ⚠️ {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <FiMail style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={16} />
              <input type="email" className="form-input" style={{ paddingLeft: 42 }}
                placeholder="you@example.com" required
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <FiLock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={16} />
              <input type={showPass ? 'text' : 'password'} className="form-input" style={{ paddingLeft: 42, paddingRight: 42 }}
                placeholder="••••••••" required
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              <button type="button" onClick={() => setShowPass(p => !p)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
                {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'right', marginTop: -8, marginBottom: 20 }}>
            <a href="#" style={{ fontSize: 13, color: '#8B5CF6', fontWeight: 600, textDecoration: 'none' }}>Forgot password?</a>
          </div>

          <button type="submit" disabled={loading} className="btn btn-purple btn-full btn-lg" style={{ marginBottom: 16 }}>
            {loading ? 'Signing in...' : <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>Sign In <FiArrowRight /></span>}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: '#E8E3F0' }} />
            <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: '#E8E3F0' }} />
          </div>

          <button type="button" disabled style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid #E8E3F0', background: '#F8F5FF', cursor: 'not-allowed', opacity: 0.6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#374151' }}>
            <img src="https://www.google.com/favicon.ico" alt="G" width={16} height={16} />
            Continue with Google (Coming Soon)
          </button>
        </form>

        <p style={{ marginTop: 24, fontSize: 14, color: '#64748B' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#8B5CF6', fontWeight: 700, textDecoration: 'none' }}>
            Create free account →
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
