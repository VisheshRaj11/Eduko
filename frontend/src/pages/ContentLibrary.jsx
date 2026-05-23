// ContentLibrary.jsx
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import SkeletonLoader from '../components/SkeletonLoader'
import { lessonAPI, aiAPI, studentAPI } from '../api/client'
import { FiSearch, FiFilter, FiBook, FiArrowRight, FiTrash2, FiX } from 'react-icons/fi'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'

const SUBJECTS = ['All', 'Mathematics', 'Science', 'Hindi', 'English', 'Social Studies', 'Computer']
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard']

const DEMO_LESSONS = [
  { _id: '1', title: 'Introduction to Fractions', subject: 'Mathematics', difficulty: 'Easy',   language: 'hi', content_blocks: [] },
  { _id: '2', title: 'Photosynthesis in Plants',  subject: 'Science',      difficulty: 'Medium', language: 'hi', content_blocks: [] },
  { _id: '3', title: 'The Water Cycle',            subject: 'Science',      difficulty: 'Easy',   language: 'en', content_blocks: [] },
  { _id: '4', title: 'Linear Equations',           subject: 'Mathematics', difficulty: 'Hard',   language: 'hi', content_blocks: [] },
  { _id: '5', title: 'Our Environment',            subject: 'Social Studies', difficulty: 'Easy', language: 'pa', content_blocks: [] },
  { _id: '6', title: 'Computer Basics',            subject: 'Computer',    difficulty: 'Easy',   language: 'en', content_blocks: [] },
]

// Helper: get difficulty color (for badge)
const getDifficultyColor = (difficulty) => {
  switch (difficulty) {
    case 'Easy': return '#10B981'
    case 'Medium': return '#F59E0B'
    case 'Hard': return '#EF4444'
    default: return '#8B5CF6'
  }
}

export default function ContentLibrary() {
  const { t } = useTranslation()
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [subject, setSubject] = useState('All')
  const [difficulty, setDifficulty] = useState('All')

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalContent, setModalContent] = useState('')
  const [modalLoading, setModalLoading] = useState(false)

  const { user } = useAuth()

  useEffect(() => {
    lessonAPI.list()
      .then(r => setLessons(r.data?.data || r.data || []))
      .catch(() => setLessons(DEMO_LESSONS))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = (e, id) => {
    e.preventDefault()
    e.stopPropagation()
    
    toast((tToast) => (
      <div>
        <p style={{ margin: '0 0 12px 0', fontWeight: 500, color: '#374151' }}>{t('deleteBookTitle')}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button 
            onClick={() => { toast.dismiss(tToast.id); executeDelete(id); }} 
            style={{ background: '#EF4444', color: 'white', padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
          >
            {t('delete')}
          </button>
          <button 
            onClick={() => toast.dismiss(tToast.id)} 
            style={{ background: '#E5E7EB', color: '#374151', padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    ), { duration: Infinity })
  }

  const executeDelete = async (id) => {
    const loadingToast = toast.loading('Deleting book...')
    try {
      await lessonAPI.destroy(id)
      setLessons(prev => prev.filter(l => l._id !== id && l.id !== id))
      toast.success('Book deleted successfully!', { id: loadingToast })
    } catch (err) {
      toast.error('Failed to delete book.', { id: loadingToast })
    }
  }

  const handleOpenPdf = async (e, lesson) => {
    e.preventDefault()
    const lessonId = lesson._id || lesson.id
    if (!lessonId) return toast.error('Invalid lesson ID')
    
    setModalTitle(lesson.title)
    setModalOpen(true)
    setModalLoading(true)
    
    try {
      // Record the lesson view
      try {
        await studentAPI.viewLesson(lessonId)
      } catch (e) {
        // Ignore if fails (e.g. offline)
      }

      const data = await aiAPI.getVectorContent(lessonId)
      setModalContent(data.content)
    } catch (error) {
      setModalContent('Failed to load content from Vector Database.')
      toast.error('Failed to load content')
    } finally {
      setModalLoading(false)
    }
  }

  const filtered = lessons.filter(l =>
    (subject === 'All' || l.subject === subject) &&
    (difficulty === 'All' || l.difficulty === difficulty) &&
    (l.title.toLowerCase().includes(search.toLowerCase()) || l.subject.toLowerCase().includes(search.toLowerCase()))
  )

  // Filter button component (reusable)
  const FilterButton = ({ label, active, onClick }) => (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px',
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 500,
        background: active ? 'linear-gradient(135deg, #8B5CF6, #EC4899)' : '#F3F4F6',
        color: active ? 'white' : '#4B5563',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = '#E5E7EB'
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = '#F3F4F6'
      }}
    >
      {label}
    </button>
  )

  return (
    <AppLayout title={t('library')}>
      <div className="main-content" style={{ animation: 'fadeIn 0.3s ease' }}>
        {/* Search & filters card */}
        <div
          style={{
            background: 'white',
            borderRadius: 28,
            padding: '20px 24px',
            marginBottom: 24,
            boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
            border: '1px solid #f0f0f0',
          }}
        >
          {/* Search input */}
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <FiSearch
              size={18}
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9CA3AF',
              }}
            />
            <input
              type="text"
              placeholder={t('searchLessons')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 44px',
                borderRadius: 20,
                border: '1.5px solid #E5E7EB',
                fontSize: 14,
                outline: 'none',
                transition: '0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#8B5CF6')}
              onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
            />
          </div>

          {/* Subject filters */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            <FiFilter size={16} color="#6B7280" />
            {SUBJECTS.map(s => (
              <FilterButton
                key={s}
                label={s}
                active={subject === s}
                onClick={() => setSubject(s)}
              />
            ))}
          </div>

          {/* Difficulty filters */}
          {/* <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {DIFFICULTIES.map(d => (
              <FilterButton
                key={d}
                label={d}
                active={difficulty === d}
                onClick={() => setDifficulty(d)}
              />
            ))}
          </div> */}
        </div>

        {/* Results count */}
        <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 20 }}>
          {t('lessonsFound', { count: filtered.length })}
        </p>

        {/* Loading skeletons */}
        {loading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 24,
            }}
          >
            {[...Array(6)].map((_, i) => (
              <SkeletonLoader key={i} card />
            ))}
          </div>
        ) : (
          /* Lesson cards grid */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 24,
            }}
          >
            {filtered.map((lesson, i) => (
              <motion.div
                key={lesson._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  background: 'white',
                  borderRadius: 28,
                  padding: '20px',
                  border: '1px solid #f0f0f0',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                  transition: 'transform 0.2s',
                  cursor: 'pointer',
                }}
                whileHover={{ y: -4 }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      background: 'rgba(139,92,246,0.1)',
                      borderRadius: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FiBook size={20} color="#8B5CF6" />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 700,
                        background: `${getDifficultyColor(lesson.difficulty)}20`,
                        color: getDifficultyColor(lesson.difficulty),
                      }}
                    >
                      {lesson.difficulty}
                    </span>
                    {user?.role === 'teacher' && (
                      <button
                        onClick={(e) => handleDelete(e, lesson._id || lesson.id)}
                        style={{
                          background: 'rgba(239,68,68,0.1)',
                          color: '#EF4444',
                          border: 'none',
                          borderRadius: '50%',
                          width: 24,
                          height: 24,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                        title="Delete Book"
                      >
                        <FiTrash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: '#1F2937',
                    marginBottom: 6,
                    lineHeight: 1.4,
                  }}
                >
                  {lesson.title}
                </h3>
                <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 20 }}>
                  {lesson.subject} · {lesson.language?.toUpperCase()}
                </p>
                <button
                  onClick={(e) => handleOpenPdf(e, lesson)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '10px 0',
                    borderRadius: 20,
                    background: 'transparent',
                    border: '1.5px solid #E5E7EB',
                    color: '#4B5563',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F9FAFB'
                    e.currentTarget.style.borderColor = '#D1D5DB'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.borderColor = '#E5E7EB'
                  }}
                >
                  {t('viewLesson')} <FiArrowRight />
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Markdown Content Modal */}
        {modalOpen && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              style={{
                background: 'white', borderRadius: 24, width: '100%', maxWidth: 800,
                maxHeight: '90vh', display: 'flex', flexDirection: 'column',
                boxShadow: '0 24px 48px rgba(0,0,0,0.1)'
              }}
            >
              {/* Header */}
              <div style={{
                padding: '20px 24px', borderBottom: '1px solid #F3F4F6',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1F2937', margin: 0 }}>
                  {modalTitle}
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  style={{
                    background: '#F3F4F6', border: 'none', width: 36, height: 36, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    color: '#6B7280'
                  }}
                >
                  <FiX size={20} />
                </button>
              </div>

              {/* Content */}
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                {modalLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#6B7280' }}>
                    <div style={{
                      width: 40, height: 40, border: '3px solid #E5E7EB',
                      borderTopColor: '#8B5CF6', borderRadius: '50%',
                      animation: 'spin 1s linear infinite', margin: '0 auto 16px'
                    }} />
                    <p>{t('fetchingDb')}</p>
                  </div>
                ) : (
                  <div style={{ maxWidth: 'none', lineHeight: 1.7, color: '#374151', paddingRight: 10 }}>
                    <ReactMarkdown
                      components={{
                        h1: ({node, ...props}) => <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#111827', marginTop: '1.5em', marginBottom: '0.5em', borderBottom: '2px solid #F3F4F6', paddingBottom: '0.3em' }} {...props} />,
                        h2: ({node, ...props}) => <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1F2937', marginTop: '1.5em', marginBottom: '0.5em' }} {...props} />,
                        h3: ({node, ...props}) => <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#374151', marginTop: '1.2em', marginBottom: '0.5em' }} {...props} />,
                        strong: ({node, ...props}) => <strong style={{ fontWeight: 700, color: '#8B5CF6', background: 'rgba(139, 92, 246, 0.1)', padding: '0 4px', borderRadius: 4 }} {...props} />,
                        p: ({node, ...props}) => <p style={{ marginBottom: '1em', fontSize: '1rem', lineHeight: 1.75 }} {...props} />,
                        ul: ({node, ...props}) => <ul style={{ listStyleType: 'disc', paddingLeft: '1.5em', marginBottom: '1em' }} {...props} />,
                        ol: ({node, ...props}) => <ol style={{ listStyleType: 'decimal', paddingLeft: '1.5em', marginBottom: '1em' }} {...props} />,
                        li: ({node, ...props}) => <li style={{ marginBottom: '0.25em' }} {...props} />,
                        blockquote: ({node, ...props}) => <blockquote style={{ borderLeft: '4px solid #8B5CF6', paddingLeft: '1em', fontStyle: 'italic', color: '#6B7280', background: '#F9FAFB', padding: '10px 14px', borderRadius: '0 8px 8px 0', margin: '1em 0' }} {...props} />
                      }}
                    >
                      {modalContent}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <FiBook size={48} color="#D1D5DB" style={{ marginBottom: 16 }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
              {t('noLessonsFound')}
            </h3>
            <p style={{ fontSize: 14, color: '#6B7280' }}>
              {t('tryAdjusting')}
            </p>
          </div>
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