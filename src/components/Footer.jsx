import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={{ position: 'relative', zIndex: 10, borderTop: '1px solid rgba(255,255,255,0.05)', background: '#080808' }}>
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '3rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2.5rem' }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ width: '1.5rem', height: '1.5rem', border: '2px solid #e10600', transform: 'rotate(45deg)' }} />
              <span style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.2em' }}>
                APEX <span style={{ color: '#e10600' }}>VELOCITY</span>
              </span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', lineHeight: 1.7 }}>
              The ultimate Formula-inspired racing experience. Built for speed. Designed for glory.
            </p>
          </div>

          {/* Navigate */}
          <div>
            <h4 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '1rem' }}>
              Navigate
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {['/', '/garage', '/game', '/leaderboard'].map((path) => (
                <Link
                  key={path}
                  to={path}
                  style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', textDecoration: 'none', transition: 'color 0.3s' }}
                >
                  {path === '/' ? 'Home' : path.slice(1).charAt(0).toUpperCase() + path.slice(2)}
                </Link>
              ))}
            </div>
          </div>

          {/* More */}
          <div>
            <h4 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '1rem' }}>
              More
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {['/about', '/results'].map((path) => (
                <Link
                  key={path}
                  to={path}
                  style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', textDecoration: 'none', transition: 'color 0.3s' }}
                >
                  {path.slice(1).charAt(0).toUpperCase() + path.slice(2)}
                </Link>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div>
            <h4 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '1rem' }}>
              Stats
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <span style={{ fontFamily: 'Orbitron, sans-serif', color: '#e10600', fontWeight: 700, fontSize: '1.1rem' }}>v1.0</span>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', marginTop: '0.25rem' }}>Current Build</p>
              </div>
              <div>
                <span style={{ fontFamily: 'Orbitron, sans-serif', color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: '1.1rem' }}>∞</span>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', marginTop: '0.25rem' }}>Endless Tracks</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.65rem', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.15em' }}>
            © 2026 APEX VELOCITY. ALL RIGHTS RESERVED.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: '#e10600', animation: 'pulse-red 2s infinite' }} />
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.15em' }}>
              SYSTEMS ONLINE
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
