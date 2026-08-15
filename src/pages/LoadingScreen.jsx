import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/* ═══════════════════════════════════════════════════════════════
   AUDIO SYNTHESIZER FOR START LIGHTS (Web Audio API)
   ═══════════════════════════════════════════════════════════════ */
let audioCtx = null
function getAudioCtx() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (AudioContext) audioCtx = new AudioContext()
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

function playStartLightBeep(isGo = false) {
  try {
    const ctx = getAudioCtx()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const freq = isGo ? 1080 : 480
    osc.type = isGo ? 'sawtooth' : 'sine'
    osc.frequency.setValueAtTime(freq, now)
    if (isGo) {
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.22)
    }
    gain.gain.setValueAtTime(isGo ? 0.35 : 0.22, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isGo ? 0.55 : 0.22))
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + (isGo ? 0.55 : 0.22))
  } catch { /* ignore */ }
}

export default function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState('init') // 'init' | 'diagnostics' | 'lights' | 'go' | 'done'
  const [litCount, setLitCount] = useState(0)
  const [lightsOut, setLightsOut] = useState(false)
  const [statusText, setStatusText] = useState('INITIALIZING APEX SYSTEMS...')
  const completedRef = useRef(false)

  const handleFinish = () => {
    if (completedRef.current) return
    completedRef.current = true
    if (onComplete) onComplete()
  }

  // System Diagnostics & Progress
  useEffect(() => {
    const statusMessages = [
      'INITIALIZING APEX RACING TELEMETRY...',
      'CALIBRATING HYBRID ACTIVE DOWNFORCE...',
      'SYNCHRONIZING APEX VELOCITY ENGINES...',
      'WARMING CARBON-CERAMIC BRAKE ROTORS...',
      'RACE GRID SYSTEMS ARMED & READY.'
    ]

    let currentProgress = 0
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 4) + 2
      if (currentProgress >= 100) {
        currentProgress = 100
        setProgress(100)
        clearInterval(interval)
        setTimeout(() => setStage('lights'), 300)
      } else {
        setProgress(currentProgress)
        const msgIdx = Math.min(statusMessages.length - 1, Math.floor((currentProgress / 100) * statusMessages.length))
        setStatusText(statusMessages[msgIdx])
      }
    }, 28)

    return () => clearInterval(interval)
  }, [])

  // 5-Red-Light Starting Sequence
  useEffect(() => {
    if (stage !== 'lights') return

    const timeouts = []
    // Turn on 5 lights sequentially
    for (let i = 1; i <= 5; i++) {
      timeouts.push(setTimeout(() => {
        setLitCount(i)
        playStartLightBeep(false)
      }, i * 450))
    }

    // Random suspense hold (between 1.0s and 1.8s) -> LIGHTS OUT -> GO!
    timeouts.push(setTimeout(() => {
      setLightsOut(true)
      setStage('go')
      playStartLightBeep(true)

      // Transition into website
      setTimeout(() => {
        setStage('done')
        setTimeout(handleFinish, 600)
      }, 950)
    }, 5 * 450 + 1200))

    return () => timeouts.forEach(clearTimeout)
  }, [stage])

  // ESC to skip intro
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        handleFinish()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={stage === 'done' ? { opacity: 0, scale: 1.08, filter: 'blur(16px)' } : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#07070b',
        color: '#ffffff',
        fontFamily: 'Orbitron, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        userSelect: 'none'
      }}
    >
      {/* Carbon Texture & Grid Background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          radial-gradient(rgba(255, 255, 255, 0.055) 1px, transparent 0),
          radial-gradient(rgba(225, 6, 0, 0.04) 1px, transparent 0),
          repeating-linear-gradient(45deg, rgba(0, 0, 0, 0.4) 0, rgba(0, 0, 0, 0.4) 2px, transparent 0, transparent 4px)
        `,
        backgroundSize: '6px 6px, 12px 12px, 6px 6px',
        opacity: 0.85,
        pointerEvents: 'none'
      }} />

      {/* Ambient Red & Cyan Atmospheric Glow */}
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '400px',
        background: stage === 'go' ? 'radial-gradient(circle, rgba(225,6,0,0.45) 0%, rgba(0,229,255,0.15) 50%, transparent 80%)' : 'radial-gradient(circle, rgba(225,6,0,0.18) 0%, transparent 70%)',
        filter: 'blur(50px)',
        pointerEvents: 'none',
        transition: 'all 0.4s ease'
      }} />

      {/* Top Right Skip Button */}
      <button
        onClick={handleFinish}
        style={{
          position: 'absolute',
          top: '1.5rem',
          right: '1.8rem',
          zIndex: 100,
          background: 'rgba(12, 14, 22, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.14)',
          borderRadius: '20px',
          padding: '0.4rem 1.0rem',
          color: 'rgba(255,255,255,0.7)',
          fontSize: '0.62rem',
          fontWeight: 800,
          letterSpacing: '0.18em',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = '#e10600'
          e.currentTarget.style.color = '#ffffff'
          e.currentTarget.style.boxShadow = '0 0 15px rgba(225,6,0,0.35)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'
          e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <span>SKIP INTRO</span>
        <span style={{ fontSize: '0.75rem', color: '#e10600' }}>→</span>
      </button>

      {/* Main Center Stage */}
      <div style={{
        position: 'relative',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '2rem',
        maxWidth: '720px'
      }}>
        
        {/* F1 5-LIGHT STARTING GANTRY */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            background: 'rgba(10, 12, 18, 0.95)',
            border: '2px solid rgba(255,255,255,0.10)',
            borderRadius: '12px',
            padding: '0.75rem 1.4rem',
            boxShadow: '0 10px 35px rgba(0,0,0,0.8), inset 0 0 15px rgba(0,0,0,0.9)',
            display: 'flex',
            gap: '1.1rem',
            alignItems: 'center',
            marginBottom: '2.4rem'
          }}
        >
          {[1, 2, 3, 4, 5].map(i => {
            const isLit = !lightsOut && litCount >= i
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                {/* Red Light Bulb */}
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: isLit 
                      ? 'radial-gradient(circle, #ffffff 10%, #ff1100 50%, #b30000 100%)' 
                      : '#161822',
                    border: `2px solid ${isLit ? '#ff3333' : '#222634'}`,
                    boxShadow: isLit 
                      ? '0 0 22px #ff1e1e, 0 0 45px #e10600, inset 0 0 8px #ffffff' 
                      : 'inset 0 2px 4px rgba(0,0,0,0.8)',
                    transition: 'all 0.08s ease'
                  }}
                />
                {/* Lower Accent Dot */}
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: isLit ? '#ff2222' : '#141620',
                    boxShadow: isLit ? '0 0 6px #ff2222' : 'none'
                  }}
                />
              </div>
            )
          })}
        </motion.div>

        {/* LOGO & BRANDING */}
        <AnimatePresence mode="wait">
          {stage !== 'go' ? (
            <motion.div
              key="brand"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
              transition={{ duration: 0.4 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              {/* Badge Icon */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: 'rgba(225, 6, 0, 0.12)',
                border: '1px solid rgba(225, 6, 0, 0.35)',
                borderRadius: '20px',
                padding: '0.25rem 0.85rem',
                marginBottom: '1.0rem',
                fontSize: '0.58rem',
                fontWeight: 900,
                letterSpacing: '0.22em',
                color: '#e10600'
              }}>
                <span style={{ fontSize: '0.75rem' }}>⚡</span>
                <span>MOTORSPORT SIMULATION</span>
              </div>

              {/* Title */}
              <h1 style={{
                fontSize: 'clamp(2.4rem, 6vw, 4.2rem)',
                fontWeight: 900,
                letterSpacing: '0.12em',
                lineHeight: 1.05,
                textTransform: 'uppercase',
                margin: 0,
                color: '#ffffff'
              }}>
                APEX <span style={{
                  color: '#e10600',
                  textShadow: '0 0 35px rgba(225,6,0,0.8), 0 0 70px rgba(225,6,0,0.4)'
                }}>VELOCITY</span>
              </h1>

              {/* Subtitle */}
              <p style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                letterSpacing: '0.35em',
                color: 'rgba(255, 255, 255, 0.45)',
                textTransform: 'uppercase',
                marginTop: '0.75rem',
                marginBottom: '2.0rem'
              }}>
                LIGHTS OUT AND AWAY WE GO
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="go"
              initial={{ opacity: 0, scale: 2.2, filter: 'blur(20px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.6, filter: 'blur(15px)' }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}
            >
              <h1 style={{
                fontSize: 'clamp(4.5rem, 14vw, 9.0rem)',
                fontWeight: 900,
                letterSpacing: '0.08em',
                fontStyle: 'italic',
                lineHeight: 0.9,
                color: '#e10600',
                textShadow: '0 0 50px #ff1100, 0 0 100px #e10600, 0 0 160px rgba(225,6,0,0.6)',
                margin: 0
              }}>
                GO<span style={{ color: '#ffffff' }}>!</span>
              </h1>
              <p style={{
                fontSize: '0.78rem',
                fontWeight: 900,
                letterSpacing: '0.4em',
                color: '#00e5ff',
                textTransform: 'uppercase',
                marginTop: '1.0rem',
                textShadow: '0 0 15px #00e5ff'
              }}>
                LIGHTS OUT • RACING ACTIVE
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TELEMETRY PROGRESS BAR & DIAGNOSTIC LOG */}
        {stage !== 'go' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ width: '100%', maxWidth: '420px', marginTop: '0.5rem' }}
          >
            {/* Live Diagnostic Message */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.52rem',
              fontWeight: 800,
              letterSpacing: '0.18em',
              color: 'rgba(255,255,255,0.45)',
              marginBottom: '0.5rem'
            }}>
              <span style={{ color: '#00e5ff', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e5ff', boxShadow: '0 0 8px #00e5ff' }} />
                {statusText}
              </span>
              <span style={{ color: '#ffffff', fontFamily: 'Orbitron, monospace', fontWeight: 900 }}>
                {progress}%
              </span>
            </div>

            {/* Progress Bar Container */}
            <div style={{
              position: 'relative',
              width: '100%',
              height: '5px',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '4px',
              overflow: 'hidden',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.6)'
            }}>
              <motion.div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #e10600 0%, #ff3838 70%, #00e5ff 100%)',
                  boxShadow: '0 0 12px #e10600',
                  borderRadius: '4px',
                  transition: 'width 0.08s linear'
                }}
              />
            </div>

            {/* Bottom System Tags */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '0.75rem',
              fontSize: '0.45rem',
              fontWeight: 800,
              letterSpacing: '0.18em',
              color: 'rgba(255,255,255,0.25)'
            }}>
              <span>V12 ARC-ION HYBRID</span>
              <span>18,000 RPM REV LIMIT</span>
              <span>FIA SPEC 2026</span>
            </div>
          </motion.div>
        )}

      </div>
    </motion.div>
  )
}
