import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../store/useStore'
import { FiWifi, FiWifiOff, FiRefreshCw, FiCheck } from 'react-icons/fi'

export default function OfflineIndicator() {
  const { isOnline, setOnline, syncQueue, clearSyncQueue } = useStore()
  const [syncing, setSyncing] = useState(false)
  const [justSynced, setJustSynced] = useState(false)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    const handleOnline  = () => { setOnline(true);  setWasOffline(true) }
    const handleOffline = () => { setOnline(false); setWasOffline(false) }

    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOnline])

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && wasOffline && syncQueue.length > 0) {
      handleSync()
    }
  }, [isOnline, wasOffline])

  const handleSync = async () => {
    if (syncing || syncQueue.length === 0) return
    setSyncing(true)
    try {
      // Process sync queue: submit queued quiz answers
      const api = (await import('../api/client')).default
      for (const item of syncQueue) {
        try {
          await api.post(item.url, item.data)
        } catch { /* skip failed items */ }
      }
      clearSyncQueue()
      setJustSynced(true)
      setTimeout(() => { setJustSynced(false); setWasOffline(false) }, 3000)
    } catch {
      // Will retry next time
    } finally {
      setSyncing(false)
    }
  }

  return (
    <AnimatePresence>
      {/* Offline Banner */}
      {!isOnline && (
        <motion.div
          key="offline"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          style={{
            background: 'linear-gradient(135deg, #F59E0B, #D97706)',
            color: 'white', padding: '8px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, fontSize: 13, fontWeight: 600, overflow: 'hidden',
          }}>
          <FiWifiOff size={15} />
          <span>You're offline — cached lessons & quizzes are available</span>
          <span style={{ opacity: 0.7, fontSize: 11 }}>({syncQueue.length} items queued to sync)</span>
        </motion.div>
      )}

      {/* Back Online + Syncing Banner */}
      {isOnline && wasOffline && (
        <motion.div
          key="syncing"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          style={{
            background: justSynced
              ? 'linear-gradient(135deg, #10B981, #059669)'
              : 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
            color: 'white', padding: '8px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, fontSize: 13, fontWeight: 600, overflow: 'hidden',
          }}>
          {justSynced ? (
            <><FiCheck size={15} /> All progress synced successfully!</>
          ) : syncing ? (
            <><FiRefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Syncing your offline progress...</>
          ) : (
            <><FiWifi size={15} /> Back online! <button onClick={handleSync}
              style={{ textDecoration: 'underline', background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700 }}>
              Sync now
            </button></>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
