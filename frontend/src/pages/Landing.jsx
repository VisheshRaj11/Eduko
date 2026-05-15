import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiBook, FiMessageSquare, FiUsers, FiWifi, FiArrowRight, FiStar, FiGlobe } from 'react-icons/fi'
import LanguageSwitcher from '../components/LanguageSwitcher'

const features = [
  { icon: FiMessageSquare, title: 'AI Tutor',          desc: 'Ask questions in Hindi, Punjabi or English. Get instant, clear answers.', color: '#16a34a' },
  { icon: FiBook,          title: 'Adaptive Learning',  desc: 'AI creates personalised weekly study plans based on your progress.', color: '#2563eb' },
  { icon: FiWifi,          title: 'Works Offline',      desc: 'All lessons and quizzes are cached locally. Learn without internet.', color: '#f59e0b' },
  { icon: FiGlobe,         title: 'Multilingual',       desc: 'Content auto-translated to your language by AI.', color: '#7c3aed' },
  { icon: FiUsers,         title: 'Volunteer Hub',       desc: 'Connect with volunteer teachers for live tutoring sessions.', color: '#e11d48' },
  { icon: FiStar,          title: 'Gamified Progress',  desc: 'Earn points, maintain streaks, and track your growth visually.', color: '#0891b2' },
]

const stats = [
  { value: '50+', label: 'Villages Reached' },
  { value: '10K+', label: 'Students Learning' },
  { value: '3', label: 'Languages Supported' },
  { value: '99%', label: 'Offline Capable' },
]

const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } }

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 bg-white/90 backdrop-blur z-20 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">E</div>
            <span className="font-bold text-xl text-slate-800">Eduko</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10" style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(22,163,74,0.12) 0%, transparent 70%)'
        }} />
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-32 text-center">
          <motion.div {...fadeUp} transition={{ duration: 0.6 }}>
            <span className="badge badge-green text-sm mb-6 inline-flex">🌱 AI-Powered Rural Education</span>
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Quality Education for <br />
              <span className="text-gradient">Every Child in India</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              AI-powered learning platform in Hindi, Punjabi & English. Works offline on any phone.
              Free for rural students.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register" className="btn btn-primary btn-lg gap-2">
                Start Learning Free <FiArrowRight />
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">
                Teacher / Volunteer Login
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────── */}
      <section className="bg-primary-700 py-14">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div key={i} {...fadeUp} transition={{ delay: i * 0.1 }} className="text-center">
              <div className="text-4xl font-bold text-white mb-1">{s.value}</div>
              <div className="text-primary-200 text-sm font-medium">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div {...fadeUp} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Everything a Rural Student Needs
            </h2>
            <p className="text-slate-600 text-lg max-w-xl mx-auto">
              Built for low-bandwidth, low-end devices, and rural India's real challenges.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={i} {...fadeUp} transition={{ delay: i * 0.08 }}
                className="card p-6 hover:shadow-xl cursor-default">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: f.color + '18' }}>
                  <f.icon size={22} style={{ color: f.color }} />
                </div>
                <h3 className="font-bold text-slate-800 text-lg mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Ready to start learning?
            </h2>
            <p className="text-slate-600 mb-8">Join thousands of students already using Eduko.</p>
            <Link to="/register" className="btn btn-primary btn-lg gap-2">
              Create Free Account <FiArrowRight />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm">
        <p>© 2024 Eduko — AI-Powered Rural Education. Built with ❤️ for India.</p>
      </footer>
    </div>
  )
}
