import { useEffect } from 'react'
import useStore from '../store/useStore'

export function useOffline() {
  const { isOnline, setOnline } = useStore()

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [setOnline])

  return isOnline
}
