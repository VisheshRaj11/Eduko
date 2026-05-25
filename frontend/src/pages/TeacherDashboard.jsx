// TeacherDashboard.jsx – with radial dot background added
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import AppLayout from '../components/AppLayout'
import SkeletonLoader from '../components/SkeletonLoader'
import { teacherAPI } from '../api/client'
import ReactMarkdown from 'react-markdown'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts'
import {
  FiUsers, FiTrendingUp, FiBook, FiAlertCircle, FiUpload,
  FiSend, FiAward, FiCalendar, FiCheck, FiMessageSquare,
  FiBarChart2, FiTarget, FiCpu, FiMail, FiStar, FiFile, FiX,
} from 'react-icons/fi'

// Demo data (unchanged)
const DEMO = {
  stats: { total_students: 47, avg_score: 74, lessons_published: 18, at_risk: 6 },
  subject_performance: [
    { subject: 'Math',    score: 72 },
    { subject: 'Science', score: 80 },
    { subject: 'Hindi',   score: 65 },
    { subject: 'English', score: 78 },
    { subject: 'Social',  score: 85 },
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

// Stat Card Component
function StatCard({ icon: Icon, label, value, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      style={{
        background: 'white',
        borderRadius: 24,
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
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
          background: `${color}15`,
        }}
      >
        <Icon size={22} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#1F2937' }}>{value}</div>
        <div style={{ fontSize: 14, color: '#6B7280' }}>{label}</div>
      </div>
    </motion.div>
  )
}

// Tab Button
function TabButton({ id, label, icon: Icon, active, onClick }) {
  return (
    <button
      onClick={() => onClick(id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 20px',
        borderRadius: 14,
        fontSize: 14,
        fontWeight: 600,
        transition: 'all 0.2s',
        border: active ? '1px solid #e9d5ff' : 'none',
        background: active ? 'white' : 'transparent',
        color: active ? '#7C3AED' : '#6B7280',
        boxShadow: active ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.color = '#374151'
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.color = '#6B7280'
      }}
    >
      <Icon size={16} />
      {label}
    </button>
  )
}

export default function TeacherDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')
  const [smsMsg, setSmsMsg] = useState('')
  const [smsSending, setSmsSending] = useState(false)
  const [smsSent, setSmsSent] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    title: '',
    subject: 'Mathematics',
    content: '',
    grade_level: 8,
  })
  const [contentMode, setContentMode] = useState('text')   // 'text' | 'pdf'
  const [pdfFile, setPdfFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const pdfInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [uploadDone, setUploadDone] = useState(false)

  // AI Suggestion State
  const [aiPrompt, setAiPrompt] = useState('')
  const [selectedLessonId, setSelectedLessonId] = useState('')
  const [generatingAi, setGeneratingAi] = useState(false)

  useEffect(() => {
    teacherAPI.dashboard()
      .then((r) => setData(r.data))
      .catch(() => setData(DEMO))
      .finally(() => setLoading(false))
  }, [])

  const handleSendSMS = async () => {
    if (!smsMsg.trim()) return
    setSmsSending(true)
    try {
      const res = await teacherAPI.sendSMS({ message: smsMsg })
      alert(res.data.message)
      setSmsSent(true)
      setSmsMsg('')
      setTimeout(() => setSmsSent(false), 3000)
    } catch (err) {
      alert("Failed to send SMS: " + (err.response?.data?.message || err.message))
    } finally {
      setSmsSending(false)
    }
  }

  const handleGenerateSuggestions = async () => {
    setGeneratingAi(true)
    try {
      const payload = { prompt: aiPrompt }
      if (selectedLessonId) payload.lesson_id = selectedLessonId
      
      const res = await teacherAPI.generateSuggestions(payload)
      if (res.data && res.data.suggestions) {
        setData(prev => ({ ...prev, ai_suggestions: res.data.suggestions }))
        setAiPrompt('')
      }
    } catch (err) {
      alert("Failed to generate AI suggestions.")
    } finally {
      setGeneratingAi(false)
    }
  }

  const handlePdfDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type === 'application/pdf') setPdfFile(file)
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    setUploading(true)
    try {
      let payload
      if (contentMode === 'pdf' && pdfFile) {
        payload = new FormData()
        payload.append('title', uploadForm.title)
        payload.append('subject', uploadForm.subject)
        payload.append('grade_level', uploadForm.grade_level)
        payload.append('pdf', pdfFile)
      } else {
        payload = { ...uploadForm }
      }
      await teacherAPI.uploadLesson(payload)
      setUploadDone(true)
      setUploadForm({ title: '', subject: 'Mathematics', content: '', grade_level: 8 })
      setPdfFile(null)
      setTimeout(() => setUploadDone(false), 3000)
    } catch (error) {
      console.error("Upload failed", error)
      alert("Failed to upload lesson. " + (error.response?.data?.message || error.message || "Please try again."))
    } finally {
      setUploading(false)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiTrendingUp },
    // { id: 'analytics', label: 'Analytics', icon: FiBarChart2 },
    { id: 'upload', label: 'Upload Lesson', icon: FiUpload },
    { id: 'sms', label: 'Send SMS', icon: FiSend },
  ]

  return (
    <AppLayout title="Teacher Dashboard">
      <div
        style={{
          minHeight: '100vh',
          padding: '30px 20px 60px 20px',
        }}
      >
        <div className="main-content" style={{ animation: 'fadeIn 0.3s ease' }}>
          {/* Header Banner */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginBottom: 32,
              padding: '24px 28px',
              borderRadius: 32,
              background: 'white',
              color: 'black',
              border: '1px solid #f0f0f0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <FiAward size={28} color="#8B5CF6" />
              <h2 style={{ fontSize: 26, fontWeight: 800 }}>Teacher Dashboard</h2>
            </div>
            <p style={{ opacity: 0.85, fontSize: 14 }}>
              Manage your class, track progress, and empower learners with AI insights.
            </p>
          </motion.div>

          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 32,
              background: '#F3F4F6',
              padding: 6,
              borderRadius: 24,
              width: 'fit-content',
            }}
          >
            {tabs.map((t) => (
              <TabButton
                key={t.id}
                id={t.id}
                label={t.label}
                icon={t.icon}
                active={tab === t.id}
                onClick={setTab}
              />
            ))}
          </div>

          {loading ? (
            <SkeletonLoader rows={8} />
          ) : (
            <>
              {/* OVERVIEW TAB */}
              {tab === 'overview' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                  {/* Stats Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                      gap: 20,
                      marginBottom: 32,
                    }}
                  >
                    <StatCard icon={FiUsers} label="Total Students" value={data.stats.total_students} color="#8B5CF6" delay={0} />
                    <StatCard icon={FiTrendingUp} label="Average Score" value={`${data.stats.avg_score}%`} color="#10B981" delay={0.08} />
                    <StatCard icon={FiBook} label="Lessons Published" value={data.stats.lessons_published} color="#3B82F6" delay={0.16} />
                    <StatCard icon={FiAlertCircle} label="At‑Risk Students" value={data.stats.at_risk} color="#EF4444" delay={0.24} />
                  </div>

                  {/* Charts Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 32 }}>
                    {/* Subject Performance */}
                    <div style={{ background: 'white', borderRadius: 28, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                        <FiTarget size={20} color="#8B5CF6" />
                        <h3 style={{ fontWeight: 700, color: '#1F2937' }}>Subject Performance</h3>
                      </div>
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={data.subject_performance}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                          <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                          <Bar dataKey="score" radius={[8, 8, 0, 0]} fill="#8B5CF6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Weekly Sessions */}
                    <div style={{ background: 'white', borderRadius: 28, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                        <FiCalendar size={20} color="#3B82F6" />
                        <h3 style={{ fontWeight: 700, color: '#1F2937' }}>Weekly Student Sessions</h3>
                      </div>
                      <ResponsiveContainer width="100%" height={240}>
                        <LineChart data={data.weekly_activity}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                          <Line type="monotone" dataKey="sessions" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 5, fill: '#8B5CF6', strokeWidth: 2, stroke: '#fff' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* AI Suggestions */}
                  <div style={{ background: 'white', borderRadius: 28, padding: 24, marginBottom: 32, boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FiCpu size={20} color="#8B5CF6" />
                        <h3 style={{ fontWeight: 700, color: '#1F2937', margin: 0 }}>AI Teaching Suggestions</h3>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, maxWidth: 800 }}>
                        <select
                          value={selectedLessonId}
                          onChange={(e) => setSelectedLessonId(e.target.value)}
                          style={{
                            padding: '10px 16px',
                            borderRadius: 20,
                            border: '1.5px solid #E5E7EB',
                            fontSize: 13,
                            outline: 'none',
                            maxWidth: 200,
                            background: 'white'
                          }}
                        >
                          <option value="">Select Lesson (Optional)</option>
                          {data.lessons?.map(l => (
                            <option key={l._id} value={l._id}>{l.title}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Ask AI for specific advice (e.g. 'How to improve Hindi grammar?')"
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          style={{
                            flex: 1,
                            padding: '10px 16px',
                            borderRadius: 20,
                            border: '1.5px solid #E5E7EB',
                            fontSize: 13,
                            outline: 'none'
                          }}
                        />
                        <button
                          onClick={handleGenerateSuggestions}
                          disabled={generatingAi}
                          style={{
                            padding: '10px 20px',
                            borderRadius: 20,
                            background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                            color: 'white',
                            border: 'none',
                            fontWeight: 600,
                            fontSize: 13,
                            cursor: generatingAi ? 'wait' : 'pointer',
                            opacity: generatingAi ? 0.7 : 1,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {generatingAi ? 'Generating...' : 'Get Suggestions'}
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'block', padding: 16, background: '#F5F3FF', borderRadius: 20, border: '1px solid #EDE9FE' }}>
                      {typeof data.ai_suggestions === 'string' ? (
                        <div className="prose prose-sm max-w-none text-gray-700">
                          <ReactMarkdown>{data.ai_suggestions}</ReactMarkdown>
                        </div>
                      ) : (
                        <p style={{ fontSize: 14, color: '#6B7280' }}>No suggestions available.</p>
                      )}
                    </div>
                  </div>

                  {/* Struggling Students */}
                  <div style={{ background: 'white', borderRadius: 28, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                      <FiAlertCircle size={20} color="#EF4444" />
                      <h3 style={{ fontWeight: 700, color: '#1F2937' }}>Students Needing Attention</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {data.struggling_students?.map((s, i) => (
                        <div key={i} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: '#FEF2F2', borderRadius: 20, border: '1px solid #FEE2E2' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 40, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#B91C1C' }}>
                              {s.name.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: '#1F2937' }}>{s.name}</div>
                              <div style={{ fontSize: 12, color: '#6B7280' }}>Struggling in {s.subject}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                            <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: '#FEE2E2', color: '#B91C1C' }}>{s.score}%</span>
                            <FiMail size={16} color="#9CA3AF" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ANALYTICS TAB */}
              {tab === 'analytics' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
                    {/* Topic Difficulty Heatmap */}
                    {/* <div style={{ background: 'white', borderRadius: 28, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0' }}> */}
                      
                    
                    {/* Radar Chart */}
                    <div style={{ background: 'white', borderRadius: 28, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                        <FiTarget size={20} color="#8B5CF6" />
                        <h3 style={{ fontWeight: 700, color: '#1F2937' }}>Subject Performance Radar</h3>
                      </div>
                      <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={data.subject_performance}>
                          <PolarGrid stroke="#e2e8f0" />
                          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                          <Radar name="Score" dataKey="score" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.2} strokeWidth={2} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* UPLOAD LESSON TAB */}
              {tab === 'upload' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                  <div style={{ maxWidth: 720, margin: '0 auto', background: 'white', borderRadius: 32, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <FiUpload size={24} color="#8B5CF6" />
                      <h3 style={{ fontSize: 24, fontWeight: 800, color: '#1F2937' }}>Upload New Lesson</h3>
                    </div>
                    <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 24 }}>Content will be auto-translated to Hindi & Punjabi and added to the AI tutor knowledge base.</p>

                    {uploadDone ? (
                      <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <div style={{ width: 64, height: 64, background: '#D1FAE5', borderRadius: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                          <FiCheck size={28} color="#10B981" />
                        </div>
                        <h4 style={{ fontSize: 18, fontWeight: 700, color: '#1F2937', marginBottom: 8 }}>Lesson Uploaded!</h4>
                        <p style={{ fontSize: 14, color: '#6B7280' }}>Translation & AI ingestion running in background.</p>
                      </div>
                    ) : (
                      <form onSubmit={handleUpload}>
                        <div style={{ marginBottom: 20 }}>
                          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Lesson Title</label>
                          <input
                            type="text"
                            required
                            value={uploadForm.title}
                            onChange={(e) => setUploadForm((f) => ({ ...f, title: e.target.value }))}
                            placeholder="e.g. Introduction to Photosynthesis"
                            style={{ width: '100%', padding: '12px 16px', borderRadius: 16, border: '1.5px solid #E5E7EB', fontSize: 14, outline: 'none', transition: '0.2s' }}
                            onFocus={(e) => (e.target.style.borderColor = '#8B5CF6')}
                            onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                          <div>
                            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Subject</label>
                            <select
                              value={uploadForm.subject}
                              onChange={(e) => setUploadForm((f) => ({ ...f, subject: e.target.value }))}
                              style={{ width: '100%', padding: '12px 16px', borderRadius: 16, border: '1.5px solid #E5E7EB', fontSize: 14, outline: 'none', background: 'white' }}
                            >
                              {['Mathematics','Science','Hindi','English','Social Studies','Computer'].map(s => <option key={s}>{s}</option>)}
                            </select>
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Grade Level</label>
                            <select
                              value={uploadForm.grade_level}
                              onChange={(e) => setUploadForm((f) => ({ ...f, grade_level: Number(e.target.value) }))}
                              style={{ width: '100%', padding: '12px 16px', borderRadius: 16, border: '1.5px solid #E5E7EB', fontSize: 14, outline: 'none', background: 'white' }}
                            >
                              {[5,6,7,8,9,10,11,12].map(g => <option value={g}>Class {g}</option>)}
                            </select>
                          </div>
                        </div>
                        {/* Content mode toggle */}
                        <div style={{ marginBottom: 16 }}>
                          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Lesson Content</label>
                          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                            {[{ id: 'text', label: '✏️ Type Content' }, { id: 'pdf', label: '📄 Upload PDF' }].map(({ id, label }) => (
                              <button
                                key={id}
                                type="button"
                                onClick={() => { setContentMode(id); setPdfFile(null) }}
                                style={{
                                  flex: 1,
                                  padding: '10px 0',
                                  borderRadius: 14,
                                  fontSize: 13,
                                  fontWeight: 600,
                                  border: contentMode === id ? '2px solid #8B5CF6' : '1.5px solid #E5E7EB',
                                  background: contentMode === id ? '#F5F3FF' : 'white',
                                  color: contentMode === id ? '#7C3AED' : '#6B7280',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                }}
                              >
                                {label}
                              </button>
                            ))}
                          </div>

                          {/* Text content area */}
                          {contentMode === 'text' && (
                            <textarea
                              rows={6}
                              required
                              value={uploadForm.content}
                              onChange={(e) => setUploadForm((f) => ({ ...f, content: e.target.value }))}
                              placeholder="Write or paste your lesson content here. It will be automatically translated to Hindi and Punjabi..."
                              style={{ width: '100%', padding: '12px 16px', borderRadius: 16, border: '1.5px solid #E5E7EB', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                              onFocus={(e) => (e.target.style.borderColor = '#8B5CF6')}
                              onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                            />
                          )}

                          {/* PDF upload drop zone */}
                          {contentMode === 'pdf' && (
                            <div>
                              <input
                                ref={pdfInputRef}
                                type="file"
                                accept="application/pdf"
                                style={{ display: 'none' }}
                                onChange={(e) => setPdfFile(e.target.files[0] || null)}
                              />
                              {!pdfFile ? (
                                <div
                                  onClick={() => pdfInputRef.current?.click()}
                                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                                  onDragLeave={() => setDragOver(false)}
                                  onDrop={handlePdfDrop}
                                  style={{
                                    border: dragOver ? '2.5px dashed #8B5CF6' : '2px dashed #C4B5FD',
                                    borderRadius: 20,
                                    padding: '36px 24px',
                                    textAlign: 'center',
                                    background: dragOver ? '#F5F3FF' : '#FAFAFF',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                  }}
                                >
                                  <div style={{ width: 56, height: 56, background: '#EDE9FE', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                                    <FiFile size={26} color="#7C3AED" />
                                  </div>
                                  <p style={{ fontWeight: 700, fontSize: 15, color: '#4B5563', marginBottom: 6 }}>
                                    {dragOver ? 'Drop your PDF here' : 'Drag & drop a PDF or click to browse'}
                                  </p>
                                  <p style={{ fontSize: 12, color: '#9CA3AF' }}>Only .pdf files are accepted · Max 20 MB</p>
                                  <div
                                    style={{
                                      display: 'inline-block',
                                      marginTop: 16,
                                      padding: '8px 20px',
                                      borderRadius: 12,
                                      background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                                      color: 'white',
                                      fontSize: 13,
                                      fontWeight: 600,
                                    }}
                                  >
                                    Choose PDF
                                  </div>
                                </div>
                              ) : (
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 14,
                                    padding: '16px 20px',
                                    borderRadius: 20,
                                    background: '#F0FDF4',
                                    border: '1.5px solid #BBF7D0',
                                  }}
                                >
                                  <div style={{ width: 44, height: 44, background: '#DCFCE7', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <FiFile size={22} color="#16A34A" />
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: 14, color: '#15803D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pdfFile.name}</div>
                                    <div style={{ fontSize: 12, color: '#4ADE80', marginTop: 2 }}>{(pdfFile.size / 1024).toFixed(1)} KB · PDF</div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => { setPdfFile(null); pdfInputRef.current && (pdfInputRef.current.value = '') }}
                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
                                    title="Remove file"
                                  >
                                    <FiX size={18} color="#9CA3AF" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: '#F5F3FF', borderRadius: 20, border: '1px solid #EDE9FE', marginBottom: 24 }}>
                          <FiCpu size={24} color="#8B5CF6" />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: '#6D28D9' }}>AI Auto-Processing</div>
                            <div style={{ fontSize: 12, color: '#7C3AED' }}>Auto-translate to Hindi + Punjabi · Ingest into AI Tutor · Generate quiz questions</div>
                          </div>
                        </div>
                        <button
                          type="submit"
                          disabled={uploading}
                          style={{
                            width: '100%',
                            background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                            color: 'white',
                            padding: '14px 20px',
                            borderRadius: 20,
                            fontWeight: 700,
                            fontSize: 15,
                            border: 'none',
                            cursor: uploading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 10,
                            transition: '0.2s',
                            opacity: uploading ? 0.6 : 1,
                          }}
                          onMouseEnter={(e) => { if (!uploading) e.currentTarget.style.transform = 'translateY(-2px)' }}
                          onMouseLeave={(e) => { if (!uploading) e.currentTarget.style.transform = 'translateY(0)' }}
                        >
                          {uploading ? <><FiUpload style={{ animation: 'pulse 1s infinite' }} /> Processing...</> : <><FiUpload /> Upload & Process</>}
                        </button>
                      </form>
                    )}
                  </div>
                </motion.div>
              )}

              {/* SMS TAB */}
              {tab === 'sms' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                  <div style={{ maxWidth: 720, margin: '0 auto', background: 'white', borderRadius: 32, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <FiSend size={24} color="#8B5CF6" />
                      <h3 style={{ fontSize: 24, fontWeight: 800, color: '#1F2937' }}>Send SMS to Students</h3>
                    </div>
                    <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 24 }}>Send bulk SMS reminders to all your students via Twilio. Delivered even without internet on basic phones.</p>

                    {smsSent ? (
                      <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <div style={{ width: 64, height: 64, background: '#D1FAE5', borderRadius: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                          <FiCheck size={28} color="#10B981" />
                        </div>
                        <h4 style={{ fontSize: 18, fontWeight: 700, color: '#1F2937', marginBottom: 8 }}>SMS Sent!</h4>
                        <p style={{ fontSize: 14, color: '#6B7280' }}>Message delivered to all enrolled students.</p>
                      </div>
                    ) : (
                      <div>
                        <div style={{ marginBottom: 20 }}>
                          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Message</label>
                          <textarea
                            rows={4}
                            value={smsMsg}
                            onChange={(e) => setSmsMsg(e.target.value)}
                            placeholder="Dear student, your Mathematics quiz is scheduled for tomorrow at 10 AM. Please revise fractions and decimals."
                            style={{ width: '100%', padding: '12px 16px', borderRadius: 16, border: '1.5px solid #E5E7EB', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                            onFocus={(e) => (e.target.style.borderColor = '#8B5CF6')}
                            onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                          />
                          <div style={{ textAlign: 'right', fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>{smsMsg.length} / 160 chars</div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
                          {['Exam Tomorrow', 'New Lesson Added', 'Class at 10AM'].map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setSmsMsg(t)}
                              style={{ padding: '8px 12px', background: '#F5F3FF', border: '1px solid #EDE9FE', borderRadius: 16, fontSize: 12, fontWeight: 500, color: '#7C3AED', cursor: 'pointer' }}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={handleSendSMS}
                          disabled={smsSending || !smsMsg.trim()}
                          style={{
                            width: '100%',
                            background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                            color: 'white',
                            padding: '14px 20px',
                            borderRadius: 20,
                            fontWeight: 700,
                            fontSize: 15,
                            border: 'none',
                            cursor: smsSending || !smsMsg.trim() ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 10,
                            transition: '0.2s',
                            opacity: smsSending || !smsMsg.trim() ? 0.6 : 1,
                          }}
                          onMouseEnter={(e) => { if (!smsSending && smsMsg.trim()) e.currentTarget.style.transform = 'translateY(-2px)' }}
                          onMouseLeave={(e) => { if (!smsSending && smsMsg.trim()) e.currentTarget.style.transform = 'translateY(0)' }}
                        >
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
      </div>

      {/* Global animation keyframes */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-fade-in { animation: fadeIn 0.3s ease; }
      `}</style>
    </AppLayout>
  )
}