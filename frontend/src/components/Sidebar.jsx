import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useStore from '../store/useStore'
import { authAPI } from '../api/client'
import {
  FiHome, FiMessageSquare, FiCalendar, FiBook,
  FiTarget, FiTrendingUp, FiUsers, FiSettings, FiLogOut,
} from 'react-icons/fi'

const studentLinks = [
  { to: '/dashboard',  icon: FiHome,          label: 'Dashboard'       },
  { to: '/tutor',      icon: FiMessageSquare, label: 'AI Tutor',  badge: 'AI' },
  { to: '/plan',       icon: FiCalendar,      label: 'Study Plan'      },
  { to: '/library',    icon: FiBook,          label: 'Content Library' },
  { to: '/quiz',       icon: FiTarget,        label: 'Quizzes'         },
  { to: '/volunteers', icon: FiUsers,         label: 'Volunteer Hub'   },
  { to: '/settings',   icon: FiSettings,      label: 'Settings'        },
]

const teacherLinks = [
  { to: '/teacher',    icon: FiHome,          label: 'Dashboard'       },
  { to: '/analytics',  icon: FiTrendingUp,    label: 'Analytics'       },
  { to: '/library',    icon: FiBook,          label: 'Content Library' },
  { to: '/tutor',      icon: FiMessageSquare, label: 'AI Tutor',  badge: 'AI' },
  { to: '/volunteers', icon: FiUsers,         label: 'Volunteer Hub'   },
  { to: '/settings',   icon: FiSettings,      label: 'Settings'        },
]

const volunteerLinks = [
  { to: '/volunteers', icon: FiUsers,         label: 'Sessions'        },
  { to: '/tutor',      icon: FiMessageSquare, label: 'AI Tutor',  badge: 'AI' },
  { to: '/settings',   icon: FiSettings,      label: 'Settings'        },
]

export default function Sidebar() {
  const { user, sidebarOpen, setSidebarOpen, logout } = useStore()
  const navigate = useNavigate()

  const links = user?.role === 'teacher' ? teacherLinks
    : user?.role === 'volunteer' ? volunteerLinks
    : studentLinks

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  const handleLogout = async () => {
    try { await authAPI.logout() } catch {}
    logout()
    navigate('/login')
  }

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 35, backdropFilter: 'blur(2px)' }}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #A3E635, #84CC16)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>🎓</div>
            <div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 20, color: 'white' }}>Eduko</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>AI Education Platform</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <link.icon size={18} className="icon" />
              <span style={{ flex: 1 }}>{link.label}</span>
              {link.badge && (
                <span style={{
                  background: 'linear-gradient(135deg, #A3E635, #84CC16)',
                  color: '#1A2E05', borderRadius: 6, padding: '1px 6px',
                  fontSize: 10, fontWeight: 900,
                }}>
                  {link.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Profile Card at bottom */}
        <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 'auto' }}>
          <div style={{
            background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, #A3E635, #84CC16)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#1A2E05', fontSize: 14, fontWeight: 900,
            }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || 'User'}
              </div>
              <div style={{
                display: 'inline-block', background: 'rgba(163,230,53,0.2)', color: '#A3E635',
                borderRadius: 999, padding: '1px 8px', fontSize: 10, fontWeight: 700, marginTop: 2,
                textTransform: 'capitalize',
              }}>
                {user?.role || 'student'}
              </div>
            </div>
          </div>
          <button onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
              padding: '8px 12px', borderRadius: 10,
              background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)',
              color: '#FCA5A5', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'Outfit, sans-serif',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}>
            <FiLogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
