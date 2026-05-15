import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import AppLayout from '../components/AppLayout'
import SkeletonLoader from '../components/SkeletonLoader'
import { analyticsAPI } from '../api/client'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts'
import { FiUsers, FiTrendingUp, FiAlertCircle, FiBook } from 'react-icons/fi'

const DEMO = {
  stats: { total_students: 32, avg_score: 74, lessons_published: 15, at_risk: 4 },
  subject_performance: [
    { subject: 'Math', score: 72 }, { subject: 'Science', score: 80 },
    { subject: 'Hindi', score: 65 }, { subject: 'English', score: 78 }, { subject: 'Social', score: 85 },
  ],
  weekly_activity: [
    { week: 'W1', sessions: 45 }, { week: 'W2', sessions: 62 }, { week: 'W3', sessions: 55 },
    { week: 'W4', sessions: 78 }, { week: 'W5', sessions: 90 },
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

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="surface-card p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: color + '18' }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-800">{value}</div>
        <div className="text-slate-500 text-sm">{label}</div>
      </div>
    </div>
  )
}

export default function Analytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyticsAPI.teacher().then(r => setData(r.data)).catch(() => setData(DEMO)).finally(() => setLoading(false))
  }, [])

  return (
    <AppLayout title="Analytics">
      <div className="main-content animate-fade-in">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Teacher Analytics Dashboard</h2>

        {loading ? <SkeletonLoader rows={8} /> : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard icon={FiUsers}     label="Total Students"    value={data.stats.total_students} color="#2563eb" />
              <StatCard icon={FiTrendingUp} label="Avg. Score"        value={`${data.stats.avg_score}%`} color="#16a34a" />
              <StatCard icon={FiBook}      label="Lessons Published" value={data.stats.lessons_published} color="#7c3aed" />
              <StatCard icon={FiAlertCircle} label="At-Risk Students" value={data.stats.at_risk} color="#e11d48" />
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Subject Performance */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="surface-card p-6">
                <h3 className="font-bold text-slate-800 mb-4">Subject Performance</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.subject_performance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => [`${v}%`, 'Avg Score']} />
                    <Bar dataKey="score" fill="#16a34a" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Weekly Activity */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="surface-card p-6">
                <h3 className="font-bold text-slate-800 mb-4">Weekly Learning Sessions</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={data.weekly_activity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="sessions" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4, fill: '#2563eb' }} />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* At-Risk Students */}
              <div className="surface-card p-6">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <FiAlertCircle className="text-red-500" /> At-Risk Students
                </h3>
                <div className="space-y-3">
                  {data.weak_students?.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                      <div>
                        <div className="font-semibold text-slate-800 text-sm">{s.name}</div>
                        <div className="text-xs text-slate-500">{s.subject}</div>
                      </div>
                      <span className="badge badge-red">{s.score}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Suggestions */}
              <div className="surface-card p-6">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  🤖 AI Teaching Suggestions
                </h3>
                <div className="space-y-3">
                  {data.ai_suggestions?.map((s, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-primary-50 rounded-xl">
                      <span className="text-lg flex-shrink-0">💡</span>
                      <p className="text-sm text-slate-700">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
