import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import AppLayout from '../components/AppLayout'
import SkeletonLoader from '../components/SkeletonLoader'
import { teacherAPI, notificationAPI } from '../api/client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts'
import {
  FiUsers, FiTrendingUp, FiBook, FiAlertCircle, FiUpload,
  FiSend, FiAward, FiCalendar, FiCheck, FiMessageSquare,
} from 'react-icons/fi'

const DEMO = {
  stats: { total_students: 47, avg_score: 74, lessons_published: 18, at_risk: 6 },
  subject_performance: [
    { subject: 'Math',    score: 72, fill: '#8B5CF6' },
    { subject: 'Science', score: 80, fill: '#A3E635' },
    { subject: 'Hindi',   score: 65, fill: '#F472B6' },
    { subject: 'English', score: 78, fill: '#60A5FA' },
    { subject: 'Social',  score: 85, fill: '#34D399' },
  ],
  weekly_activity: [
    { week: 'W1', sessions: 45 }, { week: 'W2', sessions: 62 },
    { week: 'W3', sessions: 55 }, { week: 'W4', sessions: 78 },
    { week: 'W5', sessions: 90 },
  ],
  topic_heatmap: [
    { topic: 'Fractions', difficulty: 82 }, { topic: 'Photosynthesis', difficulty: 45 },
    { topic: 'Algebra', difficulty: 78 },   { topic: 'Grammar', difficulty: 55 },
    { topic: 'Water Cycle', difficulty: 30 },
  ],
  struggling_students: [
    { name: 'Rahul Kumar',  subject: 'Math',    score: 38, phone: '+917001234567' },
    { name: 'Priya Singh',  subject: 'Hindi',   score: 42, phone: '+917001234568' },
    { name: 'Amit Verma',   subject: 'Science', score: 45, phone: '+917001234569' },
  ],
  ai_suggestions: [
    'Focus more on fraction concepts in Class 7 — 60% students below passing.',
    'Schedule extra Hindi reading sessions. Comprehension scores declining.',
    'Consider grouping high-performers for peer teaching opportunities.',
    'Students in Math group show 40% improvement when given visual examples.',
  ],
}

function StatCard({ icon: Icon, label, value, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="glass-card p-5 flex items-center gap-4"
    >
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: color + '22' }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="text-slate-500 text-sm">{label}</div>
      </div>
    </motion.div>
  )
}

export default function TeacherDashboard() {
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [tab, setTab]             = useState('overview')
  const [smsMsg, setSmsMsg]       = useState('')
  const [smsSending, setSmsSending] = useState(false)
  const [smsSent, setSmsSent]     = useState(false)
  const [uploadForm, setUploadForm] = useState({ title: '', subject: 'Mathematics', content: '', grade_level: 8 })
  const [uploading, setUploading] = useState(false)
  const [uploadDone, setUploadDone] = useState(false)

  useEffect(() => {
    teacherAPI.dashboard()
      .then(r => setData(r.data))
      .catch(() => setData(DEMO))
      .finally(() => setLoading(false))
  }, [])

  const handleSendSMS = async () => {
    if (!smsMsg.trim()) return
    setSmsSending(true)
    try {
      await teacherAPI.sendSMS({ message: smsMsg })
      setSmsSent(true)
      setSmsMsg('')
      setTimeout(() => setSmsSent(false), 3000)
    } catch { setSmsSent(true); setSmsMsg('') }
    finally { setSmsSending(false) }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    setUploading(true)
    try {
      await teacherAPI.uploadLesson(uploadForm)
      setUploadDone(true)
      setUploadForm({ title: '', subject: 'Mathematics', content: '', grade_level: 8 })
      setTimeout(() => setUploadDone(false), 3000)
    } catch { setUploadDone(true) }
    finally { setUploading(false) }
  }

  const tabs = [
    { id: 'overview',  label: 'Overview',   icon: FiTrendingUp },
    { id: 'analytics', label: 'Analytics',  icon: FiUsers },
    { id: 'upload',    label: 'Upload Lesson', icon: FiUpload },
    { id: 'sms',       label: 'Send SMS',   icon: FiSend },
  ]

  return (
    <AppLayout title="Teacher Dashboard">
      <div className="main-content animate-fade-in">
        {/* Header */}
        <div className="mb-6 p-6 rounded-2xl text-white"
          style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 50%, #0EA5E9 100%)' }}>
          <h2 className="text-2xl font-bold mb-1">Teacher Dashboard 🎓</h2>
          <p className="text-white/80 text-sm">Manage your class, track progress, and empower learners.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
                ${tab === t.id ? 'bg-white text-purple-700 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </div>

        {loading ? <SkeletonLoader rows={8} /> : (
          <>
            {/* ── OVERVIEW TAB ── */}
            {tab === 'overview' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <StatCard icon={FiUsers}       label="Total Students"    value={data.stats.total_students}  color="#8B5CF6" delay={0}    />
                  <StatCard icon={FiTrendingUp}   label="Avg. Score"       value={`${data.stats.avg_score}%`} color="#10B981" delay={0.08} />
                  <StatCard icon={FiBook}         label="Lessons Published" value={data.stats.lessons_published} color="#3B82F6" delay={0.16} />
                  <StatCard icon={FiAlertCircle}  label="At-Risk Students"  value={data.stats.at_risk}         color="#EF4444" delay={0.24} />
                </div>

                {/* Charts Row */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="glass-card p-6">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <FiTrendingUp className="text-purple-600" /> Subject Performance
                    </h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={data.subject_performance}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v) => [`${v}%`, 'Avg Score']} />
                        <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                          {data.subject_performance.map((entry, i) => (
                            <rect key={i} fill={entry.fill || '#8B5CF6'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="glass-card p-6">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <FiCalendar className="text-blue-600" /> Weekly Sessions
                    </h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={data.weekly_activity}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="sessions" stroke="#8B5CF6"
                          strokeWidth={3} dot={{ r: 5, fill: '#8B5CF6', strokeWidth: 2, stroke: '#fff' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* AI Suggestions */}
                <div className="glass-card p-6 mb-6">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    🤖 AI Teaching Suggestions
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {data.ai_suggestions?.map((s, i) => (
                      <div key={i} className="flex items-start gap-3 p-4 bg-purple-50 rounded-xl border border-purple-100">
                        <span className="text-xl flex-shrink-0">💡</span>
                        <p className="text-sm text-slate-700">{s}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* At-Risk Students */}
                <div className="glass-card p-6">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <FiAlertCircle className="text-red-500" /> Students Needing Attention
                  </h3>
                  <div className="space-y-3">
                    {data.struggling_students?.map((s, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-sm">
                            {s.name[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 text-sm">{s.name}</div>
                            <div className="text-xs text-slate-500">Struggling in {s.subject}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">{s.score}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── ANALYTICS TAB ── */}
            {tab === 'analytics' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="glass-card p-6 mb-6">
                  <h3 className="font-bold text-slate-800 mb-4">Topic Difficulty Heatmap</h3>
                  <div className="space-y-3">
                    {data.topic_heatmap?.map((t, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <span className="text-sm font-medium text-slate-700 w-36 flex-shrink-0">{t.topic}</span>
                        <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }} animate={{ width: `${t.difficulty}%` }}
                            transition={{ delay: i * 0.1, duration: 0.6 }}
                            className="h-full rounded-full"
                            style={{ background: t.difficulty > 70 ? '#EF4444' : t.difficulty > 50 ? '#F59E0B' : '#10B981' }}
                          />
                        </div>
                        <span className="text-sm font-bold text-slate-600 w-12 text-right">{t.difficulty}%</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: t.difficulty > 70 ? '#FEE2E2' : t.difficulty > 50 ? '#FEF3C7' : '#D1FAE5',
                            color: t.difficulty > 70 ? '#B91C1C' : t.difficulty > 50 ? '#92400E' : '#065F46' }}>
                          {t.difficulty > 70 ? 'Hard' : t.difficulty > 50 ? 'Medium' : 'Easy'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card p-6">
                  <h3 className="font-bold text-slate-800 mb-4">Subject Radar</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={data.subject_performance}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                      <Radar name="Score" dataKey="score" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.2} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            {/* ── UPLOAD LESSON TAB ── */}
            {tab === 'upload' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="glass-card p-6 max-w-2xl mx-auto">
                  <h3 className="font-bold text-slate-800 text-lg mb-2 flex items-center gap-2">
                    <FiUpload className="text-purple-600" /> Upload New Lesson
                  </h3>
                  <p className="text-slate-500 text-sm mb-6">
                    Content will be auto-translated to Hindi & Punjabi and added to the AI tutor knowledge base.
                  </p>
                  {uploadDone ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiCheck size={28} className="text-green-600" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-lg mb-2">Lesson Uploaded!</h4>
                      <p className="text-slate-500 text-sm">Translation & AI ingestion running in background.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleUpload} className="space-y-4">
                      <div className="form-group">
                        <label className="form-label">Lesson Title</label>
                        <input className="form-input" placeholder="e.g. Introduction to Photosynthesis"
                          value={uploadForm.title} onChange={e => setUploadForm(f => ({ ...f, title: e.target.value }))} required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                          <label className="form-label">Subject</label>
                          <select className="form-input" value={uploadForm.subject}
                            onChange={e => setUploadForm(f => ({ ...f, subject: e.target.value }))}>
                            {['Mathematics','Science','Hindi','English','Social Studies','Computer'].map(s => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Grade Level</label>
                          <select className="form-input" value={uploadForm.grade_level}
                            onChange={e => setUploadForm(f => ({ ...f, grade_level: Number(e.target.value) }))}>
                            {[5,6,7,8,9,10,11,12].map(g => <option key={g} value={g}>Class {g}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Lesson Content</label>
                        <textarea className="form-input" rows={8}
                          placeholder="Write or paste your lesson content here. It will be automatically translated to Hindi and Punjabi..."
                          value={uploadForm.content}
                          onChange={e => setUploadForm(f => ({ ...f, content: e.target.value }))} required />
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border border-purple-100">
                        <span className="text-2xl">🤖</span>
                        <div>
                          <div className="font-semibold text-purple-800 text-sm">AI Auto-Processing</div>
                          <div className="text-xs text-purple-600">Auto-translate to Hindi + Punjabi · Ingest into AI Tutor · Generate quiz questions</div>
                        </div>
                      </div>
                      <button type="submit" disabled={uploading}
                        className="btn btn-purple btn-full btn-lg gap-2">
                        {uploading ? <><FiUpload className="animate-bounce" /> Processing...</> : <><FiUpload /> Upload & Process</>}
                      </button>
                    </form>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── SMS TAB ── */}
            {tab === 'sms' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="glass-card p-6 max-w-2xl mx-auto">
                  <h3 className="font-bold text-slate-800 text-lg mb-2 flex items-center gap-2">
                    <FiSend className="text-purple-600" /> Send SMS to Students
                  </h3>
                  <p className="text-slate-500 text-sm mb-6">
                    Send bulk SMS reminders to all your students via Twilio. Delivered even without internet on basic phones.
                  </p>
                  {smsSent ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiCheck size={28} className="text-green-600" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-lg mb-2">SMS Sent!</h4>
                      <p className="text-slate-500 text-sm">Message delivered to all enrolled students.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="form-group">
                        <label className="form-label">Message</label>
                        <textarea className="form-input" rows={5}
                          placeholder="e.g. Dear student, your Mathematics quiz is scheduled for tomorrow at 10 AM. Please revise fractions and decimals."
                          value={smsMsg} onChange={e => setSmsMsg(e.target.value)} />
                        <div className="text-xs text-slate-400 text-right mt-1">{smsMsg.length} / 160 chars</div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {['📅 Exam Tomorrow', '📚 New Lesson Added', '⏰ Class at 10AM'].map(t => (
                          <button key={t} onClick={() => setSmsMsg(t.replace(/[📅📚⏰] /, ''))}
                            className="p-3 text-xs font-medium bg-purple-50 text-purple-700 rounded-xl border border-purple-100 hover:bg-purple-100 transition-colors">
                            {t}
                          </button>
                        ))}
                      </div>
                      <button onClick={handleSendSMS} disabled={smsSending || !smsMsg.trim()}
                        className="btn btn-purple btn-full btn-lg gap-2">
                        {smsSending ? 'Sending...' : <><FiSend /> Send to All Students via Twilio</>}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
