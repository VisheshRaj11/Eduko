import { useState } from 'react'
import { motion } from 'framer-motion'
import AppLayout from '../components/AppLayout'
import { volunteerAPI } from '../api/client'
import { FiUsers, FiCalendar, FiClock, FiMapPin, FiCheck } from 'react-icons/fi'

const DEMO_SESSIONS = [
  { _id: 's1', volunteer_name: 'Dr. Ananya Sharma', subject: 'Mathematics', scheduled_time: '2024-12-15T10:00:00', status: 'scheduled', location: 'Online (Google Meet)' },
  { _id: 's2', volunteer_name: 'Prof. Rajesh Kumar', subject: 'Science',     scheduled_time: '2024-12-17T14:00:00', status: 'scheduled', location: 'Village Community Hall' },
  { _id: 's3', volunteer_name: 'Ms. Priya Menon',   subject: 'English',     scheduled_time: '2024-12-12T09:00:00', status: 'completed', location: 'Online (Google Meet)' },
]

export default function VolunteerHub() {
  const [form, setForm] = useState({ name: '', phone: '', specialization: '', availability: '' })
  const [sessions] = useState(DEMO_SESSIONS)
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)
  const [bookForm, setBookForm] = useState({ volunteer_id: '', preferred_time: '', subject: '' })

  const handleJoin = async (e) => {
    e.preventDefault()
    setJoining(true)
    try {
      await volunteerAPI.join(form)
      setJoined(true)
    } catch { setJoined(true) }
    finally { setJoining(false) }
  }

  return (
    <AppLayout title="Volunteer Hub">
      <div className="main-content animate-fade-in">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Join as Volunteer */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="surface-card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                <FiUsers className="text-primary-600" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Become a Volunteer</h3>
                <p className="text-slate-500 text-xs">Teach and mentor rural students</p>
              </div>
            </div>

            {joined ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FiCheck className="text-green-600" size={28} />
                </div>
                <h4 className="font-bold text-slate-800 mb-1">Thank you for joining!</h4>
                <p className="text-slate-500 text-sm">We'll contact you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleJoin} className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input type="tel" className="form-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Specialization / Subject</label>
                  <input type="text" className="form-input" placeholder="e.g., Mathematics, Science" value={form.specialization} onChange={e => setForm({...form, specialization: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Availability</label>
                  <select className="form-input" value={form.availability} onChange={e => setForm({...form, availability: e.target.value})}>
                    <option value="">Select...</option>
                    <option>Weekends only</option>
                    <option>Weekday evenings</option>
                    <option>Anytime</option>
                  </select>
                </div>
                <button type="submit" disabled={joining} className="btn btn-primary btn-full gap-2">
                  {joining ? '⏳ Submitting...' : '🙋 Join as Volunteer'}
                </button>
              </form>
            )}
          </motion.div>

          {/* Upcoming Sessions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="surface-card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-accent-100 rounded-xl flex items-center justify-center">
                <FiCalendar className="text-accent-600" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Upcoming Sessions</h3>
                <p className="text-slate-500 text-xs">Book a tutoring session</p>
              </div>
            </div>
            <div className="space-y-3">
              {sessions.map((s, i) => (
                <motion.div key={s._id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                  className={`p-4 rounded-xl border-2 ${s.status === 'completed' ? 'border-slate-200 bg-slate-50 opacity-60' : 'border-primary-200 bg-primary-50'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-semibold text-slate-800 text-sm">{s.volunteer_name}</div>
                    <span className={`badge ${s.status === 'completed' ? 'badge-blue' : 'badge-green'} text-xs`}>
                      {s.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                    <FiClock size={12} /> {new Date(s.scheduled_time).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
                    <FiMapPin size={12} /> {s.location}
                  </div>
                  <div className="text-xs font-semibold text-primary-700 bg-primary-100 rounded-lg px-2 py-1 inline-block">
                    📚 {s.subject}
                  </div>
                  {s.status !== 'completed' && (
                    <button className="btn btn-secondary btn-sm ml-3">Join Session</button>
                  )}
                </motion.div>
              ))}
            </div>
            <button className="btn btn-accent btn-full mt-4 gap-2">
              <FiCalendar size={16} /> Book New Session
            </button>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  )
}
