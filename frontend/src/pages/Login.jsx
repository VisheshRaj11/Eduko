import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { authAPI } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import { FiEye, FiEyeOff, FiLogIn } from 'react-icons/fi'

export default function Login() {
  const { t } = useTranslation()
  const { setUser, setToken } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ phone: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await authAPI.login(form)
      setToken(data.token)
      setUser(data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)' }}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-700 flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="relative z-10 text-center text-white">
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center text-4xl font-bold mb-6 mx-auto">E</div>
          <h2 className="text-3xl font-bold mb-3">Welcome Back</h2>
          <p className="text-primary-200 text-lg">Continue your learning journey</p>
          <div className="mt-10 space-y-4 text-left max-w-xs">
            {['AI Tutor in your language', 'Offline learning support', 'Track your progress'].map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-white/80">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</div>
                {f}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md">
          <div className="surface-card p-8">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">E</div>
              <h1 className="text-2xl font-bold text-slate-800">{t('login')} to Eduko</h1>
              <p className="text-slate-500 text-sm mt-1">Enter your phone and password to continue</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm mb-5 flex items-start gap-2">
                ⚠ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="form-group">
                <label className="form-label">{t('phone')}</label>
                <input
                  id="login-phone"
                  type="tel"
                  className="form-input"
                  placeholder="10-digit mobile number"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('password')}</label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPass ? 'text' : 'password'}
                    className="form-input pr-12"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPass ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              <button id="login-submit" type="submit" disabled={loading} className="btn btn-primary btn-full btn-lg gap-2">
                {loading ? <span className="animate-spin">↻</span> : <FiLogIn size={18} />}
                {loading ? 'Signing in...' : t('loginBtn')}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              {t('noAccount')}{' '}
              <Link to="/register" className="text-primary-600 font-semibold hover:underline">
                {t('registerBtn')}
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
