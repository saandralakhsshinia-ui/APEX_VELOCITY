import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ParticleBackground from '../components/ParticleBackground'

const howToPlayItems = [
  {
    icon: '◀ / ▶',
    title: 'Steer Lanes',
    desc: 'Steer between lanes and avoid traffic.',
  },
  {
    icon: '⚡',
    title: 'NITRO',
    desc: 'Collect Nitro boosts on the track and use them to gain a burst of speed.',
  },
  {
    icon: '🏁',
    title: 'SPEED ZONE',
    desc: 'Push your speed higher and react quickly to changing traffic.',
  },
  {
    icon: '🚨',
    title: 'TRAFFIC SURGE',
    desc: 'Heavy traffic enters the circuit. Find the open lane and keep racing.',
  },
  {
    icon: '🔥',
    title: 'BOOST RUSH',
    desc: 'Collect boost opportunities and maintain your momentum.',
  },
]

const racingTips = [
  { num: '01', title: 'Watch the traffic', desc: 'Look ahead and choose your lane early.' },
  { num: '02', title: 'Save your Nitro', desc: 'Use Nitro when you have a clear path.' },
  { num: '03', title: 'Chase Near Misses', desc: 'Pass close to traffic to build your combo and increase your score.' },
  { num: '04', title: 'Stay focused', desc: 'The longer you race, the faster the challenge becomes.' },
  { num: '05', title: 'Keep moving', desc: 'Your goal is simple: go farther, go faster, and set your best run.' },
]

export default function About() {
  return (
    <div className="page-container carbon-bg">
      <ParticleBackground />
      <Navbar />

      {/* Page Header */}
      <section style={{ position: 'relative', zIndex: 10, paddingTop: '9rem', paddingBottom: '3rem', paddingLeft: '2rem', paddingRight: '2rem' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="section-subtitle">Briefing Room</span>
            <h1 className="section-title" style={{ fontSize: 'clamp(2rem, 5vw, 3.75rem)', marginTop: '1rem' }}>
              How To <span style={{ color: '#e10600' }}>Play</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.875rem', marginTop: '1rem', maxWidth: '28rem', margin: '1rem auto 0', lineHeight: 1.7 }}>
              Everything you need to know before hitting the track.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content — SINGLE UNIFIED MASTER BOX */}
      <section style={{ position: 'relative', zIndex: 10, paddingBottom: '6rem', paddingLeft: '2rem', paddingRight: '2rem' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
          <motion.div
            className="glass"
            style={{ borderRadius: '1rem', padding: '2.5rem 3rem', border: '1px solid rgba(255,255,255,0.08)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* 1. ABOUT APEX VELOCITY */}
            <div style={{ paddingBottom: '2.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#e10600', marginBottom: '1.25rem' }}>
                ABOUT APEX VELOCITY
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.95rem', lineHeight: 1.8, marginBottom: '1rem', fontWeight: 500 }}>
                Apex Velocity is a fast-paced Formula-inspired arcade racer built around speed, precision and quick reactions.
              </p>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem', lineHeight: 1.8, marginBottom: '1.25rem' }}>
                Race through the Formula Circuit, dodge traffic, collect Nitro boosts and survive dynamic racing events as the pace increases.
              </p>
              <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.8rem', fontWeight: 700, color: '#ffffff', letterSpacing: '0.1em' }}>
                Every second counts. How far can you go?
              </div>
            </div>

            {/* 2. HOW TO PLAY */}
            <div style={{ paddingTop: '2.25rem', paddingBottom: '2.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#e10600', marginBottom: '1.5rem' }}>
                HOW TO PLAY
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {howToPlayItems.map((item) => (
                  <div
                    key={item.title}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1.25rem',
                      padding: '1rem 1.25rem',
                      borderRadius: '0.5rem',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <div style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      color: '#e10600',
                      background: 'rgba(225,6,0,0.12)',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '0.3rem',
                      border: '1px solid rgba(225,6,0,0.25)',
                      flexShrink: 0,
                      minWidth: '3.5rem',
                      textAlign: 'center',
                    }}>
                      {item.icon}
                    </div>
                    <div>
                      <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: '#ffffff', letterSpacing: '0.05em', marginRight: '0.75rem' }}>
                        {item.title}
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                        {item.desc}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. RACING TIPS */}
            <div style={{ paddingTop: '2.25rem', paddingBottom: '2.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#e10600', marginBottom: '1.5rem' }}>
                RACING TIPS
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {racingTips.map((tip) => (
                  <div
                    key={tip.num}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '1.25rem',
                      padding: '1rem 1.25rem',
                      borderRadius: '0.5rem',
                      background: 'rgba(255,255,255,0.015)',
                      border: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.8rem', fontWeight: 800, color: '#e10600', flexShrink: 0 }}>
                      {tip.num} —
                    </span>
                    <div>
                      <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: '#ffffff', marginRight: '0.5rem' }}>
                        {tip.title}:
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                        {tip.desc}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. SLOGAN & CTA INSIDE SINGLE BOX */}
            <div style={{ textAlign: 'center', paddingTop: '2.25rem' }}>
              <h3 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1.1rem', fontWeight: 900, letterSpacing: '0.2em', color: '#ffffff', marginBottom: '0.4rem' }}>
                APEX <span style={{ color: '#e10600' }}>VELOCITY</span>
              </h3>
              <p style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.3em', color: '#e10600', marginBottom: '2rem' }}>
                RACE. REACT. PUSH THE LIMIT.
              </p>
              <Link to="/game" className="btn-primary">
                Start Racing
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
