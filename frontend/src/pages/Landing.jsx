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
  FiCpu,
  FiMonitor,
} from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../components/LanguageSwitcher'

const features = [
  {
    icon: FiMessageSquare,
    title: 'AI Tutor',
    desc: 'Learn instantly in Hindi, Punjabi & English with smart AI guidance.',
    color: '#8B5CF6',
    gradient: 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
  },
  {
    icon: FiBook,
    title: 'Adaptive Learning',
    desc: 'Personalized study plans based on your learning progress.',
    color: '#EC4899',
    gradient: 'linear-gradient(135deg, #EC4899, #F472B6)',
  },
  {
    icon: FiWifi,
    title: 'Offline Learning',
    desc: 'Access lessons even without internet connectivity.',
    color: '#F59E0B',
    gradient: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
  },
  {
    icon: FiGlobe,
    title: 'Multi Language',
    desc: 'AI-powered translations for rural accessibility.',
    color: '#10B981',
    gradient: 'linear-gradient(135deg, #10B981, #34D399)',
  },
  {
    icon: FiUsers,
    title: 'Volunteer Mentors',
    desc: 'Connect with teachers and mentors for free.',
    color: '#3B82F6',
    gradient: 'linear-gradient(135deg, #3B82F6, #60A5FA)',
  },
  {
    icon: FiAward,
    title: 'Gamified Experience',
    desc: 'Earn XP, maintain streaks and unlock achievements.',
    color: '#F43F5E',
    gradient: 'linear-gradient(135deg, #F43F5E, #FB7185)',
  },
]

const courses = [
  {
    title: 'Mathematics for Everyone',
    level: 'Beginner to Advanced',
    lessons: 48,
    students: '12.5k+',
    icon: FiTrendingUp,
    gradient: 'linear-gradient(135deg, #667EEA, #764BA2)',
  },
  {
    title: 'Science & Innovation',
    level: 'All Levels',
    lessons: 36,
    students: '8.2k+',
    icon: FiCpu,
    gradient: 'linear-gradient(135deg, #F093FB, #F5576C)',
  },
  {
    title: 'Digital Literacy',
    level: 'Foundation',
    lessons: 24,
    students: '15.1k+',
    icon: FiMonitor,
    gradient: 'linear-gradient(135deg, #4FACFE, #00F2FE)',
  },
]

const stats = [
  { value: '150K+', label: 'Students', icon: FiUsers },
  { value: '14K+', label: 'Success Stories', icon: FiStar },
  { value: '350+', label: 'Mentors', icon: FiHeart },
  { value: '250+', label: 'Courses', icon: FiBook },
]

export default function Landing() {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { scrollYProgress } = useScroll()
  const heroRef = useRef(null)

  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.8])
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
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
    <div
      style={{
        background: '#F9FAFB',
        color: '#111827',
        overflowX: 'hidden',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        position: 'relative',
      }}
    >
      {/* Global Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700;14..32,800;14..32,900&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          padding: 0;
        }
        
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #8B5CF6, #EC4899);
          border-radius: 10px;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes glow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        
        .float-animation {
          animation: float 6s ease-in-out infinite;
        }
        
        .glow-animation {
          animation: glow 4s ease-in-out infinite;
        }
        
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          
          .mobile-menu-btn {
            display: flex !important;
          }
        }
        
        @media (min-width: 769px) {
          .mobile-menu-btn {
            display: none !important;
          }
          .mobile-nav-overlay {
            display: none !important;
          }
        }
      `}</style>

      {/* Animated Background Blobs */}
      <div
        style={{
          position: 'fixed',
          top: -300,
          left: -300,
          width: 600,
          height: 600,
          background: '#8B5CF6',
          opacity: 0.12,
          filter: 'blur(140px)',
          zIndex: 0,
          borderRadius: '50%',
        }}
        className="glow-animation"
      />
      <div
        style={{
          position: 'fixed',
          bottom: -200,
          right: -200,
          width: 500,
          height: 500,
          background: '#EC4899',
          opacity: 0.1,
          filter: 'blur(130px)',
          zIndex: 0,
          borderRadius: '50%',
        }}
        className="glow-animation"
      />
      <div
        style={{
          position: 'fixed',
          top: '40%',
          left: '30%',
          width: 400,
          height: 400,
          background: '#F59E0B',
          opacity: 0.06,
          filter: 'blur(120px)',
          zIndex: 0,
          borderRadius: '50%',
        }}
      />

      {/* NAVBAR */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          padding: '16px 24px',
          transition: 'all 0.3s ease',
          background: scrolled ? 'rgba(255,255,255,0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(0,0,0,0.05)' : 'none',
          boxShadow: scrolled ? '0 4px 20px rgba(0,0,0,0.05)' : 'none',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
            }}
            onClick={() => scrollToSection('hero')}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                color: 'white',
              }}
            >
              <img src="./icon.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span
              style={{
                fontSize: 24,
                fontWeight: 800,
                background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Eduko
            </span>
          </motion.div>

          {/* Desktop Navigation */}
          <nav
            className="desktop-nav"
            style={{
              display: 'flex',
              gap: 40,
              alignItems: 'center',
            }}
          >
            {['hero', 'features', 'courses', 'about'].map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4B5563',
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: 'pointer',
                  transition: 'color 0.2s',
                  textTransform: 'capitalize',
                }}
                onMouseEnter={(e) => (e.target.style.color = '#8B5CF6')}
                onMouseLeave={(e) => (e.target.style.color = '#4B5563')}
              >
                {t(item === 'hero' ? 'home' : item)}
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <LanguageSwitcher />

            <Link
              to="/login"
              style={{
                textDecoration: 'none',
                color: '#4B5563',
                fontWeight: 600,
                fontSize: 14,
                padding: '8px 16px',
                borderRadius: 12,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => (e.target.style.background = '#F3F4F6')}
              onMouseLeave={(e) => (e.target.style.background = 'transparent')}
            >
              {t('login')}
            </Link>

            <Link
              to="/register"
              style={{
                textDecoration: 'none',
                background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                color: 'white',
                padding: '10px 24px',
                borderRadius: 14,
                fontWeight: 700,
                fontSize: 14,
                boxShadow: '0 8px 20px rgba(139,92,246,0.3)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 12px 28px rgba(139,92,246,0.4)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 8px 20px rgba(139,92,246,0.3)'
              }}
            >
              {t('getStartedNav')}
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="mobile-menu-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                background: 'rgba(255,255,255,0.9)',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: 12,
                padding: 10,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      {menuOpen && (
        <div
          className="mobile-nav-overlay"
          style={{
            position: 'fixed',
            top: 80,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255,255,255,0.98)',
            backdropFilter: 'blur(10px)',
            zIndex: 999,
            padding: '40px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {['hero', 'features', 'courses', 'about'].map((item) => (
            <button
              key={item}
              onClick={() => scrollToSection(item)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 24,
                fontWeight: 600,
                color: '#1F2937',
                padding: '16px',
                textAlign: 'left',
                cursor: 'pointer',
                borderBottom: '1px solid #E5E7EB',
              }}
            >
              {t(item === 'hero' ? 'home' : item)}
            </button>
          ))}
        </div>
      )}

      <main style={{ position: 'relative', zIndex: 2 }}>
        {/* HERO SECTION */}
        <section
          id="hero"
          ref={heroRef}
          style={{
            padding: '160px 24px 100px',
            position: 'relative',
          }}
        >
          <motion.div
            style={{
              maxWidth: 1280,
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 60,
              alignItems: 'center',
              opacity: heroOpacity,
              scale: heroScale,
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Left Content */}
            <div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'rgba(139,92,246,0.1)',
                  color: '#7C3AED',
                  padding: '8px 20px',
                  borderRadius: 100,
                  fontWeight: 700,
                  fontSize: 14,
                  marginBottom: 28,
                  border: '1px solid rgba(139,92,246,0.2)',
                }}
              >
                {t('heroBadge')}
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{
                  fontSize: 'clamp(3rem, 7vw, 5.5rem)',
                  lineHeight: 1.1,
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                  marginBottom: 24,
                }}
              >
                {t('heroTitle')}
                <br />
                <span
                  style={{
                    background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {t('heroAnywhere')}
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                style={{
                  fontSize: 18,
                  lineHeight: 1.7,
                  color: '#6B7280',
                  maxWidth: 560,
                  marginBottom: 40,
                }}
              >
                {t('heroDesc')}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                style={{
                  display: 'flex',
                  gap: 18,
                  flexWrap: 'wrap',
                  marginBottom: 60,
                }}
              >
                <Link
                  to="/register"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                    color: 'white',
                    padding: '16px 32px',
                    borderRadius: 20,
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: 16,
                    boxShadow: '0 20px 35px rgba(139,92,246,0.35)',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-3px)'
                    e.target.style.boxShadow = '0 25px 40px rgba(139,92,246,0.45)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = '0 20px 35px rgba(139,92,246,0.35)'
                  }}
                >
                  {t('startLearning')}
                  <FiArrowRight />
                </Link>

                <button
                  onClick={() => alert('Demo video coming soon!')}
                  style={{
                    border: '1px solid #E5E7EB',
                    background: 'white',
                    padding: '16px 28px',
                    borderRadius: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#F9FAFB'
                    e.target.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'white'
                    e.target.style.transform = 'translateY(0)'
                  }}
                >
                  <FiPlay />
                  {t('watchDemo')}
                </button>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                style={{
                  display: 'flex',
                  gap: 48,
                  flexWrap: 'wrap',
                  paddingTop: 20,
                  borderTop: '1px solid #E5E7EB',
                }}
              >
                {stats.map((stat, i) => {
                  const Icon = stat.icon
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 16,
                          background: 'rgba(139,92,246,0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon size={24} color="#8B5CF6" />
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 28,
                            fontWeight: 800,
                            color: '#1F2937',
                          }}
                        >
                          {stat.value}
                        </div>
                        <div style={{ color: '#6B7280', fontSize: 14 }}>
                          {stat.label}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </motion.div>
            </div>

            {/* Right Hero - Responsive Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              style={{
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  borderRadius: 40,
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                  padding: 20,
                  boxShadow: '0 40px 80px rgba(139,92,246,0.3)',
                }}
              >
                {/* Responsive Image */}
                <img
                  src="./hero.png"
                  alt="Students learning in rural area"
                  style={{
                    width: '100%',
                    height: 'auto',
                    objectFit: 'cover',
                    borderRadius: 30,
                    display: 'block',
                  }}
                />

                {/* Floating Cards */}
                <motion.div
                  className="float-animation"
                  style={{
                    position: 'absolute',
                    top: 30,
                    right: -20,
                    background: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: 24,
                    padding: '16px 24px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                    border: '1px solid rgba(255,255,255,0.3)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FiStar size={20} color="#F59E0B" />
                    <span style={{ fontWeight: 800 }}>4.9 Rating</span>
                  </div>
                </motion.div>

                <motion.div
                  className="float-animation"
                  style={{
                    position: 'absolute',
                    bottom: 40,
                    left: -20,
                    background: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: 24,
                    padding: '16px 24px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    animationDelay: '1s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FiTrendingUp size={20} color="#10B981" />
                    <span style={{ fontWeight: 800 }}>Personalized AI</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* FEATURES SECTION */}
        <section
          id="features"
          style={{
            padding: '100px 24px',
            position: 'relative',
          }}
        >
          <div
            style={{
              maxWidth: 1280,
              margin: '0 auto',
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              style={{
                textAlign: 'center',
                marginBottom: 80,
              }}
            >
              <div
                style={{
                  display: 'inline-block',
                  padding: '6px 16px',
                  background: 'rgba(139,92,246,0.1)',
                  borderRadius: 100,
                  color: '#7C3AED',
                  fontWeight: 600,
                  fontSize: 14,
                  marginBottom: 20,
                }}
              >
                {t('whyChooseUs')}
              </div>
              <h2
                style={{
                  fontSize: 'clamp(2.5rem, 5vw, 3.8rem)',
                  fontWeight: 900,
                  marginBottom: 20,
                  letterSpacing: '-0.02em',
                }}
              >
                Powerful Features
              </h2>
              <p
                style={{
                  color: '#6B7280',
                  maxWidth: 650,
                  margin: '0 auto',
                  fontSize: 18,
                  lineHeight: 1.7,
                }}
              >
                Designed for modern students with AI, accessibility, and
                offline-first experiences.
              </p>
            </motion.div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 32,
              }}
            >
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{
                    y: -12,
                    transition: { duration: 0.2 },
                  }}
                  style={{
                    background: 'white',
                    borderRadius: 32,
                    padding: 36,
                    border: '1px solid rgba(0,0,0,0.05)',
                    boxShadow: '0 20px 35px -12px rgba(0,0,0,0.05)',
                    transition: 'all 0.3s',
                  }}
                >
                  <div
                    style={{
                      width: 70,
                      height: 70,
                      borderRadius: 24,
                      background: `${feature.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 28,
                      transition: 'all 0.3s',
                    }}
                  >
                    <feature.icon size={34} color={feature.color} />
                  </div>

                  <h3
                    style={{
                      fontSize: 24,
                      fontWeight: 800,
                      marginBottom: 16,
                      color: '#1F2937',
                    }}
                  >
                    {feature.title}
                  </h3>

                  <p
                    style={{
                      color: '#6B7280',
                      lineHeight: 1.7,
                      fontSize: 15,
                    }}
                  >
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* COURSES SECTION */}
        <section
          id="courses"
          style={{
            padding: '100px 24px',
            background: '#FFFFFF',
            position: 'relative',
          }}
        >
          <div
            style={{
              maxWidth: 1280,
              margin: '0 auto',
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{
                textAlign: 'center',
                marginBottom: 80,
              }}
            >
              <div
                style={{
                  display: 'inline-block',
                  padding: '6px 16px',
                  background: 'rgba(236,72,153,0.1)',
                  borderRadius: 100,
                  color: '#EC4899',
                  fontWeight: 600,
                  fontSize: 14,
                  marginBottom: 20,
                }}
              >
                Popular Courses
              </div>
              <h2
                style={{
                  fontSize: 'clamp(2.5rem, 5vw, 3.8rem)',
                  fontWeight: 900,
                  marginBottom: 20,
                }}
              >
                Start Your Learning Journey
              </h2>
              <p
                style={{
                  color: '#6B7280',
                  maxWidth: 650,
                  margin: '0 auto',
                  fontSize: 18,
                }}
              >
                Handpicked courses to boost your skills and knowledge
              </p>
            </motion.div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 32,
              }}
            >
              {courses.map((course, i) => {
                const CourseIcon = course.icon
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ y: -8 }}
                    style={{
                      background: '#F9FAFB',
                      borderRadius: 32,
                      overflow: 'hidden',
                      border: '1px solid #E5E7EB',
                      transition: 'all 0.3s',
                    }}
                  >
                    <div
                      style={{
                        background: course.gradient,
                        padding: 40,
                        textAlign: 'center',
                        color: 'white',
                      }}
                    >
                      <CourseIcon size={48} style={{ margin: '0 auto' }} />
                    </div>
                    <div style={{ padding: 28 }}>
                      <h3
                        style={{
                          fontSize: 22,
                          fontWeight: 800,
                          marginBottom: 12,
                        }}
                      >
                        {course.title}
                      </h3>
                      <div
                        style={{
                          display: 'flex',
                          gap: 16,
                          marginBottom: 20,
                          color: '#6B7280',
                          fontSize: 14,
                        }}
                      >
                        <span>Lessons: {course.lessons}</span>
                        <span>Students: {course.students}</span>
                      </div>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          color: '#8B5CF6',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Learn More <FiChevronRight size={18} />
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ABOUT SECTION */}
        <section
          id="about"
          style={{
            padding: '100px 24px',
            position: 'relative',
          }}
        >
          <div
            style={{
              maxWidth: 1280,
              margin: '0 auto',
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 60,
                alignItems: 'center',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'inline-block',
                    padding: '6px 16px',
                    background: 'rgba(16,185,129,0.1)',
                    borderRadius: 100,
                    color: '#10B981',
                    fontWeight: 600,
                    fontSize: 14,
                    marginBottom: 20,
                  }}
                >
                  Our Mission
                </div>
                <h2
                  style={{
                    fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                    fontWeight: 900,
                    marginBottom: 24,
                    lineHeight: 1.2,
                  }}
                >
                  Empowering Education for Everyone
                </h2>
                <p
                  style={{
                    color: '#6B7280',
                    fontSize: 17,
                    lineHeight: 1.7,
                    marginBottom: 32,
                  }}
                >
                  Eduko is on a mission to democratize education using AI and
                  technology. We believe that quality education should be
                  accessible to every student, regardless of their location or
                  economic background.
                </p>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 20,
                  }}
                >
                  {[
                    { icon: FiShield, text: 'Free access for rural students' },
                    { icon: FiHeart, text: 'Community-driven learning' },
                    { icon: FiGlobe, text: 'Available in 5+ regional languages' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background: 'rgba(139,92,246,0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <item.icon size={20} color="#8B5CF6" />
                      </div>
                      <span style={{ fontWeight: 500 }}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                style={{
                  background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                  borderRadius: 40,
                  padding: 50,
                  textAlign: 'center',
                  color: 'white',
                }}
              >
                <FiUsers size={80} style={{ marginBottom: 20, opacity: 0.9 }} />
                <h3 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16 }}>
                  50,000+ Students Impacted
                </h3>
                <p style={{ opacity: 0.9, lineHeight: 1.6 }}>
                  Join our growing community of learners and mentors across India
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section
          style={{
            padding: '0 24px 120px',
            position: 'relative',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{
              maxWidth: 1200,
              margin: '0 auto',
              borderRadius: 48,
              background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
              padding: '80px 40px',
              textAlign: 'center',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 200,
                height: 200,
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '50%',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: -30,
                left: -30,
                width: 150,
                height: 150,
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '50%',
              }}
            />
            <h2
              style={{
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                fontWeight: 900,
                marginBottom: 20,
                position: 'relative',
              }}
            >
              Start Learning Today
            </h2>
            <p
              style={{
                maxWidth: 600,
                margin: '0 auto 40px',
                lineHeight: 1.7,
                fontSize: 18,
                opacity: 0.95,
                position: 'relative',
              }}
            >
              Join thousands of students already learning with Eduko for free.
            </p>
            <Link
              to="/register"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                background: 'white',
                color: '#7C3AED',
                textDecoration: 'none',
                padding: '16px 36px',
                borderRadius: 20,
                fontWeight: 800,
                fontSize: 16,
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => (e.target.style.transform = 'translateY(-3px)')}
              onMouseLeave={(e) => (e.target.style.transform = 'translateY(0)')}
            >
              Create Free Account
              <FiArrowRight />
            </Link>
          </motion.div>
        </section>
      </main>

      {/* FOOTER */}
      <footer
        style={{
          padding: '60px 24px 40px',
          background: '#F9FAFB',
          borderTop: '1px solid #E5E7EB',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 48,
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  // background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: 'white',
                }}
              >
                 <img src="./icon.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <span style={{ fontSize: 22, fontWeight: 800 }}>Eduko</span>
            </div>
            <p style={{ color: '#6B7280', lineHeight: 1.6, fontSize: 14 }}>
              AI-powered education for rural India.
            </p>
          </div>
          <div>
            {/* <h4 style={{ fontWeight: 700, marginBottom: 20 }}>Product</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}> */}
              {/* {['Features', 'Courses', 'Pricing', 'FAQ'].map((item) => (
                <li key={item} style={{ marginBottom: 12 }}>
                  <button
                    onClick={() => scrollToSection(item.toLowerCase())}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#6B7280',
                      cursor: 'pointer',
                      fontSize: 14,
                    }}
                  >
                    {item}
                  </button>
                </li>
              ))} */}
            {/* </ul> */}
          </div>
          {/* <div>
            <h4 style={{ fontWeight: 700, marginBottom: 20 }}>Company</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {['About', 'Blog', 'Careers', 'Contact'].map((item) => (
                <li key={item} style={{ marginBottom: 12 }}>
                  <button
                    onClick={() => scrollToSection(item.toLowerCase())}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#6B7280',
                      cursor: 'pointer',
                      fontSize: 14,
                    }}
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div> */}
          {/* <div>
            <h4 style={{ fontWeight: 700, marginBottom: 20 }}>Connect</h4>
            <div style={{ display: 'flex', gap: 16 }}>
              <FiTwitter size={20} color="#6B7280" style={{ cursor: 'pointer' }} />
              <FiGithub size={20} color="#6B7280" style={{ cursor: 'pointer' }} />
              <FiLinkedin size={20} color="#6B7280" style={{ cursor: 'pointer' }} />
            </div>
          </div> */}
        </div>
        <div
          style={{
            textAlign: 'center',
            marginTop: 60,
            paddingTop: 30,
            borderTop: '1px solid #E5E7EB',
            color: '#9CA3AF',
            fontSize: 14,
          }}
        >
          © 2026 Eduko — AI Powered Rural Education. All rights reserved.
        </div>
      </footer>
    </div>
  )
}