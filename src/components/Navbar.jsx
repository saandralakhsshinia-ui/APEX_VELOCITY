import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

const navItems = [
  { path: '/', label: 'HOME' },
  { path: '/garage', label: 'GARAGE' },
  { path: '/leaderboard', label: 'LEADERBOARD' },
  { path: '/about', label: 'ABOUT' },
]

export default function Navbar() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <motion.header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: '1.5rem 3rem',
        background: 'transparent',
        border: 'none'
      }}
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <nav style={{ maxWidth: '85rem', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* LOGO */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', textDecoration: 'none' }}>
          <div style={{ position: 'relative', width: '1.6rem', height: '1.6rem' }}>
            <div style={{
              width: '1.3rem', height: '1.3rem', border: '2px solid #e10600',
              transform: 'rotate(45deg)', position: 'absolute', top: 2, left: 2
            }} />
            <div style={{
              width: '1.3rem', height: '1.3rem', border: '1px solid rgba(225,6,0,0.35)',
              transform: 'rotate(45deg) scale(1.3)', position: 'absolute', top: 2, left: 2
            }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <span style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900, fontSize: '0.9rem', letterSpacing: '0.25em', color: '#ffffff' }}>
              APEX
            </span>
            <span style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900, fontSize: '0.9rem', letterSpacing: '0.25em', color: '#e10600' }}>
              VELOCITY
            </span>
          </div>
        </Link>

        {/* DESKTOP NAV LINKS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }} className="hidden md:flex">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  fontFamily: 'Orbitron, sans-serif',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.22em',
                  color: isActive ? '#e10600' : 'rgba(255,255,255,0.7)',
                  textDecoration: 'none',
                  position: 'relative',
                  paddingBottom: '0.3rem',
                  transition: 'color 0.2s'
                }}
              >
                {item.label}
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 2,
                      background: '#e10600',
                      boxShadow: '0 0 8px #e10600'
                    }}
                  />
                )}
              </Link>
            )
          })}

          <Link
            to="/game"
            style={{
              fontFamily: 'Orbitron, sans-serif',
              fontSize: '0.72rem',
              fontWeight: 900,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              padding: '0.7rem 1.8rem',
              background: 'linear-gradient(135deg, #e10600 0%, #c40000 100%)',
              color: '#ffffff',
              clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
              filter: 'drop-shadow(0 0 16px rgba(225,6,0,0.75))',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            PLAY NOW
          </Link>
        </div>

        {/* MOBILE MENU TOGGLE */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}
          aria-label="Toggle menu"
        >
          ☰
        </button>
      </nav>

      {/* MOBILE DROPDOWN */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              position: 'absolute', top: '100%', left: '1.5rem', right: '1.5rem',
              background: 'rgba(10,12,18,0.95)', backdropFilter: 'blur(20px)',
              padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', flexDirection: 'column', gap: '1rem', zIndex: 100
            }}
          >
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                style={{
                  fontFamily: 'Orbitron, sans-serif',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  color: location.pathname === item.path ? '#e10600' : '#ffffff',
                  textDecoration: 'none'
                }}
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/game"
              onClick={() => setMobileOpen(false)}
              style={{
                fontFamily: 'Orbitron, sans-serif',
                fontSize: '0.8rem',
                fontWeight: 900,
                textAlign: 'center',
                padding: '0.75rem',
                borderRadius: '9999px',
                background: '#e10600',
                color: '#fff',
                textDecoration: 'none'
              }}
            >
              PLAY NOW
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
