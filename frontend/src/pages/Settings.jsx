import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import AppLayout from '../components/AppLayout'
import LanguageSwitcher from '../components/LanguageSwitcher'
import useStore from '../store/useStore'
import {
  FiUser,
  FiPhone,
  FiShield,
  FiBell,
  FiGlobe,
  FiCheck,
  FiDownload,
  FiTrash2,
  FiLock,
  FiLogOut,
  FiSave,
  FiSmartphone,
  FiCalendar,
  FiBookOpen,
  FiCpu,
  FiCamera,
} from 'react-icons/fi'
import { authAPI } from '../api/client'

export default function Settings() {
  const { t } = useTranslation()
  const { user, setUser, logout } = useStore()
  const [notifications, setNotifications] = useState({
    sms: true,
    exam: true,
    homework: true,
    plan: true,
  })
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    grade_level: user?.grade_level || 8,
    avatarFile: null,
    avatarPreview: null,
  })
  const [tab, setTab] = useState('profile')

  const handleSave = async () => {
    try {
      const formData = new FormData()
      formData.append('name', form.name)
      if (form.phone) formData.append('phone', form.phone)
      if (user?.role === 'student' && form.grade_level) {
        formData.append('grade_level', form.grade_level)
      }
      if (form.avatarFile) {
        formData.append('avatar', form.avatarFile)
      }

      const res = await authAPI.updateProfile(formData)
      if (res.data && res.data.user) {
        setUser({ ...res.data.user, profile: res.data.profile })
      }
      
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      console.error(err)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
  }

  const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000'
  const displayAvatar = form.avatarPreview || (user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${backendUrl}${user.avatar}`) : null)

  const handleLogout = async () => {
    try {
      await authAPI.logout()
    } catch {}
    logout()
    window.location.href = '/login'
  }

  const clearOfflineData = () => {
    if (window.caches) {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)))
    }
    localStorage.removeItem('eduko_sync')
    alert('Offline data cleared.')
  }

  const tabs = [
    { id: 'profile', labelKey: 'profileInfo', icon: FiUser },
    { id: 'language', labelKey: 'langPref', icon: FiGlobe },
    { id: 'notifications', labelKey: 'notifPref', icon: FiBell },
    { id: 'security', labelKey: 'security', icon: FiShield },
  ]

  return (
    <AppLayout title={t('settings')}>
      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: '24px 60px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* User header card (glass) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            background: 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(12px)',
            borderRadius: 32,
            padding: '24px 32px',
            marginBottom: 32,
            border: '1px solid rgba(255,255,255,0.5)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            flexWrap: 'wrap',
          }}
        >
          {displayAvatar ? (
            <img
              src={displayAvatar}
              alt="Avatar"
              style={{
                width: 64,
                height: 64,
                borderRadius: 24,
                objectFit: 'cover',
                boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
              }}
            />
          ) : (
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 24,
                background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                fontWeight: 'bold',
                color: 'white',
                boxShadow: '0 10px 20px rgba(139,92,246,0.3)',
              }}
            >
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: '#1F2937',
                marginBottom: 4,
              }}
            >
              {user?.name || 'User'}
            </div>
            <div
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                background: 'rgba(139,92,246,0.1)',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                color: '#7C3AED',
                marginBottom: 6,
              }}
            >
              {t(user?.role || 'student')}
            </div>
            <div style={{ fontSize: 13, color: '#6B7280' }}>{user?.email}</div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            display: 'flex',
            gap: 8,
            background: '#F3F4F6',
            padding: 6,
            borderRadius: 24,
            marginBottom: 32,
            flexWrap: 'wrap',
          }}
        >
          {tabs.map((tabItem) => {
            const Icon = tabItem.icon
            const isActive = tab === tabItem.id
            return (
              <button
                key={tabItem.id}
                onClick={() => setTab(tabItem.id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '10px 16px',
                  borderRadius: 20,
                  border: 'none',
                  background: isActive ? 'white' : 'transparent',
                  boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: 14,
                  fontWeight: 600,
                  color: isActive ? '#7C3AED' : '#6B7280',
                }}
              >
                <Icon size={16} />
                <span>{t(tabItem.labelKey) || tabItem.labelKey}</span>
              </button>
            )
          })}
        </motion.div>

        {/* Tab content */}
        {tab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              background: 'white',
              borderRadius: 32,
              padding: '32px 36px',
              boxShadow: '0 20px 35px -12px rgba(0,0,0,0.1)',
              border: '1px solid #F0F0F0',
            }}
          >
            <h3
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 20,
                fontWeight: 800,
                color: '#1F2937',
                marginBottom: 28,
              }}
            >
              <FiUser size={22} color="#8B5CF6" /> {t('profileInfo')}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* Avatar Upload */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt="Preview"
                    style={{ width: 80, height: 80, borderRadius: 24, objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: 80, height: 80, borderRadius: 24, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FiUser size={32} color="#9CA3AF" />
                  </div>
                )}
                <div>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 16px',
                      background: '#F9FAFB',
                      border: '1px solid #E5E7EB',
                      borderRadius: 12,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#4B5563',
                      transition: 'all 0.2s',
                    }}
                  >
                    <FiCamera size={16} />
                    Change Picture
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files[0]
                        if (file) {
                          setForm(f => ({ ...f, avatarFile: file, avatarPreview: URL.createObjectURL(file) }))
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: 8,
                  }}
                >
                  {t('fullName')}
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: 20,
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
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: 8,
                  }}
                >
                  <FiPhone size={12} style={{ display: 'inline', marginRight: 6 }} />
                  {t('phoneNumber')}
                </label>
                <input
                  type="tel"
                  placeholder="+917001234567"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: 20,
                    border: '1.5px solid #E5E7EB',
                    fontSize: 15,
                    outline: 'none',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#8B5CF6')}
                  onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                />
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>
                  Used for SMS notifications
                </div>
              </div>

              {user?.role === 'student' && (
                <div>
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
                    onChange={(e) => setForm(f => ({ ...f, grade_level: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      borderRadius: 20,
                      border: '1.5px solid #E5E7EB',
                      fontSize: 15,
                      outline: 'none',
                      transition: 'all 0.2s',
                      fontFamily: 'inherit',
                      background: 'white',
                    }}
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i+1} value={i+1}>Class {i+1}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: 8,
                  }}
                >
                  {t('emailReadOnly')}
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: 20,
                    border: '1.5px solid #E5E7EB',
                    fontSize: 15,
                    background: '#F8F5FF',
                    color: '#6B7280',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
              <button
                onClick={handleSave}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                  color: 'white',
                  padding: '12px 28px',
                  borderRadius: 20,
                  fontWeight: 700,
                  fontSize: 15,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 8px 20px rgba(139,92,246,0.3)',
                  width: 'fit-content',
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = '0 12px 28px rgba(139,92,246,0.4)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = '0 8px 20px rgba(139,92,246,0.3)'
                }}
              >
                {saved ? (
                  <>
                    <FiCheck /> {t('saved')}
                  </>
                ) : (
                  <>
                    <FiSave /> {t('saveChanges')}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {tab === 'language' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              background: 'white',
              borderRadius: 32,
              padding: '32px 36px',
              boxShadow: '0 20px 35px -12px rgba(0,0,0,0.1)',
              border: '1px solid #F0F0F0',
            }}
          >
            <h3
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 20,
                fontWeight: 800,
                color: '#1F2937',
                marginBottom: 24,
              }}
            >
              <FiGlobe size={22} color="#8B5CF6" /> {t('langPref')}
            </h3>
            <p style={{ color: '#6B7280', marginBottom: 24, lineHeight: 1.6 }}>
              {t('langDesc')}
            </p>
            <LanguageSwitcher />
            <div
              style={{
                marginTop: 32,
                background: 'rgba(139,92,246,0.08)',
                borderRadius: 20,
                padding: '18px 20px',
                border: '1px solid rgba(139,92,246,0.15)',
                display: 'flex',
                gap: 14,
              }}
            >
              <FiCpu size={24} color="#8B5CF6" />
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    color: '#7C3AED',
                    marginBottom: 4,
                  }}
                >
                  {t('multilingualAI')}
                </div>
                <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>
                  {t('multilingualDesc')}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {tab === 'notifications' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              background: 'white',
              borderRadius: 32,
              padding: '32px 36px',
              boxShadow: '0 20px 35px -12px rgba(0,0,0,0.1)',
              border: '1px solid #F0F0F0',
            }}
          >
            <h3
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 20,
                fontWeight: 800,
                color: '#1F2937',
                marginBottom: 24,
              }}
            >
              <FiBell size={22} color="#8B5CF6" /> {t('notifPref')}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                {
                  key: 'sms',
                  label: 'SMS Alerts',
                  desc: 'Important updates via SMS',
                  icon: FiSmartphone,
                },
                {
                  key: 'exam',
                  label: 'Exam Reminders',
                  desc: 'Get reminders before upcoming exams',
                  icon: FiCalendar,
                },
                {
                  key: 'homework',
                  label: 'Assignment Alerts',
                  desc: 'Be notified of new assignments',
                  icon: FiBookOpen,
                },
                {
                  key: 'plan',
                  label: 'Plan Updates',
                  desc: 'When your AI study plan is regenerated',
                  icon: FiCpu,
                },
              ].map((n) => {
                const Icon = n.icon
                const isEnabled = notifications[n.key]
                return (
                  <div
                    key={n.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 18px',
                      background: '#F9FAFB',
                      borderRadius: 20,
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
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
                        <Icon size={20} color="#8B5CF6" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#1F2937' }}>
                          {n.label}
                        </div>
                        <div style={{ fontSize: 12, color: '#9CA3AF' }}>{n.desc}</div>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setNotifications((prev) => ({ ...prev, [n.key]: !prev[n.key] }))
                      }
                      style={{
                        position: 'relative',
                        width: 48,
                        height: 26,
                        borderRadius: 30,
                        background: isEnabled ? '#8B5CF6' : '#CBD5E1',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          top: 2,
                          width: 22,
                          height: 22,
                          background: 'white',
                          borderRadius: '50%',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                          left: isEnabled ? 24 : 2,
                          transition: 'left 0.2s',
                        }}
                      />
                    </button>
                  </div>
                )
              })}
            </div>
            <button
              onClick={handleSave}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                color: 'white',
                padding: '12px 28px',
                borderRadius: 20,
                fontWeight: 700,
                fontSize: 15,
                border: 'none',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 8px 20px rgba(139,92,246,0.3)',
                marginTop: 24,
                width: 'fit-content',
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 12px 28px rgba(139,92,246,0.4)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 8px 20px rgba(139,92,246,0.3)'
              }}
            >
              {saved ? (
                <>
                  <FiCheck /> {t('saved')}
                </>
              ) : (
                <>
                  <FiSave /> {t('saveChanges')}
                </>
              )}
            </button>
          </motion.div>
        )}

        {tab === 'security' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
          >
            {/* Change password card */}
            <div
              style={{
                background: 'white',
                borderRadius: 32,
                padding: '32px 36px',
                boxShadow: '0 20px 35px -12px rgba(0,0,0,0.1)',
                border: '1px solid #F0F0F0',
              }}
            >
              <h3
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 20,
                  fontWeight: 800,
                  color: '#1F2937',
                  marginBottom: 24,
                }}
              >
                <FiLock size={22} color="#8B5CF6" /> {t('changePassword')}
              </h3>
              <div style={{ marginBottom: 24 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: 8,
                  }}
                >
                  {t('newPassword')}
                </label>
                <input
                  type="password"
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: 20,
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
              <button
                onClick={handleSave}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                  color: 'white',
                  padding: '12px 28px',
                  borderRadius: 20,
                  fontWeight: 700,
                  fontSize: 15,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 8px 20px rgba(139,92,246,0.3)',
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = '0 12px 28px rgba(139,92,246,0.4)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = '0 8px 20px rgba(139,92,246,0.3)'
                }}
              >
                {saved ? (
                  <>
                    <FiCheck /> {t('saved')}
                  </>
                ) : (
                  <>
                    <FiSave /> {t('updatePassword')}
                  </>
                )}
              </button>
            </div>

            {/* Offline data card */}
            <div
              style={{
                background: 'white',
                borderRadius: 32,
                padding: '32px 36px',
                boxShadow: '0 20px 35px -12px rgba(0,0,0,0.1)',
                border: '1px solid #F0F0F0',
              }}
            >
              <h3
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 20,
                  fontWeight: 800,
                  color: '#1F2937',
                  marginBottom: 16,
                }}
              >
                <FiDownload size={22} color="#3B82F6" /> {t('offlineData')}
              </h3>
              <p style={{ color: '#6B7280', marginBottom: 24, lineHeight: 1.6 }}>
                {t('offlineDataDesc')}
              </p>
              <button
                onClick={clearOfflineData}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  background: '#EFF6FF',
                  color: '#1D4ED8',
                  padding: '12px 24px',
                  borderRadius: 20,
                  fontWeight: 600,
                  fontSize: 14,
                  border: '1px solid #BFDBFE',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#DBEAFE'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#EFF6FF'
                }}
              >
                <FiTrash2 size={14} /> {t('clearCache')}
              </button>
            </div>

            {/* Sign out card */}
            <div
              style={{
                background: 'white',
                borderRadius: 32,
                padding: '32px 36px',
                boxShadow: '0 20px 35px -12px rgba(0,0,0,0.1)',
                border: '1px solid #FEE2E2',
              }}
            >
              <h3
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: '#B91C1C',
                  marginBottom: 12,
                }}
              >
                {t('signOutHeader')}
              </h3>
              <p style={{ color: '#6B7280', marginBottom: 24, lineHeight: 1.6 }}>
                {t('signOutDesc')}
              </p>
              <button
                onClick={handleLogout}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  background: '#FEE2E2',
                  color: '#B91C1C',
                  padding: '12px 24px',
                  borderRadius: 20,
                  fontWeight: 600,
                  fontSize: 14,
                  border: '1px solid #FECACA',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#FECACA'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#FEE2E2'
                }}
              >
                <FiLogOut size={14} /> {t('signOutBtn')}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  )
}