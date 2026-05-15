import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { authAPI } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import { FiUserPlus, FiEye, FiEyeOff } from 'react-icons/fi'

const GRADES = ['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12']

export default function Register() {
  const { t } = useTranslation()
  const { setUser, setToken } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', phone: '', password: '', role: 'student', grade_level: 'Class 6', language: 'hi' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      const { data } = await authAPI.register(form)
      setToken(data.token)
      setUser(data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        <div className="surface-card p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">E</div>
            <h1 className="text-2xl font-bold text-slate-800">Join Eduko</h1>
            <p className="text-slate-500 text-sm mt-1">Create your free account</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm mb-5">⚠ {error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="form-label">{t('name')}</label>
              <input id="reg-name" type="text" className="form-input" placeholder="Your full name" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">{t('phone')}</label>
              <input id="reg-phone" type="tel" className="form-input" placeholder="10-digit mobile number" value={form.phone} onChange={e => set('phone', e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">{t('password')}</label>
              <div className="relative">
                <input id="reg-password" type={showPass ? 'text' : 'password'} className="form-input pr-12" placeholder="Min. 6 characters" value={form.password} onChange={e => set('password', e.target.value)} required />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            {/* Role */}
            <div className="form-group">
              <label className="form-label">{t('role')}</label>
              <div className="grid grid-cols-3 gap-2">
                {['student','teacher','volunteer'].map(r => (
                  <button type="button" key={r} onClick={() => set('role', r)}
                    className={`py-2.5 rounded-xl border-2 text-sm font-semibold capitalize transition-all
                      ${form.role === r ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                    {t(r)}
                  </button>
                ))}
              </div>
            </div>

            {/* Grade (student only) */}
            {form.role === 'student' && (
              <div className="form-group">
                <label className="form-label">{t('grade')}</label>
                <select id="reg-grade" className="form-input" value={form.grade_level} onChange={e => set('grade_level', e.target.value)}>
                  {GRADES.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
            )}

            {/* Language */}
            <div className="form-group">
              <label className="form-label">Preferred {t('language')}</label>
              <div className="grid grid-cols-3 gap-2">
                {[{code:'en',label:'English'},{code:'hi',label:'हिंदी'},{code:'pa',label:'ਪੰਜਾਬੀ'}].map(l => (
                  <button type="button" key={l.code} onClick={() => set('language', l.code)}
                    className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-all
                      ${form.language === l.code ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <button id="reg-submit" type="submit" disabled={loading} className="btn btn-primary btn-full btn-lg gap-2 mt-2">
              {loading ? <span className="animate-spin">↻</span> : <FiUserPlus size={18} />}
              {loading ? 'Creating account...' : t('registerBtn')}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            {t('hasAccount')}{' '}
            <Link to="/login" className="text-primary-600 font-semibold hover:underline">{t('loginBtn')}</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
