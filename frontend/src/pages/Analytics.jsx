// Analytics.jsx
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import AppLayout from '../components/AppLayout'
import SkeletonLoader from '../components/SkeletonLoader'
import { analyticsAPI } from '../api/client'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line
} from 'recharts'
import {
  FiUsers, FiTrendingUp, FiAlertCircle, FiBook, FiCpu, FiStar
} from 'react-icons/fi'

const DEMO = {
  stats: { total_students: 32, avg_score: 74, lessons_published: 15, at_risk: 4 },
  subject_performance: [
    { subject: 'Math', score: 72 }, { subject: 'Science', score: 80 },
    { subject: 'Hindi', score: 65 }, { subject: 'English', score: 78 },
    { subject: 'Social', score: 85 },
  ],
  weekly_activity: [
    { week: 'W1', sessions: 45 }, { week: 'W2', sessions: 62 },
    { week: 'W3', sessions: 55 }, { week: 'W4', sessions: 78 },
    { week: 'W5', sessions: 90 },
  ],
  weak_students: [
    { name: 'Rahul Kumar', subject: 'Math', score: 38 },
    { name: 'Priya Singh', subject: 'Hindi', score: 42 },
    { name: 'Amit Verma', subject: 'Science', score: 45 },
  ],
  ai_suggestions: [
    'Focus more on fraction concepts in Class 7 — 60% students below passing.',
    'Schedule extra Hindi reading sessions. Comprehension scores declining.',
    'Consider grouping high-performers for peer teaching opportunities.',
  ],
}

// Stat Card component (no Tailwind)
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: 24,
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
        border: '1px solid #f0f0f0',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: `${color}18`,
        }}
      >
        <Icon size={22} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#1F2937' }}>{value}</div>
        <div style={{ fontSize: 14, color: '#6B7280' }}>{label}</div>
      </div>
    </div>
  )
}

export default function Analytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyticsAPI.teacher()
      .then(r => setData(r.data))
      .catch(() => setData(DEMO))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AppLayout title="Analytics">
      <div className="main-content" style={{ animation: 'fadeIn 0.3s ease' }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1F2937', marginBottom: 24 }}>
          Teacher Analytics Dashboard
        </h2>

        {loading ? (
          <SkeletonLoader rows={8} />
        ) : (
          <>
            {/* Stats Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 20,
                marginBottom: 32,
              }}
            >
              <StatCard icon={FiUsers} label="Total Students" value={data.stats.total_students} color="#3B82F6" />
              <StatCard icon={FiTrendingUp} label="Avg. Score" value={`${data.stats.avg_score}%`} color="#10B981" />
              <StatCard icon={FiBook} label="Lessons Published" value={data.stats.lessons_published} color="#8B5CF6" />
              <StatCard icon={FiAlertCircle} label="At-Risk Students" value={data.stats.at_risk} color="#EF4444" />
            </div>

            {/* Charts Row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: 24,
                marginBottom: 24,
              }}
            >
              {/* Subject Performance Bar Chart */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: 'white',
                  borderRadius: 28,
                  padding: 24,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                  border: '1px solid #f0f0f0',
                }}
              >
                <h3 style={{ fontWeight: 700, color: '#1F2937', marginBottom: 20 }}>
                  Subject Performance
                </h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.subject_performance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => [`${v}%`, 'Avg Score']} />
                    <Bar dataKey="score" fill="#10B981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Weekly Activity Line Chart */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{
                  background: 'white',
                  borderRadius: 28,
                  padding: 24,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                  border: '1px solid #f0f0f0',
                }}
              >
                <h3 style={{ fontWeight: 700, color: '#1F2937', marginBottom: 20 }}>
                  Weekly Learning Sessions
                </h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={data.weekly_activity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="sessions"
                      stroke="#3B82F6"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#3B82F6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            </div>

            {/* Bottom Row: At-Risk Students + AI Suggestions */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 24,
              }}
            >
              {/* At-Risk Students */}
              <div
                style={{
                  background: 'white',
                  borderRadius: 28,
                  padding: 24,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                  border: '1px solid #f0f0f0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                  <FiAlertCircle size={20} color="#EF4444" />
                  <h3 style={{ fontWeight: 700, color: '#1F2937' }}>At-Risk Students</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {data.weak_students?.map((s, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 14,
                        background: '#FEF2F2',
                        borderRadius: 20,
                        border: '1px solid #FEE2E2',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: '#1F2937', fontSize: 14 }}>
                          {s.name}
                        </div>
                        <div style={{ fontSize: 12, color: '#6B7280' }}>{s.subject}</div>
                      </div>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 700,
                          background: '#FEE2E2',
                          color: '#B91C1C',
                        }}
                      >
                        {s.score}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Suggestions */}
              <div
                style={{
                  background: 'white',
                  borderRadius: 28,
                  padding: 24,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                  border: '1px solid #f0f0f0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                  <FiCpu size={20} color="#8B5CF6" />
                  <h3 style={{ fontWeight: 700, color: '#1F2937' }}>AI Teaching Suggestions</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {data.ai_suggestions?.map((s, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        padding: 14,
                        background: '#F5F3FF',
                        borderRadius: 20,
                        border: '1px solid #EDE9FE',
                      }}
                    >
                      <FiStar size={18} color="#8B5CF6" style={{ marginTop: 2, flexShrink: 0 }} />
                      <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.5 }}>{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Global keyframes animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </AppLayout>
  )
}