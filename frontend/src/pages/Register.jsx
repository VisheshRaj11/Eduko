import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { authAPI } from '../api/client'
import useStore from '../store/useStore'
import {
  FiUser,
  FiMail,
  FiLock,
  FiArrowRight,
  FiEye,
  FiEyeOff,
  FiCheck,
  FiBriefcase,
  FiHeart,
  FiCpu,
  FiStar,
  FiTrendingUp,
} from 'react-icons/fi'

const ROLES = [
  { value: 'student', label: 'Student', icon: FiUser, desc: 'I want to learn', color: '#8B5CF6' },
  { value: 'teacher', label: 'Teacher', icon: FiBriefcase, desc: 'I teach students', color: '#10B981' },
  { value: 'volunteer', label: 'Volunteer', icon: FiHeart, desc: 'I want to help', color: '#F472B6' },
]

export default function Register() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setUser, setToken } = useStore()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
    role: 'student',
    grade_level: 8,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const { data } = await authAPI.register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        grade_level: form.grade_level,
      })
      setToken(data.token)
      setUser(data.user)
      if (data.user?.role === 'teacher') navigate('/teacher')
      else if (data.user?.role === 'volunteer') navigate('/volunteers')
      else navigate('/dashboard')
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.email?.[0] ||
          'Registration failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F9FAFB',
        fontFamily: "'Inter', system-ui, sans-serif",
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      {/* Global styles & keyframes (same as landing page) */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700;14..32,800;14..32,900&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { margin: 0; }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes glow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        .float-animation { animation: float 6s ease-in-out infinite; }
        .glow-animation { animation: glow 4s ease-in-out infinite; }
      `}</style>

      {/* Animated background blobs (exactly like landing page) */}
      <div
        style={{
          position: 'fixed',
          top: -300,
          left: -300,
          width: 600,
          height: 600,
          background: '#8B5CF6',
          opacity: 0.12,
          filter: 'blur(140px)',
          zIndex: 0,
          borderRadius: '50%',
        }}
        className="glow-animation"
      />
      <div
        style={{
          position: 'fixed',
          bottom: -200,
          right: -200,
          width: 500,
          height: 500,
          background: '#EC4899',
          opacity: 0.1,
          filter: 'blur(130px)',
          zIndex: 0,
          borderRadius: '50%',
        }}
        className="glow-animation"
      />
      <div
        style={{
          position: 'fixed',
          top: '40%',
          left: '30%',
          width: 400,
          height: 400,
          background: '#F59E0B',
          opacity: 0.06,
          filter: 'blur(120px)',
          zIndex: 0,
          borderRadius: '50%',
        }}
      />

      {/* Header (consistent with login page) */}
      <header
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '20px 32px',
          background: 'transparent',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 14,
                // background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 20,
                color: 'white',
                // boxShadow: '0 8px 20px rgba(139,92,246,0.3)',
              }}
            >
              <img src="./icon.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span
              style={{
                fontSize: 24,
                fontWeight: 800,
                background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Eduko
            </span>
          </Link>
          <Link
            to="/login"
            style={{
              textDecoration: 'none',
              color: '#4B5563',
              fontWeight: 600,
              fontSize: 14,
              padding: '8px 16px',
              borderRadius: 12,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => (e.target.style.background = '#F3F4F6')}
            onMouseLeave={(e) => (e.target.style.background = 'transparent')}
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Main content: two-column layout */}
      <main style={{ position: 'relative', zIndex: 2, padding: '40px 24px 80px' }}>
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 60,
            alignItems: 'start',
          }}
        >
          {/* LEFT PANEL – Branding & benefits (glass card) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              background: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(12px)',
              borderRadius: 40,
              padding: 48,
              border: '1px solid rgba(255,255,255,0.5)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 24,
                  background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  fontSize: 32,
                  color: 'white',
                }}
              >
                <FiTrendingUp size={36} />
              </div>
              <h2
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: 12,
                }}
              >
                Start Learning for Free
              </h2>
              <p style={{ color: '#6B7280', lineHeight: 1.6 }}>
                Join thousands of students already transforming their future with AI-powered education.
              </p>
            </div>

            {/* Feature list (no emojis) */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                marginTop: 32,
              }}
            >
              {[
                { icon: FiCpu, text: 'AI Tutor in Hindi, Punjabi & English' },
                { icon: FiStar, text: 'Personalized study plans & gamification' },
                { icon: FiTrendingUp, text: 'Offline access – learn without internet' },
              ].map((feature, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    background: 'white',
                    borderRadius: 20,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 14,
                      background: 'rgba(139,92,246,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <feature.icon size={20} color="#8B5CF6" />
                  </div>
                  <span style={{ fontWeight: 500, fontSize: 14, color: '#374151' }}>
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Floating stat (like landing page) */}
            <motion.div
              className="float-animation"
              style={{
                marginTop: 40,
                textAlign: 'center',
                padding: '16px 20px',
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(8px)',
                borderRadius: 20,
                border: '1px solid rgba(255,255,255,0.5)',
              }}
            >
              <span style={{ fontWeight: 800, color: '#8B5CF6', fontSize: 20 }}>150K+</span>
              <span style={{ color: '#6B7280', marginLeft: 8 }}>active learners already enrolled</span>
            </motion.div>
          </motion.div>

          {/* RIGHT PANEL – Registration Form (white card) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{
              background: 'white',
              borderRadius: 40,
              padding: '48px 40px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
              border: '1px solid #F0F0F0',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h1
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  color: '#1F2937',
                  marginBottom: 8,
                }}
              >
                Create an account
              </h1>
              <p style={{ color: '#6B7280', fontSize: 15 }}>
                Start your learning journey today
              </p>
            </div>

            {/* Role Selector (with icons, no emojis) */}
            <div style={{ marginBottom: 28 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: 12,
                }}
              >
                I am a...
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 12,
                }}
              >
                {ROLES.map((role) => {
                  const Icon = role.icon
                  const isActive = form.role === role.value
                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, role: role.value }))}
                      style={{
                        padding: '14px 8px',
                        borderRadius: 20,
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: `2px solid ${isActive ? role.color : '#E5E7EB'}`,
                        background: isActive ? `${role.color}10` : 'white',
                        position: 'relative',
                      }}
                    >
                      {isActive && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            background: role.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <FiCheck size={10} color="white" />
                        </div>
                      )}
                      <Icon size={24} color={isActive ? role.color : '#9CA3AF'} style={{ marginBottom: 6 }} />
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: isActive ? role.color : '#4B5563',
                          marginBottom: 4,
                        }}
                      >
                        {role.label}
                      </div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{role.desc}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 16,
                  padding: '12px 16px',
                  marginBottom: 24,
                  fontSize: 13,
                  color: '#B91C1C',
                  fontWeight: 500,
                }}
              >
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Full Name */}
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: 8,
                  }}
                >
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <FiUser
                    size={18}
                    style={{
                      position: 'absolute',
                      left: 16,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9CA3AF',
                    }}
                  />
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Arjun Kumar"
                    style={{
                      width: '100%',
                      padding: '14px 16px 14px 46px',
                      borderRadius: 16,
                      border: '1.5px solid #E5E7EB',
                      fontSize: 15,
                      outline: 'none',
                      transition: 'all 0.2s',
                      fontFamily: 'inherit',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#8B5CF6')}
                    onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                  />
                </div>
              </div>

              {/* Email */}
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: 8,
                  }}
                >
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <FiMail
                    size={18}
                    style={{
                      position: 'absolute',
                      left: 16,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9CA3AF',
                    }}
                  />
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="arjun@example.com"
                    style={{
                      width: '100%',
                      padding: '14px 16px 14px 46px',
                      borderRadius: 16,
                      border: '1.5px solid #E5E7EB',
                      fontSize: 15,
                      outline: 'none',
                      transition: 'all 0.2s',
                      fontFamily: 'inherit',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#8B5CF6')}
                    onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                  />
                </div>
              </div>

              {/* Grade Level (only for students) */}
              {form.role === 'student' && (
                <div style={{ marginBottom: 20 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: 8,
                    }}
                  >
                    Class / Grade Level
                  </label>
                  <select
                    value={form.grade_level}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, grade_level: Number(e.target.value) }))
                    }
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: 16,
                      border: '1.5px solid #E5E7EB',
                      fontSize: 15,
                      outline: 'none',
                      background: 'white',
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#8B5CF6')}
                    onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                  >
                    {[5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                      <option key={g} value={g}>
                        Class {g}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Password */}
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: 8,
                  }}
                >
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <FiLock
                    size={18}
                    style={{
                      position: 'absolute',
                      left: 16,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9CA3AF',
                    }}
                  />
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Min 8 characters"
                    style={{
                      width: '100%',
                      padding: '14px 46px 14px 46px',
                      borderRadius: 16,
                      border: '1.5px solid #E5E7EB',
                      fontSize: 15,
                      outline: 'none',
                      transition: 'all 0.2s',
                      fontFamily: 'inherit',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#8B5CF6')}
                    onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{
                      position: 'absolute',
                      right: 16,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#9CA3AF',
                    }}
                  >
                    {showPass ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: 8,
                  }}
                >
                  Confirm Password
                </label>
                <div style={{ position: 'relative' }}>
                  <FiLock
                    size={18}
                    style={{
                      position: 'absolute',
                      left: 16,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9CA3AF',
                    }}
                  />
                  <input
                    type="password"
                    required
                    value={form.confirm}
                    onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                    placeholder="Re-enter password"
                    style={{
                      width: '100%',
                      padding: '14px 16px 14px 46px',
                      borderRadius: 16,
                      border: '1.5px solid #E5E7EB',
                      fontSize: 15,
                      outline: 'none',
                      transition: 'all 0.2s',
                      fontFamily: 'inherit',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#8B5CF6')}
                    onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                  />
                </div>
              </div>

              {/* AI Features notice (without emoji) */}
              <div
                style={{
                  background: 'rgba(139,92,246,0.08)',
                  borderRadius: 16,
                  padding: '14px 16px',
                  marginBottom: 24,
                  display: 'flex',
                  gap: 12,
                  border: '1px solid rgba(139,92,246,0.15)',
                }}
              >
                <FiCpu size={20} color="#8B5CF6" style={{ marginTop: 2 }} />
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 13,
                      color: '#7C3AED',
                      marginBottom: 4,
                    }}
                  >
                    AI Features Included
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>
                    AI Tutor (Hindi/Punjabi) · Adaptive Study Plans · Voice & OCR Input · Offline Access
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                  color: 'white',
                  padding: '14px 20px',
                  borderRadius: 20,
                  fontWeight: 700,
                  fontSize: 16,
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 10px 25px rgba(139,92,246,0.3)',
                  marginBottom: 24,
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(-2px)'
                    e.target.style.boxShadow = '0 15px 30px rgba(139,92,246,0.4)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = '0 10px 25px rgba(139,92,246,0.3)'
                  }
                }}
              >
                {loading ? (
                  'Creating Account...'
                ) : (
                  <>
                    Create Free Account <FiArrowRight />
                  </>
                )}
              </button>
            </form>

            <p
              style={{
                textAlign: 'center',
                fontSize: 14,
                color: '#6B7280',
              }}
            >
              Already have an account?{' '}
              <Link
                to="/login"
                style={{
                  color: '#8B5CF6',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                Sign in →
              </Link>
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  )
}