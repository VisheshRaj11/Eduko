// components/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import useStore from '../store/useStore'
import { authAPI } from '../api/client'
import {
  FiHome,
  FiMessageSquare,
  FiCalendar,
  FiBook,
  FiTarget,
  FiUsers,
  FiSettings,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight,
  FiLayers,
  FiCheckSquare,
} from 'react-icons/fi'
import { useState } from 'react'

const studentLinks = [
  { to: '/dashboard', icon: FiHome, labelKey: 'dashboard' },
  { to: '/tutor', icon: FiMessageSquare, labelKey: 'tutor', badge: 'AI' },
  { to: '/plan', icon: FiCalendar, labelKey: 'plan' },
  { to: '/library', icon: FiBook, labelKey: 'library' },
  { to: '/quiz', icon: FiTarget, labelKey: 'quizzes' },
  { to: '/flashcards', icon: FiLayers, labelKey: 'flashcards' },
  // { to: '/volunteers', icon: FiUsers, labelKey: 'volunteers' },
  { to: '/settings', icon: FiSettings, labelKey: 'settings' },
]

const teacherLinks = [
  { to: '/teacher', icon: FiHome, labelKey: 'dashboard' },
  // { to: '/analytics', icon: FiTrendingUp, labelKey: 'analytics' },
  { to: '/assigned-tasks', icon: FiCheckSquare, labelKey: 'Assigned Tasks' },
  { to: '/library', icon: FiBook, labelKey: 'library' },
  { to: '/tutor', icon: FiMessageSquare, labelKey: 'tutor', badge: 'AI' },
  // { to: '/volunteers', icon: FiUsers, labelKey: 'volunteers' },
  { to: '/settings', icon: FiSettings, labelKey: 'settings' },
]

const volunteerLinks = [
  { to: '/volunteers', icon: FiUsers, labelKey: 'volunteers' },
  { to: '/tutor', icon: FiMessageSquare, labelKey: 'tutor', badge: 'AI' },
  { to: '/settings', icon: FiSettings, labelKey: 'settings' },
]

export default function Sidebar() {
  const { t } = useTranslation()
  const { user, sidebarOpen, setSidebarOpen, logout } = useStore()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  // Determine links based on role
  const links =
    user?.role === 'teacher'
      ? teacherLinks
      : user?.role === 'volunteer'
      ? volunteerLinks
      : studentLinks

  // User initials
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'

  const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000'
  const displayAvatar = user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${backendUrl}${user.avatar}`) : null

  const handleLogout = async () => {
    try {
      await authAPI.logout()
    } catch {}
    logout()
    navigate('/login')
  }

  // Toggle collapse on desktop
  const toggleCollapse = () => setCollapsed((c) => !c)

  // Close sidebar on mobile when a link is clicked
  const handleLinkClick = () => {
    if (window.innerWidth < 768) setSidebarOpen(false)
  }

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(4px)',
              zIndex: 1040,
            }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar container */}
      <aside
        className={`sidebar ${sidebarOpen ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: collapsed ? 80 : 280,
          background: 'linear-gradient(180deg, #1E1B2E 0%, #1A1730 100%)',
          backdropFilter: 'blur(20px)',
          boxShadow: '2px 0 20px rgba(0,0,0,0.2)',
          zIndex: 1050,
          transition: 'width 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1)',
          display: 'flex',
          flexDirection: 'column',
          overflowX: 'hidden',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        {/* Logo section */}
        <div
          style={{
            padding: collapsed ? '20px 12px' : '20px 20px 12px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            marginBottom: 8,
            transition: 'padding 0.2s',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: collapsed ? 0 : 10,
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background:"white",
                // background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                fontWeight: 'bold',
                color: 'white',
                flexShrink: 0,
              }}
            >
               <img src="./icon.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 20,
                    color: 'white',
                    letterSpacing: '-0.3px',
                  }}
                >
                  Eduko
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.5)',
                    fontWeight: 500,
                  }}
                >
                  AI Education Platform
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Navigation links */}
        <nav
          style={{
            flex: 1,
            padding: '12px 0',
            overflowY: 'auto',
            scrollbarWidth: 'thin',
          }}
        >
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: collapsed ? '12px' : '12px 20px',
                margin: '4px 12px',
                borderRadius: 12,
                textDecoration: 'none',
                color: isActive ? 'white' : 'rgba(255,255,255,0.7)',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(236,72,153,0.2))'
                  : 'transparent',
                transition: 'all 0.2s',
                justifyContent: collapsed ? 'center' : 'flex-start',
                whiteSpace: 'nowrap',
              })}
              onMouseEnter={(e) => {
                if (!e.currentTarget.classList.contains('active')) {
                  e.currentTarget.style.background =
                    'rgba(255,255,255,0.05)'
                  e.currentTarget.style.color = 'white'
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.classList.contains('active')) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
                }
              }}
            >
              <link.icon size={20} style={{ flexShrink: 0 }} />
              {!collapsed && (
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>
                  {t(link.labelKey)}
                </span>
              )}
              {!collapsed && link.badge && (
                <span
                  style={{
                    background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                    color: 'white',
                    borderRadius: 20,
                    padding: '2px 8px',
                    fontSize: 10,
                    fontWeight: 700,
                    marginLeft: 'auto',
                  }}
                >
                  {link.badge}
                </span>
              )}
              {collapsed && link.badge && (
                <div
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#EC4899',
                  }}
                />
              )}
            </NavLink>
          ))}
        </nav>

        {/* User profile + logout */}
        <div
          style={{
            padding: collapsed ? '16px 12px' : '16px 20px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            marginTop: 'auto',
          }}
        >
          <div
            style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 14,
              padding: collapsed ? '10px' : '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: collapsed ? 0 : 12,
              justifyContent: collapsed ? 'center' : 'flex-start',
              marginBottom: 12,
            }}
          >
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt="Avatar"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  flexShrink: 0,
                  objectFit: 'cover',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}
              />
            ) : (
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  flexShrink: 0,
                  background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {initials}
              </div>
            )}
            {!collapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 13,
                    color: 'white',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user?.name || 'User'}
                </div>
                <div
                  style={{
                    display: 'inline-block',
                    background: 'rgba(139,92,246,0.2)',
                    color: '#A78BFA',
                    borderRadius: 999,
                    padding: '1px 8px',
                    fontSize: 10,
                    fontWeight: 700,
                    marginTop: 4,
                    textTransform: 'capitalize',
                  }}
                >
                  {t(user?.role || 'student')}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              justifyContent: collapsed ? 'center' : 'center',
              padding: collapsed ? '10px' : '10px 12px',
              borderRadius: 12,
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#FCA5A5',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = 'rgba(239,68,68,0.2)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = 'rgba(239,68,68,0.12)')
            }
          >
            <FiLogOut size={16} />
            {!collapsed && <span>{t('logout')}</span>}
          </button>
        </div>

        {/* Toggle button (slide arrow) - only visible on desktop */}
        <button
          onClick={toggleCollapse}
          className="sidebar-toggle"
          style={{
            position: 'absolute',
            right: 5,
            top: 65,
            width: 34,
            height: 24,
            borderRadius: '30%',
            background: 'white',
            border: '1px solid rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 1060,
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {collapsed ? (
            <FiChevronRight size={14} color="#4B5563" />
          ) : (
            <FiChevronLeft size={14} color="#4B5563" />
          )}
        </button>
      </aside>

      {/* Global style overrides for sidebar links & responsiveness */}
      <style>{`
        /* Hide toggle button on mobile */
        @media (max-width: 768px) {
          .sidebar-toggle {
            display: none !important;
          }
          .sidebar {
            transform: translateX(-100%);
            transition: transform 0.3s ease !important;
            width: 280px !important;
          }
          .sidebar.open {
            transform: translateX(0) !important;
          }
          .sidebar.collapsed {
            transform: translateX(-100%) !important;
          }
        }

        /* Desktop: sidebar always visible, collapsed state handled by width */
        @media (min-width: 769px) {
          .sidebar {
            transform: none !important;
          }
        }

        /* Custom scrollbar */
        .sidebar ::-webkit-scrollbar {
          width: 4px;
        }
        .sidebar ::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
          border-radius: 10px;
        }
        .sidebar ::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 10px;
        }
        .sidebar ::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.3);
        }
      `}</style>
    </>
  )
}