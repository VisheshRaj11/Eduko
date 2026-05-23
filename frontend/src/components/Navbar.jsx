// components/Navbar.jsx
import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiMenu, FiX } from 'react-icons/fi'
import LanguageSwitcher from './LanguageSwitcher'

const Navbar = ({ variant = 'landing' }) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [location])

  // Smooth scroll to section (for landing page)
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setMenuOpen(false)
    }
  }

  // Navigation items – adapt behavior based on variant
  const navItems =
    variant === 'landing'
      ? [
          { label: 'Home', id: 'hero', isAnchor: true },
          { label: 'Features', id: 'features', isAnchor: true },
          { label: 'Courses', id: 'courses', isAnchor: true },
          { label: 'About', id: 'about', isAnchor: true },
        ]
      : [
          { label: 'Home', path: '/', isAnchor: false },
          { label: 'Features', path: '/#features', isAnchor: false },
          { label: 'Courses', path: '/#courses', isAnchor: false },
          { label: 'About', path: '/#about', isAnchor: false },
        ]

  const handleNavClick = (item) => {
    if (item.isAnchor && variant === 'landing') {
      scrollToSection(item.id)
    } else {
      // For non‑landing pages, we use Link – but if you prefer full page reload, use window.location
      // Here we rely on <Link> to handle it.
    }
  }

  return (
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
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 20,
              color: 'white',
              boxShadow: '0 8px 20px rgba(139,92,246,0.3)',
            }}
          >
            E
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
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="desktop-nav"
          style={{
            display: 'flex',
            gap: 40,
            alignItems: 'center',
          }}
        >
          {navItems.map((item) => (
            <div key={item.label}>
              {item.isAnchor && variant === 'landing' ? (
                <button
                  onClick={() => scrollToSection(item.id)}
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
                  {item.label}
                </button>
              ) : (
                <Link
                  to={item.path}
                  style={{
                    textDecoration: 'none',
                    color: '#4B5563',
                    fontWeight: 600,
                    fontSize: 15,
                    transition: 'color 0.2s',
                    textTransform: 'capitalize',
                  }}
                  onMouseEnter={(e) => (e.target.style.color = '#8B5CF6')}
                  onMouseLeave={(e) => (e.target.style.color = '#4B5563')}
                >
                  {item.label}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Right Actions */}
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
            Login
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
            Get Started
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
              display: 'none', // will be overridden by media query
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </div>

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
          {navItems.map((item) => (
            <div key={item.label}>
              {item.isAnchor && variant === 'landing' ? (
                <button
                  onClick={() => scrollToSection(item.id)}
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
                    width: '100%',
                  }}
                >
                  {item.label}
                </button>
              ) : (
                <Link
                  to={item.path}
                  style={{
                    textDecoration: 'none',
                    fontSize: 24,
                    fontWeight: 600,
                    color: '#1F2937',
                    padding: '16px',
                    display: 'block',
                    borderBottom: '1px solid #E5E7EB',
                  }}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Media query overrides for mobile menu button */}
      <style>{`
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
    </header>
  )
}

export default Navbar