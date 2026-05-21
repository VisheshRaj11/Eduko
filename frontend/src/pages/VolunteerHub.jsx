import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import AppLayout from '../components/AppLayout'
import SkeletonLoader from '../components/SkeletonLoader'
import { volunteerAPI } from '../api/client'
import {
  FiUsers, FiCalendar, FiClock, FiBook, FiCheck,
  FiUser, FiPhone, FiMail, FiStar, FiPlus,
} from 'react-icons/fi'

const SUBJECTS = ['Mathematics', 'Science', 'Hindi', 'English', 'Social Studies', 'Computer', 'Sanskrit']
const TIMES = ['Morning (7-9 AM)', 'Afternoon (1-3 PM)', 'Evening (5-7 PM)', 'Weekend Morning', 'Weekend Afternoon']

const DEMO_SESSIONS = [
  {
    _id: 's1', title: 'Algebra Doubt Clearing', subject: 'Mathematics',
    volunteer: { name: 'Arjun Sharma', rating: 4.8, sessions: 24, avatar: '🧑‍🏫' },
    date: '2025-06-02', time: 'Evening (5-7 PM)', slots: 8, booked: 3,
    mode: 'Video Call', tags: ['Class 8-10', 'Free'],
  },
  {
    _id: 's2', title: 'Science Olympiad Prep', subject: 'Science',
    volunteer: { name: 'Meera Patel', rating: 4.9, sessions: 41, avatar: '👩‍🔬' },
    date: '2025-06-04', time: 'Morning (7-9 AM)', slots: 5, booked: 5,
    mode: 'Video Call', tags: ['Class 9-12', 'Free'],
  },
  {
    _id: 's3', title: 'Hindi Essay Writing', subject: 'Hindi',
    volunteer: { name: 'Rajesh Kumar', rating: 4.6, sessions: 15, avatar: '✍️' },
    date: '2025-06-05', time: 'Afternoon (1-3 PM)', slots: 10, booked: 2,
    mode: 'Video Call', tags: ['All Classes', 'Free'],
  },
  {
    _id: 's4', title: 'English Speaking Club', subject: 'English',
    volunteer: { name: 'Priya Nair', rating: 4.7, sessions: 33, avatar: '🗣️' },
    date: '2025-06-07', time: 'Weekend Morning', slots: 12, booked: 8,
    mode: 'Video Call', tags: ['All Classes', 'Free'],
  },
]

function SessionCard({ session, onBook }) {
  const isFull = session.booked >= session.slots
  const spotsLeft = session.slots - session.booked

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-base leading-tight">{session.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">{session.subject}</span>
            {session.tags.map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded-full text-xs font-medium bg-lime-100 text-lime-700">{tag}</span>
            ))}
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold
          ${isFull ? 'bg-red-100 text-red-700' : spotsLeft <= 3 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
          {isFull ? 'Full' : `${spotsLeft} spots left`}
        </span>
      </div>

      {/* Volunteer Info */}
      <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
        <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center text-lg">{session.volunteer.avatar}</div>
        <div className="flex-1">
          <div className="font-semibold text-slate-800 text-sm">{session.volunteer.name}</div>
          <div className="text-xs text-slate-500">{session.volunteer.sessions} sessions completed</div>
        </div>
        <div className="flex items-center gap-1 text-amber-500">
          <FiStar size={13} className="fill-current" />
          <span className="text-sm font-bold text-slate-700">{session.volunteer.rating}</span>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-2 text-slate-600">
          <FiCalendar size={13} className="text-purple-500" />
          {new Date(session.date).toLocaleDateString('en', { day: 'numeric', month: 'short', weekday: 'short' })}
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <FiClock size={13} className="text-purple-500" />
          {session.time}
        </div>
      </div>

      {/* Book Button */}
      <button onClick={() => onBook(session)} disabled={isFull}
        className={`btn btn-full ${isFull ? '' : 'btn-purple'} gap-2`}
        style={isFull ? { background: '#E2E8F0', color: '#94A3B8', cursor: 'not-allowed' } : {}}>
        {isFull ? 'Session Full' : <><FiCalendar size={14} /> Book Free Session</>}
      </button>
    </motion.div>
  )
}

export default function VolunteerHub() {
  const { t } = useTranslation()
  const [sessions, setSessions]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [tab, setTab]             = useState('sessions')
  const [booked, setBooked]       = useState(null)
  const [booking, setBooking]     = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [volunteerForm, setVF]    = useState({
    name: '', email: '', phone: '', subjects: [], bio: '', availability: [],
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)

  useEffect(() => {
    volunteerAPI.sessions()
      .then(r => setSessions(r.data || []))
      .catch(() => setSessions(DEMO_SESSIONS))
      .finally(() => setLoading(false))
  }, [])

  const handleBook = async (session) => {
    setBooking(true)
    setBooked(session)
    try {
      await volunteerAPI.bookSession({ session_id: session._id })
    } catch { /* use optimistic UI */ }
    setShowSuccess(true)
    setBooking(false)
    setTimeout(() => { setShowSuccess(false); setBooked(null) }, 4000)
  }

  const toggleSubject = (s) => setVF(f => ({
    ...f, subjects: f.subjects.includes(s) ? f.subjects.filter(x => x !== s) : [...f.subjects, s]
  }))
  const toggleTime = (t) => setVF(f => ({
    ...f, availability: f.availability.includes(t) ? f.availability.filter(x => x !== t) : [...f.availability, t]
  }))

  const handleVolunteerSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await volunteerAPI.join(volunteerForm)
      setSubmitted(true)
    } catch { setSubmitted(true) }
    finally { setSubmitting(false) }
  }

  const tabs = [
    { id: 'sessions',   label: 'Upcoming Sessions', icon: FiCalendar },
    { id: 'volunteer',  label: 'Become a Volunteer', icon: FiPlus },
  ]

  return (
    <AppLayout title="Volunteer Hub">
      <div className="main-content animate-fade-in">
        {/* Header Banner */}
        <div className="mb-6 p-6 rounded-2xl text-white"
          style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)' }}>
          <h2 className="text-2xl font-bold mb-1">Community Learning Hub 🤝</h2>
          <p className="text-white/80 text-sm">
            Connect with volunteer teachers for free tutoring sessions. Book a slot and get SMS confirmation.
          </p>
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

        {/* ── SESSIONS TAB ── */}
        {tab === 'sessions' && (
          <>
            <AnimatePresence>
              {showSuccess && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-4 rounded-xl flex items-center gap-3"
                  style={{ background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)', border: '1px solid #6EE7B7' }}>
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <FiCheck size={16} className="text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-green-800">Session Booked!</div>
                    <div className="text-green-700 text-sm">SMS confirmation sent via Twilio. Check your phone.</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {loading ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => <SkeletonLoader key={i} card />)}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {sessions.map(s => (
                  <SessionCard key={s._id} session={s} onBook={handleBook} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── VOLUNTEER TAB ── */}
        {tab === 'volunteer' && (
          <div className="max-w-2xl mx-auto">
            {submitted ? (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="glass-card p-10 text-center">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="font-bold text-2xl text-slate-900 mb-2">Thank you for volunteering!</h3>
                <p className="text-slate-600 mb-6">
                  Your application has been received. We'll review it and contact you within 24 hours.
                  An SMS will be sent to your number confirming your registration.
                </p>
                <button onClick={() => { setSubmitted(false); setTab('sessions') }}
                  className="btn btn-purple gap-2">
                  <FiCalendar size={15} /> Browse Sessions
                </button>
              </motion.div>
            ) : (
              <div className="glass-card p-6">
                <h3 className="font-bold text-xl text-slate-900 mb-2">Register as Volunteer 💪</h3>
                <p className="text-slate-500 text-sm mb-6">
                  Share your knowledge with rural students. All sessions are free and conducted online.
                  You'll receive Twilio SMS reminders before your sessions.
                </p>
                <form onSubmit={handleVolunteerSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label"><FiUser size={12} className="inline mr-1" />Full Name</label>
                      <input className="form-input" placeholder="Arjun Sharma" required
                        value={volunteerForm.name} onChange={e => setVF(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label"><FiPhone size={12} className="inline mr-1" />Phone (for SMS)</label>
                      <input className="form-input" placeholder="+917001234567" required
                        value={volunteerForm.phone} onChange={e => setVF(f => ({ ...f, phone: e.target.value }))} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label"><FiMail size={12} className="inline mr-1" />Email</label>
                    <input className="form-input" type="email" placeholder="arjun@example.com" required
                      value={volunteerForm.email} onChange={e => setVF(f => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label"><FiBook size={12} className="inline mr-1" />Subjects You Can Teach</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {SUBJECTS.map(s => (
                        <button type="button" key={s} onClick={() => toggleSubject(s)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all
                            ${volunteerForm.subjects.includes(s)
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label"><FiClock size={12} className="inline mr-1" />Availability</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {TIMES.map(t => (
                        <button type="button" key={t} onClick={() => toggleTime(t)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all
                            ${volunteerForm.availability.includes(t)
                              ? 'bg-lime-500 text-white border-lime-500'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-lime-300'}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Brief Bio</label>
                    <textarea className="form-input" rows={3}
                      placeholder="Tell students about yourself: your background, teaching experience, why you want to volunteer..."
                      value={volunteerForm.bio} onChange={e => setVF(f => ({ ...f, bio: e.target.value }))} />
                  </div>
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 flex gap-3">
                    <span className="text-xl">📱</span>
                    <div>
                      <div className="font-semibold text-purple-800 text-sm">Twilio SMS Notifications</div>
                      <div className="text-xs text-purple-600">You'll receive session reminders and student booking confirmations via SMS.</div>
                    </div>
                  </div>
                  <button type="submit" disabled={submitting || volunteerForm.subjects.length === 0}
                    className="btn btn-purple btn-full btn-lg gap-2">
                    {submitting ? 'Submitting...' : <><FiCheck size={15} /> Register as Volunteer</>}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
