import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import AppLayout from '../components/AppLayout'
import SkeletonLoader from '../components/SkeletonLoader'
import { studentAPI, aiAPI } from '../api/client'
import { FiRefreshCw, FiCalendar, FiClock, FiBook, FiCheckCircle } from 'react-icons/fi'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function LearningPlan() {
  const { t } = useTranslation()
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const fetchPlan = async () => {
    try {
      const { data } = await studentAPI.learningPlan()
      setPlan(data)
    } catch {
      // Demo plan
      setPlan({
        generated_at: new Date().toISOString(),
        weekly_plan: DAYS.map((day, i) => ({
          day,
          tasks: i < 5 ? [
            { subject: 'Mathematics', topic: i === 0 ? 'Fractions' : i === 1 ? 'Decimals' : i === 2 ? 'Geometry' : i === 3 ? 'Algebra' : 'Statistics', duration: '30 mins', type: 'lesson' },
            { subject: 'Science', topic: i === 0 ? 'Photosynthesis' : i === 1 ? 'Water Cycle' : i === 2 ? 'Ecosystems' : i === 3 ? 'Cells' : 'Motion', duration: '25 mins', type: 'lesson' },
            { subject: 'Quiz', topic: 'Practice Questions', duration: '15 mins', type: 'quiz' },
          ] : [{ subject: 'Revision', topic: 'Weekly Review', duration: '45 mins', type: 'revision' }],
        })),
      })
    } finally {
      setLoading(false)
    }
  }

  const generateNewPlan = async () => {
    setGenerating(true)
    try {
      const { data } = await aiAPI.generatePlan({})
      setPlan(data)
    } catch { fetchPlan() }
    finally { setGenerating(false) }
  }

  useEffect(() => { fetchPlan() }, [])

  const typeColors = { lesson: '#16a34a', quiz: '#2563eb', revision: '#f59e0b' }

  return (
    <AppLayout title={t('plan')}>
      <div className="main-content animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Your Weekly Study Plan</h2>
            {plan?.generated_at && (
              <p className="text-slate-500 text-sm mt-1 flex items-center gap-1">
                <FiClock size={13} /> Generated {new Date(plan.generated_at).toLocaleDateString()}
              </p>
            )}
          </div>
          <button onClick={generateNewPlan} disabled={generating}
            className="btn btn-primary gap-2">
            <FiRefreshCw size={16} className={generating ? 'animate-spin' : ''} />
            {generating ? 'Generating...' : 'Generate New Plan'}
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => <SkeletonLoader key={i} card />)}
          </div>
        ) : (
          <div className="space-y-4">
            {plan?.weekly_plan?.map((dayPlan, i) => {
              const isToday = new Date().toLocaleDateString('en', { weekday: 'long' }) === dayPlan.day
              return (
                <motion.div key={dayPlan.day} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className={`surface-card p-5 ${isToday ? 'ring-2 ring-primary-400' : ''}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <FiCalendar className="text-primary-600" size={18} />
                    <h3 className="font-bold text-slate-800">{dayPlan.day}</h3>
                    {isToday && <span className="badge badge-green text-xs">Today</span>}
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {dayPlan.tasks?.map((task, j) => (
                      <div key={j} className="p-3 rounded-xl flex items-start gap-3"
                        style={{ background: (typeColors[task.type] || '#16a34a') + '10' }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: (typeColors[task.type] || '#16a34a') + '20' }}>
                          {task.type === 'quiz' ? <FiCheckCircle size={15} style={{ color: typeColors[task.type] }} />
                            : <FiBook size={15} style={{ color: typeColors[task.type] || '#16a34a' }} />}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 text-sm">{task.topic}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{task.subject} · {task.duration}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
