import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import ProgressBar from '../components/ProgressBar'
import SkeletonLoader from '../components/SkeletonLoader'
import { studentAPI } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import { FiBook, FiAward, FiZap, FiCalendar, FiTrendingUp, FiArrowRight } from 'react-icons/fi'

const staggerChild = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }

function StatCard({ icon: Icon, label, value, color, delay = 0 }) {
  return (
    <motion.div variants={staggerChild} transition={{ delay }}
      className="surface-card p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: color + '18' }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-800">{value}</div>
        <div className="text-slate-500 text-sm">{label}</div>
      </div>
    </motion.div>
  )
}

export default function StudentDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    studentAPI.dashboard()
      .then(r => setData(r.data))
      .catch(() => {
        // Use demo data if offline
        setData({
          streak: 7, points: 420, lessons_completed: 12, quizzes_taken: 8,
          recent_lessons: [
            { _id: '1', title: 'Photosynthesis', subject: 'Science', progress: 75 },
            { _id: '2', title: 'Fractions & Decimals', subject: 'Math', progress: 50 },
            { _id: '3', title: 'The Water Cycle', subject: 'Geography', progress: 100 },
          ],
          today_tasks: ['Complete Maths Quiz', 'Read Science Chapter 5', 'Practice Vocabulary'],
        })
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <AppLayout title={t('dashboard')}>
      <div className="main-content animate-fade-in">
        {/* Greeting */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mb-6 p-6 rounded-2xl text-white"
          style={{ background: 'linear-gradient(135deg, #16a34a 0%, #2563eb 100%)' }}>
          <h2 className="text-xl font-bold mb-1">{t('welcomeBack')}, {user?.name?.split(' ')[0] || 'Student'}! 👋</h2>
          <p className="text-white/80 text-sm">Keep up the great work. You're on a roll!</p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => <SkeletonLoader key={i} card />)}
          </div>
        ) : (
          <>
            {/* Stats */}
            <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
              initial="initial" animate="animate" variants={{ animate: { transition: { staggerChildren: 0.08 } } }}>
              <StatCard icon={FiZap}      label={t('streak')}           value={`${data.streak} 🔥`}  color="#f59e0b" />
              <StatCard icon={FiAward}    label={t('points')}           value={data.points}           color="#7c3aed" delay={0.08} />
              <StatCard icon={FiBook}     label={t('lessonsCompleted')} value={data.lessons_completed} color="#16a34a" delay={0.16} />
              <StatCard icon={FiTrendingUp} label={t('quizzesTaken')}  value={data.quizzes_taken}    color="#2563eb" delay={0.24} />
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Recent Lessons */}
              <div className="md:col-span-2 surface-card p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-slate-800 text-lg">Continue Learning</h3>
                  <Link to="/library" className="text-primary-600 text-sm font-medium hover:underline flex items-center gap-1">
                    All Lessons <FiArrowRight size={14} />
                  </Link>
                </div>
                <div className="space-y-4">
                  {data.recent_lessons?.map((lesson, i) => (
                    <motion.div key={lesson._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                      className="p-4 bg-slate-50 rounded-xl hover:bg-primary-50 transition-colors cursor-pointer group">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-semibold text-slate-800 text-sm">{lesson.title}</div>
                          <div className="text-xs text-slate-500">{lesson.subject}</div>
                        </div>
                        <Link to={`/library`} className="btn btn-primary btn-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          {lesson.progress === 100 ? 'Review' : t('continueLesson')}
                        </Link>
                      </div>
                      <ProgressBar value={lesson.progress} color={lesson.progress === 100 ? 'green' : 'blue'} />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Today's Tasks */}
              <div className="surface-card p-6">
                <div className="flex items-center gap-2 mb-5">
                  <FiCalendar className="text-primary-600" />
                  <h3 className="font-bold text-slate-800 text-lg">{t('todaysPlan')}</h3>
                </div>
                <div className="space-y-3">
                  {data.today_tasks?.map((task, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="w-5 h-5 rounded-full border-2 border-primary-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700 font-medium">{task}</span>
                    </div>
                  ))}
                </div>
                <Link to="/plan" className="btn btn-secondary btn-full mt-5 text-sm">
                  View Full Plan
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
