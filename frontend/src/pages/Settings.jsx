import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import AppLayout from '../components/AppLayout'
import { useAuth } from '../hooks/useAuth'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { FiUser, FiPhone, FiShield, FiBell, FiMoon, FiGlobe } from 'react-icons/fi'

export default function Settings() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [notifications, setNotifications] = useState({ sms: true, exam: true, homework: true })
  const [saved, setSaved] = useState(false)

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  return (
    <AppLayout title={t('settings')}>
      <div className="main-content animate-fade-in max-w-2xl">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Account Settings</h2>

        {/* Profile */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="surface-card p-6 mb-5">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><FiUser className="text-primary-600" /> Profile</h3>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-2xl bg-primary-600 text-white flex items-center justify-center text-2xl font-bold">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="font-bold text-slate-800 text-lg">{user?.name || 'User'}</div>
              <div className="text-slate-500 text-sm capitalize">{user?.role || 'student'}</div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="form-group">
              <label className="form-label flex items-center gap-1"><FiUser size={13} /> Full Name</label>
              <input type="text" className="form-input" defaultValue={user?.name} />
            </div>
            <div className="form-group">
              <label className="form-label flex items-center gap-1"><FiPhone size={13} /> Phone</label>
              <input type="tel" className="form-input" defaultValue={user?.phone} />
            </div>
          </div>
        </motion.div>

        {/* Language */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="surface-card p-6 mb-5">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><FiGlobe className="text-primary-600" /> Language</h3>
          <LanguageSwitcher />
        </motion.div>

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="surface-card p-6 mb-5">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><FiBell className="text-primary-600" /> Notifications</h3>
          <div className="space-y-3">
            {[
              { key: 'sms', label: 'SMS Alerts', desc: 'Receive SMS for important updates' },
              { key: 'exam', label: 'Exam Reminders', desc: 'Get reminders before exams' },
              { key: 'homework', label: 'Homework Alerts', desc: 'Be notified of new assignments' },
            ].map(n => (
              <div key={n.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <div className="font-medium text-slate-800 text-sm">{n.label}</div>
                  <div className="text-xs text-slate-500">{n.desc}</div>
                </div>
                <button
                  onClick={() => setNotifications(prev => ({ ...prev, [n.key]: !prev[n.key] }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${notifications[n.key] ? 'bg-primary-500' : 'bg-slate-300'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${notifications[n.key] ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Security */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="surface-card p-6 mb-6">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><FiShield className="text-primary-600" /> Security</h3>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input type="password" className="form-input" placeholder="Leave blank to keep current" />
          </div>
        </motion.div>

        <button onClick={handleSave} className="btn btn-primary btn-lg gap-2">
          {saved ? '✓ Saved!' : t('save') + ' Changes'}
        </button>
      </div>
    </AppLayout>
  )
}
