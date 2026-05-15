import { useTranslation } from 'react-i18next'
import { useOffline } from '../hooks/useOffline'
import { FiWifiOff } from 'react-icons/fi'

export default function OfflineIndicator() {
  const isOnline = useOffline()
  const { t } = useTranslation()
  if (isOnline) return null
  return (
    <div className="offline-banner">
      <FiWifiOff size={16} />
      {t('offlineMsg')}
    </div>
  )
}
