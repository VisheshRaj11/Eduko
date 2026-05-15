import Sidebar from './Sidebar'
import Navbar from './Navbar'
import OfflineIndicator from './OfflineIndicator'

export default function AppLayout({ children, title = 'Eduko' }) {
  return (
    <div className="flex" style={{ minHeight: '100vh' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col" style={{ minWidth: 0 }}>
        <OfflineIndicator />
        <Navbar title={title} />
        <main className="flex-1 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  )
}
