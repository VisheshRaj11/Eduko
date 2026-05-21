import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { authAPI } from '../api/client'
import useStore from '../store/useStore'
import { FiUser, FiMail, FiLock, FiArrowRight, FiEye, FiEyeOff, FiCheck } from 'react-icons/fi'

const ROLES = [
  { value: 'student',   label: 'Student',   emoji: '👨‍🎓', desc: 'I want to learn', color: '#8B5CF6' },
  { value: 'teacher',   label: 'Teacher',   emoji: '👨‍🏫', desc: 'I teach students', color: '#10B981' },
  { value: 'volunteer', label: 'Volunteer', emoji: '🤝', desc: 'I want to help',   color: '#F472B6' },
]

export default function Register() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setUser, setToken } = useStore()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'student', grade_level: 8 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    if (form.password.length < 8)        { setError('Password must be at least 8 characters.'); return }
    setError(''); setLoading(true)
    try {
      const { data } = await authAPI.register({
        name: form.name, email: form.email, password: form.password,
        role: form.role, grade_level: form.grade_level,
      })
      setToken(data.token)
      setUser(data.user)
      if (data.user?.role === 'teacher') navigate('/teacher')
      else if (data.user?.role === 'volunteer') navigate('/volunteers')
      else navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.email?.[0] || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: 520, background: 'white', borderRadius: 28, boxShadow: '0 20px 60px rgba(139,92,246,0.15)', overflow: 'hidden' }}>

        {/* Header Banner */}
        <div style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 60%, #A78BFA 100%)', padding: '32px 40px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎓</div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 26, color: 'white', marginBottom: 6 }}>
            Join Eduko Free
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>AI-powered learning in Hindi, Punjabi & English</p>
        </div>

        <div style={{ padding: '32px 40px' }}>
          {/* Role Selector */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 10, fontFamily: 'Outfit, sans-serif' }}>
              I am a...
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {ROLES.map(r => (
                <button key={r.value} type="button" onClick={() => setForm(f => ({ ...f, role: r.value }))}
                  style={{
                    padding: '14px 8px', borderRadius: 14, textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
                    border: `2px solid ${form.role === r.value ? r.color : '#E8E3F0'}`,
                    background: form.role === r.value ? r.color + '12' : 'white',
                    position: 'relative',
                  }}>
                  {form.role === r.value && (
                    <div style={{ position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: '50%', background: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FiCheck size={10} color="white" />
                    </div>
                  )}
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{r.emoji}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: form.role === r.value ? r.color : '#374151', fontFamily: 'Outfit, sans-serif' }}>{r.label}</div>
                  <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', color: '#B91C1C', fontSize: 13, marginBottom: 16, fontWeight: 600 }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <FiUser style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={16} />
                <input type="text" className="form-input" style={{ paddingLeft: 42 }}
                  placeholder="Arjun Kumar" required
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <FiMail style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={16} />
                <input type="email" className="form-input" style={{ paddingLeft: 42 }}
                  placeholder="arjun@example.com" required
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
            </div>

            {form.role === 'student' && (
              <div className="form-group">
                <label className="form-label">Class / Grade Level</label>
                <select className="form-input"
                  value={form.grade_level} onChange={e => setForm(f => ({ ...f, grade_level: Number(e.target.value) }))}>
                  {[5,6,7,8,9,10,11,12].map(g => <option key={g} value={g}>Class {g}</option>)}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <FiLock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={16} />
                <input type={showPass ? 'text' : 'password'} className="form-input" style={{ paddingLeft: 42, paddingRight: 42 }}
                  placeholder="Min 8 characters" required
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
                  {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <FiLock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={16} />
                <input type="password" className="form-input" style={{ paddingLeft: 42 }}
                  placeholder="Re-enter password" required
                  value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} />
              </div>
            </div>

            {/* AI Features notice */}
            <div style={{ background: '#F3F0FF', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10 }}>
              <span style={{ fontSize: 20 }}>🤖</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 12, color: '#7C3AED', fontFamily: 'Outfit, sans-serif', marginBottom: 2 }}>
                  AI Features Included
                </div>
                <div style={{ fontSize: 11, color: '#6D28D9', lineHeight: 1.5 }}>
                  AI Tutor (Hindi/Punjabi) · Adaptive Study Plans · Voice & OCR Input · Offline Access
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-purple btn-full btn-lg">
              {loading ? 'Creating Account...' : (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                  Create Free Account <FiArrowRight />
                </span>
              )}
            </button>
          </form>

          <p style={{ marginTop: 20, fontSize: 14, color: '#64748B', textAlign: 'center' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#8B5CF6', fontWeight: 700, textDecoration: 'none' }}>
              Sign in →
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
