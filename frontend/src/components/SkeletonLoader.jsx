import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import {
  FiBook,
  FiMessageSquare,
  FiUsers,
  FiWifi,
  FiArrowRight,
  FiGlobe,
  FiAward,
  FiMenu,
  FiX,
  FiPlay,
  FiTrendingUp,
  FiShield,
  FiHeart,
  FiStar,
  FiChevronRight,
  FiTwitter,
  FiGithub,
  FiLinkedin,
} from 'react-icons/fi'

import LanguageSwitcher from '../components/LanguageSwitcher'

const features = [
  {
    icon: FiMessageSquare,
    title: 'AI Tutor',
    desc: 'Learn instantly in Hindi, Punjabi & English with smart AI guidance.',
    color: '#8B5CF6',
  },
  {
    icon: FiBook,
    title: 'Adaptive Learning',
    desc: 'Personalized study plans based on your learning progress.',
    color: '#EC4899',
  },
  {
    icon: FiWifi,
    title: 'Offline Learning',
    desc: 'Access lessons even without internet connectivity.',
    color: '#F59E0B',
  },
  {
    icon: FiGlobe,
    title: 'Multi Language',
    desc: 'AI-powered translations for rural accessibility.',
    color: '#10B981',
  },
  {
    icon: FiUsers,
    title: 'Volunteer Mentors',
    desc: 'Connect with teachers and mentors for free.',
    color: '#3B82F6',
  },
  {
    icon: FiAward,
    title: 'Gamified Experience',
    desc: 'Earn XP, maintain streaks and unlock achievements.',
    color: '#F43F5E',
  },
]

const courses = [
  {
    title: 'Mathematics for Everyone',
    level: 'Beginner to Advanced',
    lessons: 48,
    students: '12.5k+',
    icon: '📐', // will be replaced by a clean icon
    gradient: 'from-indigo-500 to-purple-600',
  },
  {
    title: 'Science & Innovation',
    level: 'All Levels',
    lessons: 36,
    students: '8.2k+',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    title: 'Digital Literacy',
    level: 'Foundation',
    lessons: 24,
    students: '15.1k+',
    gradient: 'from-cyan-500 to-blue-500',
  },
]

const stats = [
  { value: '150K+', label: 'Students', icon: FiUsers },
  { value: '14K+', label: 'Success Stories', icon: FiStar },
  { value: '350+', label: 'Mentors', icon: FiHeart },
  { value: '250+', label: 'Courses', icon: FiBook },
]

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { scrollYProgress } = useScroll()
  const heroRef = useRef(null)

  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.8])
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : 'unset'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [menuOpen])

  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setMenuOpen(false)
    }
  }

  return (
    <div className="bg-gray-50 text-gray-900 overflow-x-hidden font-sans relative">
      {/* Global scrollbar & keyframes are handled by Tailwind config – but for custom animations we add a style tag */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes glow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        .float-animation { animation: float 6s ease-in-out infinite; }
        .glow-animation { animation: glow 4s ease-in-out infinite; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: linear-gradient(135deg, #8B5CF6, #EC4899); border-radius: 10px; }
      `}</style>

      {/* Background blobs */}
      <div className="fixed top-[-300px] left-[-300px] w-[600px] h-[600px] bg-purple-500 opacity-10 blur-[140px] rounded-full glow-animation z-0" />
      <div className="fixed bottom-[-200px] right-[-200px] w-[500px] h-[500px] bg-pink-500 opacity-10 blur-[130px] rounded-full glow-animation z-0" />
      <div className="fixed top-2/5 left-1/3 w-[400px] h-[400px] bg-amber-500 opacity-5 blur-[120px] rounded-full z-0" />

      {/* Navbar */}
      <header
        className={`fixed top-0 left-0 right-0 z-[1000] px-6 py-4 transition-all duration-300 ${
          scrolled
            ? 'bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo - no emoji */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => scrollToSection('hero')}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30 text-white font-bold text-lg">
              E
            </div>
            <span className="text-2xl font-extrabold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              Eduko
            </span>
          </motion.div>

          {/* Desktop nav */}
          <nav className="hidden md:flex gap-10 items-center">
            {['hero', 'features', 'courses', 'about'].map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item)}
                className="text-gray-600 font-semibold text-sm capitalize hover:text-purple-600 transition-colors"
              >
                {item === 'hero' ? 'Home' : item}
              </button>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link
              to="/login"
              className="text-gray-600 font-semibold text-sm px-4 py-2 rounded-xl hover:bg-gray-100 transition"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-purple-500/30 hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              Get Started
            </Link>
            <button
              className="md:hidden bg-white/90 border border-gray-200 rounded-xl p-2"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav overlay */}
      {menuOpen && (
        <div className="fixed top-20 left-0 right-0 bottom-0 bg-white/95 backdrop-blur-md z-[999] p-10 flex flex-col gap-5 md:hidden">
          {['hero', 'features', 'courses', 'about'].map((item) => (
            <button
              key={item}
              onClick={() => scrollToSection(item)}
              className="text-2xl font-semibold text-gray-800 border-b border-gray-200 py-4 text-left"
            >
              {item === 'hero' ? 'Home' : item}
            </button>
          ))}
        </div>
      )}

      <main className="relative z-2">
        {/* Hero Section */}
        <section id="hero" ref={heroRef} className="pt-40 pb-20 px-6 relative">
          <motion.div
            style={{ opacity: heroOpacity, scale: heroScale }}
            className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Left column */}
            <div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-purple-500/10 text-purple-700 px-5 py-2 rounded-full font-bold text-sm border border-purple-200 mb-7"
              >
                AI Powered Education Platform
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-5xl md:text-7xl font-black leading-tight tracking-tight mb-6"
              >
                Learn Smarter
                <br />
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Anywhere
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600 text-lg leading-relaxed max-w-md mb-10"
              >
                AI-powered education platform built for rural India. Learn
                offline, in your language, with personalized guidance.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-5 mb-16"
              >
                <Link
                  to="/register"
                  className="flex items-center gap-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-purple-500/30 hover:-translate-y-1 transition-all"
                >
                  Start Learning <FiArrowRight />
                </Link>
                <button
                  onClick={() => alert('Demo video coming soon')}
                  className="border border-gray-200 bg-white px-7 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-gray-50 transition"
                >
                  <FiPlay /> Watch Demo
                </button>
              </motion.div>

              {/* Stats with icons - no emoji */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex flex-wrap gap-12 pt-5 border-t border-gray-200"
              >
                {stats.map((stat, i) => {
                  const Icon = stat.icon
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center">
                        <Icon size={24} className="text-purple-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-extrabold text-gray-800">
                          {stat.value}
                        </div>
                        <div className="text-gray-500 text-sm">{stat.label}</div>
                      </div>
                    </div>
                  )
                })}
              </motion.div>
            </div>

            {/* Right column - User provided image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-purple-500/20">
                <img
                  src="/path/to/your-image.png"   // ← REPLACE WITH YOUR IMAGE PATH
                  alt="Education growth in rural areas"
                  className="w-full h-auto object-cover"
                />
              </div>
              {/* Floating cards without emojis */}
              <motion.div
                className="float-animation absolute top-5 right-[-10px] md:right-[-20px] bg-white/90 backdrop-blur-md rounded-2xl px-5 py-3 shadow-lg border border-white/50"
              >
                <div className="flex items-center gap-2">
                  <FiStar size={18} className="text-amber-500" />
                  <span className="font-bold text-sm">4.9 Rating</span>
                </div>
              </motion.div>
              <motion.div
                className="float-animation absolute bottom-8 left-[-10px] md:left-[-20px] bg-white/90 backdrop-blur-md rounded-2xl px-5 py-3 shadow-lg border border-white/50"
                style={{ animationDelay: '1s' }}
              >
                <div className="flex items-center gap-2">
                  <FiTrendingUp size={18} className="text-emerald-500" />
                  <span className="font-bold text-sm">Personalized AI</span>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 px-6 relative">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <span className="inline-block px-4 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold mb-5">
                Why Choose Us
              </span>
              <h2 className="text-4xl md:text-5xl font-black mb-5 tracking-tight">
                Powerful Features
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                Designed for modern students with AI, accessibility, and
                offline-first experiences.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -10 }}
                  className="bg-white rounded-3xl p-9 border border-gray-100 shadow-lg shadow-gray-200/50 transition-all"
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-7"
                    style={{ backgroundColor: `${feature.color}15` }}
                  >
                    <feature.icon size={32} color={feature.color} />
                  </div>
                  <h3 className="text-2xl font-extrabold mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Courses Section */}
        <section id="courses" className="py-24 px-6 bg-white relative">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <span className="inline-block px-4 py-1.5 bg-pink-100 text-pink-600 rounded-full text-sm font-semibold mb-5">
                Popular Courses
              </span>
              <h2 className="text-4xl md:text-5xl font-black mb-5">
                Start Your Learning Journey
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                Handpicked courses to boost your skills and knowledge
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map((course, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -8 }}
                  className="bg-gray-50 rounded-3xl overflow-hidden border border-gray-200"
                >
                  <div className={`bg-gradient-to-r ${course.gradient} py-12 text-center`}>
                    {/* No emoji – use a simple icon placeholder */}
                    <div className="text-5xl font-bold text-white opacity-80">
                      {i === 0 && '📐'}
                      {i === 1 && '⚛️'}
                      {i === 2 && '💻'}
                    </div>
                  </div>
                  <div className="p-7">
                    <h3 className="text-xl font-extrabold mb-3">{course.title}</h3>
                    <div className="flex gap-4 mb-5 text-gray-500 text-sm">
                      <span>📚 {course.lessons} lessons</span>
                      <span>👥 {course.students} students</span>
                    </div>
                    <div className="inline-flex items-center gap-2 text-purple-600 font-semibold cursor-pointer">
                      Learn More <FiChevronRight />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-24 px-6 relative">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid md:grid-cols-2 gap-16 items-center"
            >
              <div>
                <span className="inline-block px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold mb-5">
                  Our Mission
                </span>
                <h2 className="text-4xl md:text-5xl font-black leading-tight mb-6">
                  Empowering Education for Everyone
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed mb-8">
                  Eduko is on a mission to democratize education using AI and
                  technology. Quality education accessible to every student,
                  regardless of location or background.
                </p>
                <div className="flex flex-col gap-5">
                  {[
                    { icon: FiShield, text: 'Free access for rural students' },
                    { icon: FiHeart, text: 'Community-driven learning' },
                    { icon: FiGlobe, text: 'Available in 5+ regional languages' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                        <item.icon size={20} className="text-purple-600" />
                      </div>
                      <span className="font-medium">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl p-12 text-center text-white"
              >
                <div className="text-7xl mb-4">🌱</div>
                <h3 className="text-2xl font-extrabold mb-3">
                  50,000+ Students Impacted
                </h3>
                <p className="opacity-90">
                  Join our growing community of learners and mentors across India
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 pb-28 relative">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-6xl mx-auto bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl py-20 px-8 text-center text-white relative overflow-hidden"
          >
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full" />
            <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-white/5 rounded-full" />
            <h2 className="text-4xl md:text-6xl font-black mb-5 relative">
              Start Learning Today
            </h2>
            <p className="max-w-xl mx-auto text-lg opacity-95 mb-10 relative">
              Join thousands of students already learning with Eduko for free.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-3 bg-white text-purple-600 px-8 py-4 rounded-2xl font-extrabold shadow-xl hover:-translate-y-1 transition-all"
            >
              Create Free Account <FiArrowRight />
            </Link>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-16 px-6 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                E
              </div>
              <span className="text-xl font-extrabold">Eduko</span>
            </div>
            <p className="text-gray-500 text-sm">AI-powered education for rural India.</p>
          </div>
          <div>
            <h4 className="font-bold mb-5">Product</h4>
            <ul className="space-y-3">
              {['Features', 'Courses', 'Pricing', 'FAQ'].map((item) => (
                <li key={item}>
                  <button
                    onClick={() => scrollToSection(item.toLowerCase())}
                    className="text-gray-500 text-sm hover:text-gray-700"
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-5">Company</h4>
            <ul className="space-y-3">
              {['About', 'Blog', 'Careers', 'Contact'].map((item) => (
                <li key={item}>
                  <button
                    onClick={() => scrollToSection(item.toLowerCase())}
                    className="text-gray-500 text-sm hover:text-gray-700"
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-5">Connect</h4>
            <div className="flex gap-4">
              <FiTwitter size={20} className="text-gray-500 cursor-pointer hover:text-gray-700" />
              <FiGithub size={20} className="text-gray-500 cursor-pointer hover:text-gray-700" />
              <FiLinkedin size={20} className="text-gray-500 cursor-pointer hover:text-gray-700" />
            </div>
          </div>
        </div>
        <div className="text-center mt-14 pt-6 border-t border-gray-200 text-gray-400 text-sm">
          © 2026 Eduko — AI Powered Rural Education. All rights reserved.
        </div>
      </footer>
    </div>
  )
}