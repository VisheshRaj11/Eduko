import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import ProgressBar from '../components/ProgressBar'
import SkeletonLoader from '../components/SkeletonLoader'
import { studentAPI } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import {
  FiBook,
  FiAward,
  FiZap,
  FiCalendar,
  FiTrendingUp,
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiSmile,
  FiActivity,
  FiLayers,
  FiTarget,
} from 'react-icons/fi'

const staggerChild = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }

function StatCard({ icon: Icon, label, value, color, delay = 0 }) {
  return (
    <motion.div
      variants={staggerChild}
      transition={{ delay }}
      style={{
        background: 'white',
        borderRadius: 24,
        padding: '20px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        border: '1px solid #EEF2F6',
        transition: 'all 0.2s',
      }}
      whileHover={{ y: -2, boxShadow: '0 8px 20px rgba(0,0,0,0.06)' }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 16,
          background: `${color}10`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={24} color={color} />
      </div>
      <div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: '#1E293B',
            lineHeight: 1.2,
          }}
        >
          {value}
        </div>
        <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
          {label}
        </div>
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
    studentAPI
      .dashboard()
      .then((r) => setData(r.data))
      .catch(() => {
        // Demo data
        setData({
          avg_score: 85,
          lessons_completed: 12,
          quizzes_taken: 8,
          points: 1250,
          recent_lessons: [
            { _id: '1', title: 'Photosynthesis', subject: 'Science', progress: 75 },
            { _id: '2', title: 'Fractions & Decimals', subject: 'Math', progress: 50 },
            { _id: '3', title: 'The Water Cycle', subject: 'Geography', progress: 100 },
          ],
          today_tasks: [
            'Complete Maths Quiz',
            'Read Science Chapter 5',
            'Practice Vocabulary',
          ],
          ai_performance: [
            { subject: 'Science', percentage: 88, level: 'Good' },
            { subject: 'Math', percentage: 65, level: 'Avg' },
            { subject: 'English', percentage: 42, level: 'Weak' },
          ]
        })
      })
      .finally(() => setLoading(false))
  }, [])

  const getLevelTranslation = (val) => {
    if (val < 50) return t('weak')
    if (val < 75) return t('average')
    if (val < 90) return t('good')
    return t('excellent')
  }

  const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000'
  const displayAvatar = user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${backendUrl}${user.avatar}`) : null

  return (
    <AppLayout title={t('dashboard')}>
      <div
        style={{
          minHeight: '100vh',
          background:
            'radial-gradient(circle at top left, rgba(99,102,241,0.12), transparent 35%), radial-gradient(circle at top right, rgba(139,92,246,0.12), transparent 35%), radial-gradient(circle at bottom, rgba(59,130,246,0.10), transparent 40%)',
          position: 'relative',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '0 24px 60px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* Greeting card – solid color, no gradient */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              background: '#F1F5F9',
              borderRadius: 28,
              padding: '24px 28px',
              marginBottom: 32,
              border: '1px solid #E2E8F0',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 8,
              }}
            >
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt="Avatar"
                  style={{ width: 48, height: 48, borderRadius: 16, objectFit: 'cover' }}
                />
              ) : (
                <FiSmile size={32} color="#3B82F6" />
              )}
              <div>
                <h2
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#0F172A',
                    margin: 0,
                  }}
                >
                  {t('welcomeBack')}, {user?.name?.split(' ')[0] || 'Student'}!
                </h2>
                {user?.grade_level && (
                  <div style={{ fontSize: 13, color: '#475569', fontWeight: 600, marginTop: 2 }}>
                    Class {user.grade_level}
                  </div>
                )}
              </div>
            </div>
            <p style={{ color: '#475569', fontSize: 14, margin: 0 }}>
              {t('keepUpWork')}
            </p>
            <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link to="/quiz" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'linear-gradient(to right, #8B5CF6, #6366F1)', color: 'white', borderRadius: '12px', textDecoration: 'none', fontWeight: 600, fontSize: '14px', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)' }}>
                <FiZap size={16} /> {t('generateQuiz')}
              </Link>
              <Link to="/flashcards" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'white', color: '#6366F1', border: '1px solid #C7D2FE', borderRadius: '12px', textDecoration: 'none', fontWeight: 600, fontSize: '14px', transition: 'all 0.2s' }}>
                <FiLayers size={16} /> {t('createFlashcards')}
              </Link>
            </div>
          </motion.div>

          {loading ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 20,
                marginBottom: 40,
              }}
            >
              {[...Array(4)].map((_, i) => (
                <SkeletonLoader key={i} card />
              ))}
            </div>
          ) : !data ? (
            <p style={{ color: '#6B7280', fontSize: 14 }}>{t('noData')}</p>
          ) : (
            <>
              {/* Stats row */}
              <motion.div
                initial="initial"
                animate="animate"
                variants={{
                  animate: { transition: { staggerChildren: 0.08 } },
                }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 20,
                  marginBottom: 40,
                }}
              >
                <StatCard
                  icon={FiBook}
                  label={t('lessonsCompleted')}
                  value={data.lessons_completed}
                  color="#10B981"
                  delay={0.08}
                />
                <StatCard
                  icon={FiTarget}
                  label={t('quizzesTaken')}
                  value={data.quizzes_taken}
                  color="#3B82F6"
                  delay={0.16}
                />
                <StatCard
                  icon={FiTrendingUp}
                  label={t('avgScore')}
                  value={`${data.avg_score}%`}
                  color="#8B5CF6"
                  delay={0.24}
                />
              </motion.div>

              {/* Two column layout */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: 28,
                }}
              >
                {/* Recent Lessons */}
                <div
                  style={{
                    background: 'white',
                    borderRadius: 28,
                    padding: '24px 24px 28px',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 24,
                    }}
                  >
                    <h3
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: '#0F172A',
                      }}
                    >
                      {t('continueLearning')}
                    </h3>
                    <Link
                      to="/library"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#3B82F6',
                        textDecoration: 'none',
                      }}
                    >
                      {t('allLessons')} <FiArrowRight size={14} />
                    </Link>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {data.recent_lessons?.map((lesson, i) => (
                      <motion.div
                        key={lesson._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        style={{
                          padding: '14px 16px',
                          background: '#F8FAFC',
                          borderRadius: 20,
                          transition: 'all 0.2s',
                          cursor: 'pointer',
                        }}
                        whileHover={{
                          background: '#F1F5F9',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 10,
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: 15,
                                color: '#0F172A',
                                marginBottom: 4,
                              }}
                            >
                              {lesson.title}
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: '#64748B',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                              }}
                            >
                              <FiBook size={12} /> {lesson.subject}
                            </div>
                          </div>
                          <Link
                            to="/library"
                            style={{
                              background: lesson.progress === 100 ? '#E2E8F0' : '#3B82F6',
                              color: lesson.progress === 100 ? '#475569' : 'white',
                              padding: '5px 14px',
                              borderRadius: 30,
                              fontSize: 12,
                              fontWeight: 500,
                              textDecoration: 'none',
                              transition: 'opacity 0.2s',
                              opacity: 0,
                            }}
                            className="lesson-action"
                          >
                            {lesson.progress === 100 ? t('review') : t('resume')}
                          </Link>
                        </div>

                        <ProgressBar
                          value={lesson.progress}
                          color={lesson.progress === 100 ? 'green' : 'blue'}
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Today's Tasks */}
                <div
                  style={{
                    background: 'white',
                    borderRadius: 28,
                    padding: '24px 24px 28px',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      marginBottom: 24,
                    }}
                  >
                    <FiCalendar size={20} color="#3B82F6" />
                    <h3
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: '#0F172A',
                      }}
                    >
                      {t('todaysPlan')}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {data.today_tasks?.map((task, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 12,
                          padding: '12px 14px',
                          background: '#F8FAFC',
                          borderRadius: 18,
                        }}
                      >
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 20,
                            border: '2px solid #3B82F6',
                            background: 'white',
                            flexShrink: 0,
                            marginTop: 2,
                          }}
                        />
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: '#334155',
                            lineHeight: 1.4,
                          }}
                        >
                          {task}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Link
                    to="/plan"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      width: '100%',
                      marginTop: 28,
                      padding: '11px 20px',
                      background: '#3B82F6',
                      borderRadius: 40,
                      color: 'white',
                      fontWeight: 500,
                      fontSize: 14,
                      textDecoration: 'none',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => (e.target.style.background = '#2563EB')}
                    onMouseLeave={(e) => (e.target.style.background = '#3B82F6')}
                  >
                    {t('viewFullPlan')} <FiArrowRight />
                  </Link>
                </div>
              </div>

              {/* AI Performance Section */}
              {data.ai_performance && data.ai_performance.length > 0 && (
                <div style={{ marginTop: 28, background: 'white', borderRadius: 28, padding: '24px 24px 28px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                    <FiActivity size={20} color="#8B5CF6" />
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>{t('aiPerformance')}</h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
                    {data.ai_performance.map((perf, i) => {
                      let badgeColor = 'bg-amber-100 text-amber-700';
                      if (perf.level === 'Good') badgeColor = 'bg-green-100 text-green-700';
                      else if (perf.level === 'Weak') badgeColor = 'bg-red-100 text-red-700';

                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #EEF2F6' }}>
                          <div>
                            <div style={{ fontWeight: 700, color: '#1E293B', fontSize: 15, marginBottom: 4 }}>{perf.subject}</div>
                            <div style={{ fontSize: 13, color: '#64748B' }}>Score: {perf.percentage}%</div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-bold ${badgeColor}`}>
                            {perf.level}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <style>
          {`
            .lesson-action {
              opacity: 0;
              transition: opacity 0.2s ease;
            }
            .lesson-action:hover {
              opacity: 1 !important;
            }
          `}
        </style>
      </div>
    </AppLayout>
  )
}