import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../store/useStore'
import LanguageSwitcher from './LanguageSwitcher'
import { authAPI } from '../api/client'
import { FiBell, FiMenu, FiUser, FiSettings, FiLogOut, FiChevronDown } from 'react-icons/fi'

export default function Navbar({ title }) {
  const { user, logout, toggleSidebar, notificationCount } = useStore()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropRef = useRef(null)
  const navigate = useNavigate()

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    try { await authAPI.logout() } catch {}
    logout()
    navigate('/login')
  }

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <header className="navbar">
      {/* Left: Hamburger + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={toggleSidebar}
          style={{ padding: 8, borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B', display: 'flex' }}>
          <FiMenu size={22} />
        </button>
        <div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 18, color: '#1A1A2E' }}>
            {title || 'Eduko'}
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>
            {user?.role === 'teacher' ? 'Teacher Dashboard' : user?.role === 'volunteer' ? 'Volunteer Portal' : 'Student Portal'}
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <LanguageSwitcher />

        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button style={{ padding: 8, borderRadius: 10, border: 'none', background: '#F3F0FF', cursor: 'pointer', color: '#7C3AED', display: 'flex' }}>
            <FiBell size={18} />
          </button>
          {notificationCount > 0 && (
            <div style={{
              position: 'absolute', top: -4, right: -4,
              width: 18, height: 18, borderRadius: '50%',
              background: '#EF4444', color: 'white',
              fontSize: 10, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {notificationCount > 9 ? '9+' : notificationCount}
            </div>
          )}
        </div>

        {/* User Avatar + Dropdown */}
        <div ref={dropRef} style={{ position: 'relative' }}>
          <button onClick={() => setDropdownOpen(p => !p)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 12px 6px 6px', borderRadius: 12,
              border: '1.5px solid rgba(139,92,246,0.2)',
              background: '#F8F5FF', cursor: 'pointer', transition: 'all 0.2s',
            }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: 13, fontWeight: 800,
            }}>
              {initials}
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E', fontFamily: 'Outfit, sans-serif' }}>
                {user?.name?.split(' ')[0] || 'User'}
              </div>
              <div style={{ fontSize: 10, color: '#8B5CF6', fontWeight: 600, textTransform: 'capitalize' }}>
                {user?.role || 'student'}
              </div>
            </div>
            <FiChevronDown size={14} color="#94A3B8" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute', top: '110%', right: 0,
                  background: 'white', borderRadius: 16,
                  boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                  border: '1.5px solid rgba(139,92,246,0.12)',
                  minWidth: 200, zIndex: 100, overflow: 'hidden',
                }}>
                {/* Header */}
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #F0EBF8', background: '#FAFAF5' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1A1A2E' }}>{user?.name}</div>
                  <div style={{ fontSize: 12, color: '#94A3B8' }}>{user?.email}</div>
                </div>
                {[
                  { icon: FiUser,     label: 'Profile',   to: '/settings' },
                  { icon: FiSettings, label: 'Settings',  to: '/settings' },
                ].map(item => (
                  <Link key={item.label} to={item.to} onClick={() => setDropdownOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px',
                      textDecoration: 'none', color: '#374151', fontSize: 14, fontWeight: 600,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F8F5FF'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <item.icon size={15} color="#8B5CF6" /> {item.label}
                  </Link>
                ))}
                <div style={{ borderTop: '1px solid #F0EBF8' }}>
                  <button onClick={handleLogout}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', width: '100%',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: 14, fontWeight: 700,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <FiLogOut size={15} /> Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
