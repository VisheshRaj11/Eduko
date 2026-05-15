import { useTranslation } from 'react-i18next'
import useStore from '../store/useStore'
import LanguageSwitcher from './LanguageSwitcher'
import { FiMenu, FiBell, FiWifi, FiWifiOff } from 'react-icons/fi'
import { useOffline } from '../hooks/useOffline'

export default function Navbar({ title }) {
  const { t } = useTranslation()
  const { toggleSidebar } = useStore()
  const isOnline = useOffline()

  return (
    <header className="navbar">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Toggle menu"
        >
          <FiMenu size={22} />
        </button>
        <h1 className="text-lg font-bold text-slate-800">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Online/Offline indicator */}
        <span title={isOnline ? 'Online' : 'Offline'} className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${isOnline ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
          {isOnline ? <FiWifi size={13} /> : <FiWifiOff size={13} />}
          <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
        </span>

        <LanguageSwitcher />

        <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors relative" aria-label="Notifications">
          <FiBell size={20} className="text-slate-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
      </div>
    </header>
  )
}
