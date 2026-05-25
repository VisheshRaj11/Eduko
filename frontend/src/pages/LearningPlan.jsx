import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import AppLayout from '../components/AppLayout'
import SkeletonLoader from '../components/SkeletonLoader'
import { studentAPI, aiAPI } from '../api/client'
import {
  FiRefreshCw,
  FiCalendar,
  FiClock,
  FiBook,
  FiCheckCircle,
  FiCircle,
  FiTarget,
  // FiSparkles,
} from 'react-icons/fi'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function LearningPlan() {
  const { t } = useTranslation()
  const [plan, setPlan] = useState(null)
  const [assignedTasks, setAssignedTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const fetchPlan = async () => {
    try {
      const { data } = await studentAPI.learningPlan()
      setPlan(data)
    } catch (err) {
      console.error(err)
      setPlan({
        generated_at: new Date().toISOString(),
        weekly_plan: DAYS.map((day, i) => ({
          day,
          tasks: i < 5 ? [
            {
              subject: 'Mathematics',
              topic:
                i === 0
                  ? 'Fractions'
                  : i === 1
                  ? 'Decimals'
                  : i === 2
                  ? 'Geometry'
                  : i === 3
                  ? 'Algebra'
                  : 'Statistics',
              duration: '30 mins',
              type: 'lesson',
            },
            {
              subject: 'Science',
              topic:
                i === 0
                  ? 'Photosynthesis'
                  : i === 1
                  ? 'Water Cycle'
                  : i === 2
                  ? 'Ecosystems'
                  : i === 3
                  ? 'Cells'
                  : 'Motion',
              duration: '25 mins',
              type: 'lesson',
            },
            {
              subject: 'Quiz',
              topic: 'Practice Questions',
              duration: '15 mins',
              type: 'quiz',
            },
          ] : [
            {
              subject: 'Revision',
              topic: 'Weekly Review',
              duration: '45 mins',
              type: 'revision',
            },
          ],
        })),
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchAssignedTasks = async () => {
    try {
      const { data } = await studentAPI.getAssignedTasks()
      setAssignedTasks(data || [])
    } catch (err) {
      console.error('Failed to fetch assigned tasks', err)
    }
  }

  const handleCompleteAssignedTask = async (taskId) => {
    try {
      await studentAPI.completeAssignedTask(taskId)

      setAssignedTasks((prev) =>
        prev.map((t) =>
          t._id === taskId
            ? {
                ...t,
                is_completed: true,
                completed_at: new Date().toISOString(),
              }
            : t
        )
      )
    } catch (err) {
      console.error('Failed to complete task', err)
      alert('Failed to update task status')
    }
  }

  const generateNewPlan = async () => {
    setGenerating(true)

    try {
      const { data } = await aiAPI.generatePlan({})
      setPlan(data)
    } catch {
      fetchPlan()
    } finally {
      setGenerating(false)
    }
  }

  useEffect(() => {
    fetchPlan()
    fetchAssignedTasks()
  }, [])

  const typeColors = {
    lesson: {
      bg: 'rgba(236,253,245,0.85)',
      color: '#047857',
      iconBg: '#A7F3D0',
      border: '#D1FAE5',
    },
    quiz: {
      bg: 'rgba(239,246,255,0.85)',
      color: '#1D4ED8',
      iconBg: '#BFDBFE',
      border: '#DBEAFE',
    },
    revision: {
      bg: 'rgba(255,251,235,0.9)',
      color: '#B45309',
      iconBg: '#FDE68A',
      border: '#FEF3C7',
    },
  }

  const getIcon = (type) => {
    if (type === 'quiz') return <FiCheckCircle size={14} />
    return <FiBook size={14} />
  }

  const glassCard = {
    background: 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    border: '1px solid rgba(255,255,255,0.7)',
    boxShadow: '0 10px 40px rgba(15,23,42,0.05)',
  }

  return (
    <AppLayout title={t('plan')}>
      <div
        style={{
          minHeight: '100vh',
          background: `
            radial-gradient(circle at top left, rgba(59,130,246,0.10), transparent 24%),
            radial-gradient(circle at top right, rgba(139,92,246,0.10), transparent 26%),
            radial-gradient(circle at bottom center, rgba(236,72,153,0.08), transparent 28%),
            linear-gradient(to bottom right, #f8fafc, #fcfcff)
          `,
          position: 'relative',
          overflow: 'hidden',
          paddingBottom: 60,
        }}
      >
        {/* Blur Orbs */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            left: -120,
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: 'rgba(59,130,246,0.16)',
            filter: 'blur(90px)',
            zIndex: 0,
          }}
        />

        <div
          style={{
            position: 'absolute',
            right: -120,
            top: 200,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'rgba(139,92,246,0.14)',
            filter: 'blur(90px)',
            zIndex: 0,
          }}
        />

        <div
          style={{
            maxWidth: 1320,
            margin: '0 auto',
            padding: '0 24px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={{
              ...glassCard,
              borderRadius: 36,
              padding: '28px 32px',
              marginBottom: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 20,
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 18,
                    background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 12px 24px rgba(59,130,246,0.25)',
                  }}
                >
                  <FiSparkles size={24} color="white" />
                </div>

                <div>
                  <h2
                    style={{
                      fontSize: 30,
                      fontWeight: 800,
                      color: '#0F172A',
                      lineHeight: 1.1,
                    }}
                  >
                    Your Weekly Study Plan
                  </h2>

                  <p
                    style={{
                      color: '#64748B',
                      fontSize: 14,
                      marginTop: 4,
                    }}
                  >
                    Personalized AI-powered schedule for smarter learning.
                  </p>
                </div>
              </div>

              {plan?.generated_at && (
                <p
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    color: '#64748B',
                    marginTop: 14,
                  }}
                >
                  <FiClock size={13} />
                  Generated {new Date(plan.generated_at).toLocaleDateString()}
                </p>
              )}
            </div>

            <button
              onClick={generateNewPlan}
              disabled={generating}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)',
                color: 'white',
                padding: '12px 26px',
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 14,
                border: 'none',
                cursor: generating ? 'not-allowed' : 'pointer',
                opacity: generating ? 0.7 : 1,
                boxShadow: '0 10px 24px rgba(59,130,246,0.25)',
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={(e) => {
                if (!generating) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }
              }}
              onMouseLeave={(e) => {
                if (!generating) {
                  e.currentTarget.style.transform = 'translateY(0px)'
                }
              }}
            >
              {generating ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    repeat: Infinity,
                    duration: 1,
                    ease: 'linear',
                  }}
                >
                  <FiRefreshCw size={16} />
                </motion.div>
              ) : (
                <FiRefreshCw size={16} />
              )}

              {generating ? 'Generating...' : 'Generate New Plan'}
            </button>
          </motion.div>

          {/* Assigned Tasks */}
          {assignedTasks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                ...glassCard,
                borderRadius: 34,
                padding: '28px 32px',
                marginBottom: 40,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: -50,
                  right: -50,
                  width: 180,
                  height: 180,
                  borderRadius: '50%',
                  background: 'rgba(251,191,36,0.15)',
                  filter: 'blur(20px)',
                }}
              />

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  marginBottom: 28,
                }}
              >
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 18,
                    background: 'linear-gradient(135deg,#FBBF24,#F59E0B)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 10px 24px rgba(251,191,36,0.28)',
                  }}
                >
                  <FiTarget size={24} color="white" />
                </div>

                <div>
                  <h3
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: '#0F172A',
                    }}
                  >
                    Tasks Assigned by Teacher
                  </h3>

                  <p
                    style={{
                      color: '#64748B',
                      fontSize: 13,
                      marginTop: 2,
                    }}
                  >
                    Complete your teacher-assigned activities on time.
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: 18,
                }}
              >
                {assignedTasks.map((task, i) => (
                  <motion.div
                    key={task._id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{
                      y: -4,
                    }}
                    style={{
                      background: task.is_completed
                        ? 'rgba(248,250,252,0.9)'
                        : 'rgba(255,251,235,0.9)',
                      border: `1px solid ${
                        task.is_completed ? '#E2E8F0' : '#FDE68A'
                      }`,
                      borderRadius: 26,
                      padding: '18px 20px',
                      display: 'flex',
                      gap: 14,
                      transition: 'all 0.25s ease',
                      boxShadow: '0 8px 24px rgba(15,23,42,0.03)',
                    }}
                  >
                    <button
                      onClick={() =>
                        !task.is_completed &&
                        handleCompleteAssignedTask(task._id)
                      }
                      disabled={task.is_completed}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: task.is_completed ? 'default' : 'pointer',
                        padding: 0,
                        marginTop: 2,
                        flexShrink: 0,
                      }}
                    >
                      {task.is_completed ? (
                        <FiCheckCircle size={24} color="#10B981" />
                      ) : (
                        <FiCircle size={24} color="#F59E0B" />
                      )}
                    </button>

                    <div>
                      <p
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: task.is_completed
                            ? '#64748B'
                            : '#0F172A',
                          textDecoration: task.is_completed
                            ? 'line-through'
                            : 'none',
                          marginBottom: 8,
                          lineHeight: 1.5,
                        }}
                      >
                        {task.task_description}
                      </p>

                      <p
                        style={{
                          fontSize: 12,
                          color: '#94A3B8',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        Assigned by Teacher •{' '}
                        {new Date(task.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Weekly Plan */}
          {loading ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
            >
              {[...Array(5)].map((_, i) => (
                <SkeletonLoader key={i} card />
              ))}
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
            >
              {plan?.weekly_plan?.map((dayPlan, i) => {
                const isToday =
                  new Date().toLocaleDateString('en', {
                    weekday: 'long',
                  }) === dayPlan.day

                return (
                  <motion.div
                    key={dayPlan.day}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{
                      y: -3,
                    }}
                    style={{
                      ...glassCard,
                      borderRadius: 32,
                      padding: '28px 30px',
                      border: isToday
                        ? '1.5px solid rgba(59,130,246,0.25)'
                        : '1px solid rgba(255,255,255,0.7)',
                      boxShadow: isToday
                        ? '0 14px 34px rgba(59,130,246,0.10)'
                        : '0 10px 34px rgba(15,23,42,0.04)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        marginBottom: 22,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 14,
                          background: isToday
                            ? 'linear-gradient(135deg,#3B82F6,#8B5CF6)'
                            : '#EFF6FF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <FiCalendar
                          size={18}
                          color={isToday ? 'white' : '#3B82F6'}
                        />
                      </div>

                      <h3
                        style={{
                          fontSize: 20,
                          fontWeight: 800,
                          color: '#0F172A',
                        }}
                      >
                        {dayPlan.day}
                      </h3>

                      {isToday && (
                        <span
                          style={{
                            background: '#DBEAFE',
                            color: '#2563EB',
                            padding: '5px 14px',
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          Today
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: 16,
                      }}
                    >
                      {dayPlan.tasks?.map((task, j) => {
                        const colors =
                          typeColors[task.type] || typeColors.lesson

                        return (
                          <motion.div
                            key={j}
                            whileHover={{
                              scale: 1.02,
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 14,
                              padding: '14px 18px',
                              borderRadius: 22,
                              background: colors.bg,
                              border: `1px solid ${colors.border}`,
                              backdropFilter: 'blur(12px)',
                            }}
                          >
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 14,
                                background: colors.iconBg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: colors.color,
                                flexShrink: 0,
                              }}
                            >
                              {getIcon(task.type)}
                            </div>

                            <div>
                              <div
                                style={{
                                  fontSize: 15,
                                  fontWeight: 700,
                                  color: '#0F172A',
                                  marginBottom: 5,
                                }}
                              >
                                {task.topic}
                              </div>

                              <div
                                style={{
                                  fontSize: 12,
                                  color: '#64748B',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  flexWrap: 'wrap',
                                }}
                              >
                                <span>{task.subject}</span>
                                <span>•</span>
                                <span>{task.duration}</span>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}