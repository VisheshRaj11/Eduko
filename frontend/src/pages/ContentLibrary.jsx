import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import SkeletonLoader from '../components/SkeletonLoader'
import { lessonAPI } from '../api/client'
import { FiSearch, FiFilter, FiBook, FiArrowRight } from 'react-icons/fi'

const SUBJECTS = ['All', 'Mathematics', 'Science', 'Hindi', 'English', 'Social Studies', 'Computer']
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard']
const DIFFICULTY_COLORS = { Easy: 'badge-green', Medium: 'badge-yellow', Hard: 'badge-red' }

const DEMO_LESSONS = [
  { _id: '1', title: 'Introduction to Fractions', subject: 'Mathematics', difficulty: 'Easy',   language: 'hi', content_blocks: [{type:'text',content:'Fractions represent parts of a whole...'}] },
  { _id: '2', title: 'Photosynthesis in Plants',  subject: 'Science',      difficulty: 'Medium', language: 'hi', content_blocks: [] },
  { _id: '3', title: 'The Water Cycle',            subject: 'Science',      difficulty: 'Easy',   language: 'en', content_blocks: [] },
  { _id: '4', title: 'Linear Equations',           subject: 'Mathematics', difficulty: 'Hard',   language: 'hi', content_blocks: [] },
  { _id: '5', title: 'Our Environment',            subject: 'Social Studies', difficulty: 'Easy', language: 'pa', content_blocks: [] },
  { _id: '6', title: 'Computer Basics',            subject: 'Computer',    difficulty: 'Easy',   language: 'en', content_blocks: [] },
]

export default function ContentLibrary() {
  const { t } = useTranslation()
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [subject, setSubject] = useState('All')
  const [difficulty, setDifficulty] = useState('All')

  useEffect(() => {
    lessonAPI.list().then(r => setLessons(r.data?.data || r.data || [])).catch(() => setLessons(DEMO_LESSONS)).finally(() => setLoading(false))
  }, [])

  const filtered = lessons.filter(l =>
    (subject === 'All' || l.subject === subject) &&
    (difficulty === 'All' || l.difficulty === difficulty) &&
    (l.title.toLowerCase().includes(search.toLowerCase()) || l.subject.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <AppLayout title={t('library')}>
      <div className="main-content animate-fade-in">
        {/* Search & filters */}
        <div className="surface-card p-4 mb-6">
          <div className="relative mb-4">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" className="form-input pl-10" placeholder="Search lessons..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <FiFilter size={16} className="text-slate-500 mt-1" />
            {SUBJECTS.map(s => (
              <button key={s} onClick={() => setSubject(s)}
                className={`tag cursor-pointer transition-all ${subject === s ? 'bg-primary-600 text-white' : 'hover:bg-slate-200'}`}>
                {s}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {DIFFICULTIES.map(d => (
              <button key={d} onClick={() => setDifficulty(d)}
                className={`tag cursor-pointer transition-all ${difficulty === d ? 'bg-accent-600 text-white' : 'hover:bg-slate-200'}`}>
                {d}
              </button>
            ))}
          </div>
        </div>

        <p className="text-sm text-slate-500 mb-4">{filtered.length} lessons found</p>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <SkeletonLoader key={i} card />)}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((lesson, i) => (
              <motion.div key={lesson._id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="card p-5 group cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                    <FiBook className="text-primary-600" size={18} />
                  </div>
                  <span className={`badge ${DIFFICULTY_COLORS[lesson.difficulty] || 'badge-blue'} text-xs`}>
                    {lesson.difficulty}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 mb-1 text-sm leading-tight">{lesson.title}</h3>
                <p className="text-slate-500 text-xs mb-4">{lesson.subject} · {lesson.language?.toUpperCase()}</p>
                <Link to={`/library/${lesson._id}`} className="btn btn-secondary btn-sm btn-full gap-1 group-hover:bg-primary-600 group-hover:text-white group-hover:border-primary-600 transition-all">
                  Open Lesson <FiArrowRight size={13} />
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📚</div>
            <h3 className="text-lg font-bold text-slate-700">No lessons found</h3>
            <p className="text-slate-500 text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
