import { useTranslation } from 'react-i18next'
import AppLayout from '../components/AppLayout'
import ChatUI from '../components/ChatUI'

export default function AITutor() {
  const { t } = useTranslation()
  return (
    <AppLayout title={t('tutor')}>
      <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
        <ChatUI />
      </div>
    </AppLayout>
  )
}
