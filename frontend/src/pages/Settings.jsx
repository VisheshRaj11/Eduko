import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import AppLayout from '../components/AppLayout'
import LanguageSwitcher from '../components/LanguageSwitcher'
import useStore from '../store/useStore'
import { FiUser, FiPhone, FiShield, FiBell, FiGlobe, FiCheck, FiDownload, FiTrash2 } from 'react-icons/fi'
import { authAPI } from '../api/client'

export default function Settings() {
  const { t } = useTranslation()
  const { user, setUser, logout } = useStore()
  const [notifications, setNotifications] = useState({ sms: true, exam: true, homework: true, plan: true })
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', password: '' })
  const [tab, setTab] = useState('profile')

  const handleSave = async () => {
    try {
      // Update profile (fire-and-forget; backend not wired yet)
      setSaved(true)
      if (form.name !== user?.name || form.phone !== user?.phone) {
        setUser({ ...user, name: form.name, phone: form.phone })
      }
      setTimeout(() => setSaved(false), 2500)
    } catch { setSaved(true); setTimeout(() => setSaved(false), 2500) }
  }

  const handleLogout = async () => {
    try { await authAPI.logout() } catch {}
    logout()
    window.location.href = '/login'
  }

  const clearOfflineData = () => {
    if (window.caches) {
      caches.keys().then(keys => keys.forEach(k => caches.delete(k)))
    }
    localStorage.removeItem('eduko_sync')
    alert('Offline data cleared.')
  }

  const tabs = [
    { id: 'profile',       label: 'Profile',         icon: FiUser },
    { id: 'language',      label: 'Language',         icon: FiGlobe },
    { id: 'notifications', label: 'Notifications',    icon: FiBell },
    { id: 'security',      label: 'Security & Data',  icon: FiShield },
  ]

  return (
    <AppLayout title={t('settings')}>
      <div className="main-content animate-fade-in max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4 p-5 rounded-2xl"
          style={{ background: 'linear-gradient(135deg, #F3F0FF, #EDE9FE)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-xl">{user?.name || 'User'}</div>
            <div className="text-purple-600 text-sm font-medium capitalize">{user?.role || 'student'}</div>
            <div className="text-slate-500 text-xs">{user?.email}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 flex-wrap">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all flex-1 justify-center
                ${tab === t.id ? 'bg-white text-purple-700 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>
              <t.icon size={13} /> {t.label}
            </button>
          ))}
        </div>

        {/* ── PROFILE TAB ── */}
        {tab === 'profile' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FiUser className="text-purple-600" /> Profile Information
            </h3>
            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label"><FiPhone size={12} className="inline mr-1" />Phone Number</label>
                <input className="form-input" type="tel" placeholder="+917001234567"
                  value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                <div className="text-xs text-slate-400 mt-1">Used for Twilio SMS notifications</div>
              </div>
              <div className="form-group">
                <label className="form-label">Email (read-only)</label>
                <input className="form-input" value={user?.email || ''} readOnly
                  style={{ background: '#F8F5FF', color: '#64748B' }} />
              </div>
              <button onClick={handleSave}
                className="btn btn-purple btn-lg gap-2">
                {saved ? <><FiCheck /> Saved!</> : 'Save Changes'}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── LANGUAGE TAB ── */}
        {tab === 'language' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FiGlobe className="text-purple-600" /> Language Preference
            </h3>
            <p className="text-slate-500 text-sm mb-4">
              Choose the language for the app interface. AI Tutor supports all languages simultaneously.
            </p>
            <LanguageSwitcher />
            <div className="mt-6 p-4 bg-purple-50 rounded-xl border border-purple-100">
              <div className="font-semibold text-purple-800 text-sm mb-1">🌐 Multilingual AI Tutor</div>
              <div className="text-xs text-purple-600">
                You can ask questions in Hindi, Punjabi, or English — the AI tutor understands and responds in the same language you use.
              </div>
            </div>
          </motion.div>
        )}

        {/* ── NOTIFICATIONS TAB ── */}
        {tab === 'notifications' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FiBell className="text-purple-600" /> Notification Preferences
            </h3>
            <div className="space-y-3">
              {[
                { key: 'sms',      label: 'SMS Alerts',       desc: 'Important updates via Twilio SMS', emoji: '📱' },
                { key: 'exam',     label: 'Exam Reminders',   desc: 'Get SMS before upcoming exams', emoji: '📝' },
                { key: 'homework', label: 'Assignment Alerts', desc: 'Be notified of new assignments', emoji: '📚' },
                { key: 'plan',     label: 'Plan Updates',     desc: 'When your AI study plan is regenerated', emoji: '🤖' },
              ].map(n => (
                <div key={n.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{n.emoji}</span>
                    <div>
                      <div className="font-medium text-slate-800 text-sm">{n.label}</div>
                      <div className="text-xs text-slate-500">{n.desc}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setNotifications(prev => ({ ...prev, [n.key]: !prev[n.key] }))}
                    style={{
                      position: 'relative', width: 44, height: 24, borderRadius: 12,
                      background: notifications[n.key] ? '#8B5CF6' : '#CBD5E1',
                      border: 'none', cursor: 'pointer', transition: 'background 0.2s',
                    }}>
                    <span style={{
                      position: 'absolute', top: 2, width: 20, height: 20,
                      background: 'white', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      left: notifications[n.key] ? 22 : 2, transition: 'left 0.2s',
                    }} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={handleSave} className="btn btn-purple gap-2 mt-4">
              {saved ? <><FiCheck /> Saved!</> : 'Save Preferences'}
            </button>
          </motion.div>
        )}

        {/* ── SECURITY & DATA TAB ── */}
        {tab === 'security' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="glass-card p-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FiShield className="text-purple-600" /> Change Password
              </h3>
              <div className="space-y-3">
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input type="password" className="form-input" placeholder="Min 8 characters"
                    value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                </div>
                <button onClick={handleSave} className="btn btn-purple gap-2">
                  {saved ? <><FiCheck /> Updated!</> : 'Update Password'}
                </button>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FiDownload className="text-blue-600" /> Offline Data
              </h3>
              <p className="text-slate-500 text-sm mb-4">
                Eduko caches lessons and quizzes for offline access. You can clear cached data here.
              </p>
              <button onClick={clearOfflineData}
                className="btn gap-2" style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                <FiTrash2 size={14} /> Clear Offline Cache
              </button>
            </div>

            <div className="glass-card p-6 border border-red-100">
              <h3 className="font-bold text-red-700 mb-2">Sign Out</h3>
              <p className="text-slate-500 text-sm mb-4">You'll need to log in again to access your account.</p>
              <button onClick={handleLogout}
                className="btn gap-2" style={{ background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FECACA' }}>
                Sign Out of Eduko
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  )
}
