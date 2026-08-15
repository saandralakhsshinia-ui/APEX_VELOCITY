import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ParticleBackground from '../components/ParticleBackground'

const leaders = [
  { rank: 1, name: 'VERSTAPPEN_X', time: '1:22.437', points: 12500, delta: '' },
  { rank: 2, name: 'HAMILTON_44', time: '1:22.891', points: 11200, delta: '+0.454' },
  { rank: 3, name: 'LECLERC_16', time: '1:23.012', points: 10800, delta: '+0.575' },
  { rank: 4, name: 'NORRIS_04', time: '1:23.344', points: 9500, delta: '+0.907' },
  { rank: 5, name: 'ALONSO_14', time: '1:23.567', points: 8900, delta: '+1.130' },
  { rank: 6, name: 'PIASTRI_81', time: '1:23.890', points: 8100, delta: '+1.453' },
  { rank: 7, name: 'RUSSELL_63', time: '1:24.012', points: 7600, delta: '+1.575' },
  { rank: 8, name: 'SAINZ_55', time: '1:24.234', points: 7100, delta: '+1.797' },
]

function getRankColor(rank) {
  if (rank === 1) return '#facc15'
  if (rank === 2) return '#d1d5db'
  if (rank === 3) return '#b45309'
  return 'rgba(255,255,255,0.4)'
}

function getRankBg(rank) {
  if (rank === 1) return 'rgba(250,204,21,0.08)'
  if (rank === 2) return 'rgba(209,213,219,0.06)'
  if (rank === 3) return 'rgba(180,83,9,0.06)'
  return 'transparent'
}

export default function Leaderboard() {
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
            <span className="section-subtitle">Global Rankings</span>
            <h1 className="section-title" style={{ fontSize: 'clamp(2rem, 5vw, 3.75rem)', marginTop: '1rem' }}>
              Leader<span style={{ color: '#e10600' }}>board</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.875rem', marginTop: '1rem', maxWidth: '28rem', margin: '1rem auto 0', lineHeight: 1.7 }}>
              The fastest racers in the world. Where do you stand?
            </p>
          </motion.div>
        </div>
      </section>

      {/* Table */}
      <section style={{ position: 'relative', zIndex: 10, paddingBottom: '6rem', paddingLeft: '2rem', paddingRight: '2rem' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
          {/* Table Header */}
          <motion.div
            style={{
              display: 'grid', gridTemplateColumns: '60px 1fr 120px 100px 100px',
              alignItems: 'center', padding: '0.75rem 1.5rem', marginBottom: '0.75rem',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.55rem', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>POS</span>
            <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.55rem', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>Driver</span>
            <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.55rem', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', textAlign: 'center' }}>Best Time</span>
            <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.55rem', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', textAlign: 'center' }}>Delta</span>
            <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.55rem', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', textAlign: 'right' }}>Points</span>
          </motion.div>

          {/* Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {leaders.map((driver, i) => (
              <motion.div
                key={driver.rank}
                style={{
                  display: 'grid', gridTemplateColumns: '60px 1fr 120px 100px 100px',
                  alignItems: 'center', padding: '1rem 1.5rem', borderRadius: '0.5rem',
                  background: getRankBg(driver.rank),
                  border: `1px solid ${driver.rank <= 3 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
                  cursor: 'default', transition: 'all 0.3s ease',
                }}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 + 0.4, duration: 0.5 }}
                whileHover={{ x: 4, backgroundColor: 'rgba(225,6,0,0.05)' }}
              >
                <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1.1rem', fontWeight: 700, color: getRankColor(driver.rank) }}>
                  {String(driver.rank).padStart(2, '0')}
                </span>
                <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.8)' }}>
                  {driver.name}
                </span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
                  {driver.time}
                </span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', textAlign: 'center', color: driver.delta ? 'rgba(225,6,0,0.7)' : '#facc15' }}>
                  {driver.delta || 'FASTEST'}
                </span>
                <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textAlign: 'right' }}>
                  {driver.points.toLocaleString()}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
