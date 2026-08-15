import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ParticleBackground from '../components/ParticleBackground'

const stats = [
  { value: '340', unit: 'KM/H', label: 'Top Speed' },
  { value: '1.6', unit: 'SEC', label: '0–100' },
  { value: '∞', unit: '', label: 'Tracks' },
  { value: '24', unit: '', label: 'Circuits' },
]

function SmokeElement({ style, delay }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)',
        ...style,
      }}
      animate={{
        x: [0, 60, -30, 80, 0],
        y: [0, -80, -160, -240, -300],
        scale: [0.8, 1.2, 1.5, 1.8, 2],
        opacity: [0, 0.06, 0.04, 0.02, 0],
      }}
      transition={{
        duration: 12,
        repeat: Infinity,
        delay,
        ease: 'linear',
      }}
    />
  )
}

function SparkElement({ delay }) {
  const startX = Math.random() * 100
  const startY = 50 + Math.random() * 40

  return (
    <motion.div
      className="absolute w-[2px] h-[2px] bg-[#e10600] rounded-full pointer-events-none"
      style={{ left: `${startX}%`, top: `${startY}%` }}
      animate={{
        y: [0, -60 - Math.random() * 80],
        x: [0, (Math.random() - 0.5) * 60],
        opacity: [0, 1, 0],
        scale: [0, 1.5, 0],
      }}
      transition={{
        duration: 1.5 + Math.random(),
        repeat: Infinity,
        delay,
        ease: 'easeOut',
      }}
    />
  )
}

export default function Home() {
  const heroRef = useRef(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const { scrollYProgress } = useScroll()
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 1.15])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0.3])

  useEffect(() => {
    window.scrollTo(0, 0)
    const handleMouse = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      })
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [])

  return (
    <div className="page-container carbon-bg">
      <ParticleBackground />
      <Navbar />

      {/* HERO SECTION */}
      <section ref={heroRef} className="relative h-screen overflow-hidden">
        {/* Hero Image with Parallax */}
        <motion.div
          className="absolute inset-0 z-0"
          style={{ scale: heroScale, opacity: heroOpacity }}
        >
          <motion.img
            src="/images/hero-poster.png"
            alt="Apex Velocity Racing"
            className="w-full h-full object-cover"
            style={{
              filter: 'brightness(0.55) contrast(1.2) saturate(1.2)',
            }}
            animate={{
              x: mousePos.x * 0.5,
              y: mousePos.y * 0.5,
              scale: 1.05,
            }}
            transition={{ type: 'spring', stiffness: 50, damping: 30 }}
          />
        </motion.div>

        {/* Gradient overlays */}
        <div className="absolute inset-0 z-[2] bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
        <div className="absolute inset-0 z-[2] bg-gradient-to-r from-[#0a0a0a]/80 via-transparent to-[#0a0a0a]/60" />
        <div className="absolute bottom-0 left-0 right-0 h-40 z-[2] bg-gradient-to-t from-[#0a0a0a] to-transparent" />

        {/* Red ambient glow */}
        <motion.div
          className="absolute top-1/3 right-1/4 w-[600px] h-[600px] rounded-full z-[1] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(225,6,0,0.08) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Smoke elements */}
        <SmokeElement style={{ left: '10%', bottom: '20%', width: 200, height: 200 }} delay={0} />
        <SmokeElement style={{ left: '50%', bottom: '10%', width: 300, height: 300 }} delay={3} />
        <SmokeElement style={{ left: '75%', bottom: '15%', width: 250, height: 250 }} delay={6} />
        <SmokeElement style={{ left: '30%', bottom: '5%', width: 180, height: 180 }} delay={9} />

        {/* Sparks */}
        {Array.from({ length: 8 }).map((_, i) => (
          <SparkElement key={i} delay={i * 0.6} />
        ))}

        {/* Hero Content */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6">
          {/* Subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={{
              fontFamily: 'Orbitron, sans-serif',
              fontSize: '0.62rem',
              fontWeight: 800,
              letterSpacing: '0.35em',
              color: '#e10600',
              textTransform: 'uppercase',
              marginBottom: '1rem',
              textShadow: '0 0 10px rgba(225,6,0,0.45)'
            }}
          >
            FORMULA ENDLESS RACING
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            style={{
              fontFamily: 'Orbitron, sans-serif',
              fontSize: 'clamp(2.5rem, 6vw, 4.8rem)',
              fontWeight: 900,
              letterSpacing: '0.12em',
              color: '#ffffff',
              lineHeight: 0.95,
              marginBottom: '0.2rem',
              textShadow: '0 4px 30px rgba(0,0,0,0.9)'
            }}
          >
            APEX
          </motion.h1>
          <motion.h1
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            style={{
              fontFamily: 'Orbitron, sans-serif',
              fontSize: 'clamp(2.5rem, 6vw, 4.8rem)',
              fontWeight: 900,
              letterSpacing: '0.22em',
              color: '#e10600',
              lineHeight: 1,
              marginBottom: '1.4rem',
              textShadow: '0 0 30px rgba(225, 6, 0, 0.8), 0 0 60px rgba(225, 6, 0, 0.4)'
            }}
          >
            VELOCITY
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85, duration: 0.8 }}
            style={{
              fontFamily: 'Inter, sans-serif',
              color: 'rgba(255,255,255,0.7)',
              fontSize: 'clamp(0.85rem, 1.5vw, 1rem)',
              fontWeight: 400,
              maxWidth: '32rem',
              lineHeight: 1.6,
              marginBottom: '2.5rem',
              textAlign: 'center'
            }}
          >
            Push beyond limits. Race through infinite circuits.
            <br />
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>Every millisecond counts.</span>
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-5 items-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05, duration: 0.8 }}
          >
            <Link to="/game" className="btn-primary">
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              START RACE
            </Link>
            <Link to="/garage" className="btn-secondary">
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              ENTER GARAGE
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator — highlighted */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          <span className="font-[Orbitron] text-[0.6rem] tracking-[0.4em] text-white/50 uppercase"
            style={{ textShadow: '0 0 8px rgba(225,6,0,0.4)' }}
          >
            Scroll
          </span>
          <motion.div
            className="flex flex-col items-center"
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Glowing chevron arrow */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e10600" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 0 6px rgba(225,6,0,0.7))' }}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </motion.div>
        </motion.div>

        {/* Side decorations */}
        <motion.div
          className="absolute left-6 top-1/2 -translate-y-1/2 z-10 hidden lg:flex flex-col gap-4 items-center"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
          <span className="font-[Orbitron] text-[0.5rem] tracking-[0.3em] text-white/20 [writing-mode:vertical-lr] rotate-180">
            EST. 2026
          </span>
          <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
        </motion.div>

        <motion.div
          className="absolute right-6 top-1/2 -translate-y-1/2 z-10 hidden lg:flex flex-col gap-4 items-center"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-[#e10600]/20 to-transparent" />
          <span className="font-[Orbitron] text-[0.5rem] tracking-[0.3em] text-[#e10600]/40 [writing-mode:vertical-lr] rotate-180">
            V1.0
          </span>
          <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-[#e10600]/20 to-transparent" />
        </motion.div>
      </section>

      {/* STATS SECTION */}
      <section style={{ position: 'relative', zIndex: 10, marginTop: '-4px' }}>
        <motion.div
          style={{ maxWidth: '56rem', margin: '0 auto', padding: '0 2rem' }}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="glass" style={{ borderRadius: '0.75rem', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  style={{
                    textAlign: 'center',
                    padding: '2rem 1.5rem',
                    borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 + 0.3, duration: 0.6 }}
                >
                  <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1.75rem', fontWeight: 700, color: '#e10600', lineHeight: 1 }}>
                    {stat.value}
                    {stat.unit && (
                      <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginLeft: '0.4rem', fontWeight: 500, letterSpacing: '0.1em' }}>{stat.unit}</span>
                    )}
                  </div>
                  <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginTop: '0.5rem' }}>
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* FEATURES SECTION */}
      <section style={{ position: 'relative', zIndex: 10, padding: '6rem 2rem' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
          <motion.div
            style={{ textAlign: 'center', marginBottom: '4rem' }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className="section-subtitle">What Awaits</span>
            <h2 className="section-title" style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)', marginTop: '1rem', marginBottom: '1rem' }}>
              Built for <span style={{ color: '#e10600' }}>Champions</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.875rem', maxWidth: '28rem', margin: '0 auto', lineHeight: 1.7 }}>
              Engineered from the ground up for the ultimate racing experience.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
            {[
              {
                icon: '⚡',
                title: 'Endless Circuits',
                desc: 'Procedurally generated tracks that never repeat. Every race is unique.',
              },
              {
                icon: '🏎️',
                title: 'Premium Machines',
                desc: 'Unlock and customize legendary Formula cars with authentic performance.',
              },
              {
                icon: '🏆',
                title: 'Global Rankings',
                desc: 'Compete against racers worldwide. Climb the leaderboard to glory.',
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                className="glass"
                style={{ borderRadius: '0.75rem', padding: '2.5rem 2rem', textAlign: 'center', cursor: 'default' }}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                whileHover={{ y: -5, transition: { duration: 0.3 } }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '1.25rem' }}>
                  {feature.icon}
                </div>
                <h3 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.875rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                  {feature.title}
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.875rem', lineHeight: 1.7 }}>
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section style={{ position: 'relative', zIndex: 10, padding: '4rem 2rem' }}>
        <motion.div
          style={{ maxWidth: '56rem', margin: '0 auto', textAlign: 'center' }}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="glass" style={{ borderRadius: '1rem', padding: '4rem 3rem', position: 'relative', overflow: 'hidden' }}>
            {/* Background glow */}
            <div
              style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translate(-50%, -50%)',
                width: '500px', height: '300px', borderRadius: '50%', pointerEvents: 'none',
                background: 'radial-gradient(circle, rgba(225,6,0,0.1) 0%, transparent 70%)',
              }}
            />
            <span className="section-subtitle">Ready?</span>
            <h2 className="section-title" style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)', marginTop: '1rem', marginBottom: '1.25rem' }}>
              Lights Out and <span style={{ color: '#e10600' }}>Away We Go</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.875rem', maxWidth: '30rem', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
              The grid is set. The engines are roaring. Take your position and prove you belong among the legends.
            </p>
            <Link to="/game" className="btn-primary">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Launch Race
            </Link>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  )
}
