import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

export function calculateRank(distance) {
  if (distance >= 3000) return { code: 'S+', title: 'Elite Racer', color: '#ff2200', glow: '0 0 30px rgba(255,34,0,0.85)' }
  if (distance >= 2000) return { code: 'S', title: 'Master Racer', color: '#ff4400', glow: '0 0 30px rgba(255,68,0,0.85)' }
  if (distance >= 1400) return { code: 'A', title: 'Pro Driver', color: '#ffaa00', glow: '0 0 30px rgba(255,170,0,0.85)' }
  if (distance >= 800)  return { code: 'B', title: 'Skilled Driver', color: '#00ccff', glow: '0 0 30px rgba(0,204,255,0.85)' }
  if (distance >= 350)  return { code: 'C', title: 'Rookie', color: '#3399ff', glow: '0 0 30px rgba(51,153,255,0.85)' }
  return { code: 'D', title: 'Beginner', color: '#aaaaaa', glow: '0 0 20px rgba(170,170,170,0.5)' }
}

export default function Results() {
  const [data, setData] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    try {
      const stored = localStorage.getItem('lastRace')
      if (stored) {
        setData(JSON.parse(stored))
      }
    } catch { /* ignore */ }
  }, [])

  const race = data || {
    distance: 9099,
    topSpeed: 924,
    nearMisses: 3,
    highestCombo: 2,
    nitroUsed: 0,
    finalScore: 9449,
    highScore: parseInt(localStorage.getItem('highScore') || '14123', 10),
    isNewRecord: false,
    skinName: 'Apex R1',
  }

  const finalScore = race.finalScore || 0
  const bestRecord = Math.max(race.highScore || 0, race.distance || 0)

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      minHeight: '100vh',
      background: '#090a0f',
      backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(25, 10, 20, 0.8) 0%, #050609 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      fontFamily: 'Orbitron, sans-serif',
      color: '#ffffff',
      overflow: 'hidden'
    }}>
      {/* Carbon pattern overlay */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.15, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 0, transparent 8px)'
      }} />

      {/* TOP BAR HEADER */}
      <div style={{
        position: 'absolute', top: '1.5rem', left: '2rem', right: '2rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 20
      }}>
        {/* LOGO */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{
            fontFamily: 'Orbitron, sans-serif', fontSize: '1.8rem', fontWeight: 900,
            color: '#ff2222', fontStyle: 'italic', transform: 'skewX(-10deg)',
            textShadow: '0 0 15px rgba(255,34,34,0.6)'
          }}>
            N
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.15em', color: '#ffffff', lineHeight: 1 }}>
              APEX
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.15em', color: '#ff2222', lineHeight: 1 }}>
              VELOCITY
            </div>
          </div>
        </div>

        {/* TOP RIGHT TAG */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.6)',
          borderRight: '3px solid #ff2222', paddingRight: '0.6rem'
        }}>
          RACE TELEMETRY |
        </div>
      </div>

      {/* MAIN CARD FRAME */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1.0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%',
          maxWidth: '680px',
          background: 'radial-gradient(ellipse at 50% 0%, #160c14 0%, #0c0d14 70%, #07080c 100%)',
          borderRadius: '20px',
          border: '1.5px solid rgba(255, 34, 34, 0.65)',
          boxShadow: '0 0 45px rgba(255, 34, 34, 0.25), inset 0 0 40px rgba(0, 0, 0, 0.8)',
          position: 'relative',
          padding: '2.5rem 3rem',
          textAlign: 'center',
          zIndex: 10,
          marginTop: '2rem'
        }}>

        {/* CARD HEADER WITH CHECKERED FLAG */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', marginBottom: '0.2rem' }}>
          <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
            <path d="M8 6v36" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
            <path d="M8 6h28l-6 8 6 8H8V6z" fill="#fff" />
            <rect x="8" y="6" width="7" height="5.33" fill="#1a1a1a" />
            <rect x="22" y="6" width="7" height="5.33" fill="#1a1a1a" />
            <rect x="15" y="11.33" width="7" height="5.33" fill="#1a1a1a" />
            <rect x="29" y="11.33" width="7" height="5.33" fill="#1a1a1a" />
            <rect x="8" y="16.66" width="7" height="5.33" fill="#1a1a1a" />
            <rect x="22" y="16.66" width="7" height="5.33" fill="#1a1a1a" />
          </svg>
          <h1 style={{
            fontSize: 'clamp(2.0rem, 5vw, 2.8rem)', fontWeight: 900,
            fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0
          }}>
            RACE <span style={{ color: '#ff2222', textShadow: '0 0 25px rgba(255,34,34,0.8)' }}>COMPLETE</span>
          </h1>
        </div>

        <div style={{
          fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.4)',
          textTransform: 'uppercase', marginBottom: '1.8rem'
        }}>
          THANK YOU FOR PUSHING TO THE LIMIT
        </div>

        {/* FINAL SCORE DISPLAY */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.3em', color: '#ff2222', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
            FINAL SCORE
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.6rem' }}>
            <span style={{
              fontFamily: 'Orbitron, sans-serif', fontSize: 'clamp(2.8rem, 6vw, 4.2rem)', fontWeight: 900,
              fontStyle: 'italic', color: '#ffffff', letterSpacing: '0.04em', lineHeight: 1,
              textShadow: '0 0 30px rgba(255,255,255,0.3)'
            }}>
              {finalScore.toLocaleString()}
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: 900, fontStyle: 'italic', color: 'rgba(255,255,255,0.8)' }}>
              PTS
            </span>
          </div>
        </div>

        {/* 2-COLUMN METRICS GRID WITH SEPARATORS */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 2.5rem',
          position: 'relative', padding: '1.2rem 0',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          marginBottom: '2rem',
          textAlign: 'left'
        }}>
          {/* Center vertical line */}
          <div style={{ position: 'absolute', top: '5%', bottom: '5%', left: '50%', width: 1, background: 'rgba(255,255,255,0.1)' }} />

          {/* LEFT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {/* DISTANCE COVERED */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
              <div style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff2222" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 21h18M5 21V7l7-4 7 4v14" />
                  <path d="M9 13h6" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '0.5rem', fontWeight: 800, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>
                  DISTANCE COVERED
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, fontStyle: 'italic', color: '#ffffff' }}>
                  {race.distance.toLocaleString()} <span style={{ color: '#ff2222', fontSize: '0.9rem' }}>m</span>
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

            {/* HIGHEST SPEED */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
              <div style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff2222" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '0.5rem', fontWeight: 800, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>
                  HIGHEST SPEED
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, fontStyle: 'italic', color: '#ffffff' }}>
                  {race.topSpeed} <span style={{ color: '#ff2222', fontSize: '0.85rem' }}>km/h</span>
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

            {/* NEAR MISSES */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
              <div style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff2222" strokeWidth="2" strokeLinecap="round">
                  <rect x="4" y="8" width="16" height="10" rx="3" />
                  <circle cx="7" cy="18" r="2" />
                  <circle cx="17" cy="18" r="2" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '0.5rem', fontWeight: 800, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>
                  NEAR MISSES
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, fontStyle: 'italic', color: '#ffffff' }}>
                  {race.nearMisses || 0}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {/* NITRO USED */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
              <div style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#ff2222" stroke="none">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '0.5rem', fontWeight: 800, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>
                  NITRO USED
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, fontStyle: 'italic', color: '#ffffff' }}>
                  {race.nitroUsed || 0}
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

            {/* HIGHEST COMBO */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
              <div style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff2222" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '0.5rem', fontWeight: 800, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>
                  HIGHEST COMBO
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, fontStyle: 'italic', color: '#ffffff' }}>
                  {race.highestCombo || 0}<span style={{ color: '#ff2222', fontSize: '0.95rem' }}>x</span>
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

            {/* BEST RECORD */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
              <div style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff2222" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.45 1-1 1H7v4h10v-4h-2c-.55 0-1-.45-1-1v-2.34" />
                  <path d="M6 4h12v7a6 6 0 0 1-12 0V4z" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '0.5rem', fontWeight: 800, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>
                  BEST RECORD
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, fontStyle: 'italic', color: '#ffffff' }}>
                  {bestRecord.toLocaleString()} <span style={{ color: '#ff2222', fontSize: '0.9rem' }}>m</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM 3 ACTION BUTTONS (RETRY, HOME, GARAGE) */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center' }}>
          {/* RETRY BUTTON */}
          <motion.button
            onClick={() => navigate('/game')}
            whileHover={{ scale: 1.03, background: 'rgba(255, 255, 255, 0.1)' }}
            whileTap={{ scale: 0.97 }}
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1.5px solid rgba(255, 255, 255, 0.22)',
              borderRadius: '10px',
              padding: '0.85rem 1.2rem',
              color: '#ffffff',
              fontFamily: 'Orbitron, sans-serif',
              fontSize: '0.78rem',
              fontWeight: 900,
              fontStyle: 'italic',
              letterSpacing: '0.16em',
              cursor: 'pointer'
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M1 4v6h6M23 20v-6h-6" />
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
              </svg>
              RETRY
            </span>
          </motion.button>

          {/* HOME BUTTON (CENTER HIGHLIGHTED RED) */}
          <motion.button
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.03, filter: 'drop-shadow(0 0 24px rgba(225,6,0,0.9))' }}
            whileTap={{ scale: 0.97 }}
            style={{
              flex: 1.3,
              background: 'linear-gradient(135deg, #e10600 0%, #c40000 100%)',
              borderRadius: '10px',
              padding: '0.85rem 1.4rem',
              color: '#ffffff',
              fontFamily: 'Orbitron, sans-serif',
              fontSize: '0.82rem',
              fontWeight: 900,
              fontStyle: 'italic',
              letterSpacing: '0.18em',
              cursor: 'pointer',
              border: 'none',
              filter: 'drop-shadow(0 0 16px rgba(225,6,0,0.65))'
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
              HOME
            </span>
          </motion.button>

          {/* GARAGE BUTTON */}
          <motion.button
            onClick={() => navigate('/garage')}
            whileHover={{ scale: 1.03, background: 'rgba(255, 255, 255, 0.1)' }}
            whileTap={{ scale: 0.97 }}
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1.5px solid rgba(255, 255, 255, 0.22)',
              borderRadius: '10px',
              padding: '0.85rem 1.2rem',
              color: '#ffffff',
              fontFamily: 'Orbitron, sans-serif',
              fontSize: '0.78rem',
              fontWeight: 900,
              fontStyle: 'italic',
              letterSpacing: '0.16em',
              cursor: 'pointer'
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
              </svg>
              GARAGE
            </span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
