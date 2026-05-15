import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import useStore from '../store/useStore'
import {
  FiHome, FiMessageSquare, FiBook, FiBookOpen,
  FiBarChart2, FiUsers, FiSettings, FiLogOut,
  FiAward, FiCalendar, FiX
} from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'

const navLinks = [
  { to: '/dashboard',  icon: FiHome,          key: 'dashboard' },
  { to: '/tutor',      icon: FiMessageSquare, key: 'tutor' },
  { to: '/plan',       icon: FiCalendar,      key: 'plan' },
  { to: '/library',    icon: FiBookOpen,      key: 'library' },
  { to: '/quiz',       icon: FiAward,         key: 'quizzes' },
  { to: '/analytics',  icon: FiBarChart2,     key: 'analytics' },
  { to: '/volunteers', icon: FiUsers,         key: 'volunteers' },
  { to: '/settings',   icon: FiSettings,      key: 'settings' },
]

export default function Sidebar() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const { sidebarOpen, setSidebarOpen } = useStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const sidebarContent = (
    <div className="sidebar">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-lg font-bold">E</div>
          <span className="text-white font-bold text-lg tracking-tight">Eduko</span>
        </Link>
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden text-white/70 hover:text-white transition-colors"
        >
          <FiX size={20} />
        </button>
      </div>

      {/* User info */}
      <div className="px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <div className="text-white font-semibold text-sm leading-tight">{user?.name || 'User'}</div>
            <div className="text-white/60 text-xs capitalize">{user?.role || 'student'}</div>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {navLinks.map(({ to, icon: Icon, key }) => {
          const active = location.pathname === to
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={`sidebar-link ${active ? 'active' : ''}`}
            >
              <Icon className="icon" size={18} />
              {t(key)}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <button onClick={handleLogout} className="sidebar-link w-full text-red-300 hover:text-red-200 hover:bg-red-500/10">
          <FiLogOut className="icon" size={18} />
          {t('logout')}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:block flex-shrink-0" style={{ width: 260 }}>
        {sidebarContent}
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-30 md:hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-40 md:hidden"
              initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
