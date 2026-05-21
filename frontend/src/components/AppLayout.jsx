import Sidebar from './Sidebar'
import Navbar from './Navbar'
import OfflineIndicator from './OfflineIndicator'
import useStore from '../store/useStore'
import { useEffect } from 'react'

export default function AppLayout({ children, title }) {
  const { sidebarOpen } = useStore()

  // Update online/offline status
  useEffect(() => {
    const { setOnline } = useStore.getState()
    const onOnline  = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online',  onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online',  onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#FAFAF5' }}>
      <Sidebar />

      {/* Main area shifts right of sidebar */}
      <div style={{
        flex: 1,
        marginLeft: 265,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        transition: 'margin-left 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}
        className="responsive-main">
        <OfflineIndicator />
        <Navbar title={title} />
        <main style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </main>
      </div>

      {/* Mobile: no margin */}
      <style>{`
        @media (max-width: 768px) {
          .responsive-main { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  )
}
