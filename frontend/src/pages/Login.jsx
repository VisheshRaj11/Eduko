import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { authAPI } from '../api/client'
import useStore from '../store/useStore'
import {
  FiMail,
  FiLock,
  FiArrowRight,
  FiEye,
  FiEyeOff,
  FiUser,
  FiBriefcase,
  FiHeart,
  FiStar,
  FiChevronLeft,
} from 'react-icons/fi'

const ROLES = [
  { value: 'student', label: 'Student', icon: FiUser, desc: 'Learn & grow' },
  { value: 'teacher', label: 'Teacher', icon: FiBriefcase, desc: 'Teach & inspire' },
  { value: 'volunteer', label: 'Volunteer', icon: FiHeart, desc: 'Give back' },
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
    setError('')
    setLoading(true)
    try {
      const { data } = await authAPI.login({ email: form.email, password: form.password })
      setToken(data.token)
      setUser(data.user)
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

      {/* Simple header (consistent with landing page style) */}
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
                // boxShadow: '0 8px 20px rgba(139,92,246,0.3)',?
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
            to="/register"
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
            Create account
          </Link>
        </div>
      </header>

      {/* Main content: two-column layout (matches landing hero structure) */}
      <main style={{ position: 'relative', zIndex: 2, padding: '40px 24px 80px' }}>
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 60,
            alignItems: 'center',
          }}
        >
          {/* LEFT PANEL – Branding & testimonials (glass card) */}
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
                 <img src="./icon.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
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
                Welcome to Eduko
              </h2>
              <p style={{ color: '#6B7280', lineHeight: 1.6 }}>
                AI-powered education for rural India. Learn in Hindi, Punjabi, or English — even offline.
              </p>
            </div>

            {/* Testimonial card (no emoji) */}
            <div
              style={{
                background: 'white',
                borderRadius: 24,
                padding: '24px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                border: '1px solid #F0F0F0',
              }}
            >
              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.7,
                  color: '#374151',
                  marginBottom: 20,
                  fontStyle: 'italic',
                }}
              >
                “Eduko's AI tutor explained fractions in Hindi. I finally understood what I couldn't in 2 years!”
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: 18,
                  }}
                >
                  M
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1F2937' }}>
                    Meera Devi, Class 8
                  </div>
                  <div style={{ color: '#9CA3AF', fontSize: 12 }}>
                    Village Sujanpur, Himachal Pradesh
                  </div>
                </div>
              </div>
            </div>

            {/* Floating stat (like landing page) */}
            <motion.div
              className="float-animation"
              style={{
                marginTop: 32,
                textAlign: 'center',
                padding: '12px 20px',
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(8px)',
                borderRadius: 20,
                border: '1px solid rgba(255,255,255,0.5)',
              }}
            >
              <span style={{ fontWeight: 800, color: '#8B5CF6' }}>150K+</span>
              <span style={{ color: '#6B7280', marginLeft: 8 }}>active learners</span>
            </motion.div>
          </motion.div>

          {/* RIGHT PANEL – Login Form (glass card) */}
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
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <h1
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  color: '#1F2937',
                  marginBottom: 8,
                }}
              >
                Welcome back
              </h1>
              <p style={{ color: '#6B7280', fontSize: 15 }}>
                Sign in to continue your learning journey
              </p>
            </div>

            {/* Role selector (with icons, no emojis) */}
            <div
              style={{
                display: 'flex',
                gap: 12,
                marginBottom: 32,
                flexWrap: 'wrap',
              }}
            >
              {ROLES.map((role) => {
                const Icon = role.icon
                const isActive = form.role === role.value
                return (
                  <button
                    key={role.value}
                    onClick={() => setForm((f) => ({ ...f, role: role.value }))}
                    style={{
                      flex: 1,
                      padding: '12px 8px',
                      borderRadius: 20,
                      border: `2px solid ${isActive ? '#8B5CF6' : '#E5E7EB'}`,
                      background: isActive ? 'rgba(139,92,246,0.05)' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Icon size={22} color={isActive ? '#8B5CF6' : '#9CA3AF'} />
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: isActive ? '#7C3AED' : '#6B7280',
                      }}
                    >
                      {role.label}
                    </span>
                    <span style={{ fontSize: 10, color: '#9CA3AF' }}>
                      {role.desc}
                    </span>
                  </button>
                )
              })}
            </div>

            <form onSubmit={handleSubmit}>
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

              {/* Email field */}
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
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    placeholder="you@example.com"
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
                    onFocus={(e) =>
                      (e.target.style.borderColor = '#8B5CF6')
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor = '#E5E7EB')
                    }
                  />
                </div>
              </div>

              {/* Password field */}
              <div style={{ marginBottom: 12 }}>
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
                    onChange={(e) =>
                      setForm((f) => ({ ...f, password: e.target.value }))
                    }
                    placeholder="••••••••"
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
                    onFocus={(e) =>
                      (e.target.style.borderColor = '#8B5CF6')
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor = '#E5E7EB')
                    }
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

              <div style={{ textAlign: 'right', marginBottom: 28 }}>
                <a
                  href="#"
                  style={{
                    fontSize: 13,
                    color: '#8B5CF6',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Forgot password?
                </a>
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
                {loading ? 'Signing in...' : (
                  <>
                    Sign In <FiArrowRight />
                  </>
                )}
              </button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
                <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>
                  OR
                </span>
                <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
              </div>

              <button
                type="button"
                disabled
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 20,
                  border: '1.5px solid #E5E7EB',
                  background: '#F9FAFB',
                  cursor: 'not-allowed',
                  opacity: 0.6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#4B5563',
                }}
              >
                <img
                  src="https://www.google.com/favicon.ico"
                  alt="Google"
                  width={18}
                  height={18}
                />
                Continue with Google (Coming Soon)
              </button>
            </form>

            <p
              style={{
                marginTop: 28,
                textAlign: 'center',
                fontSize: 14,
                color: '#6B7280',
              }}
            >
              Don't have an account?{' '}
              <Link
                to="/register"
                style={{
                  color: '#8B5CF6',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                Create free account →
              </Link>
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  )
}