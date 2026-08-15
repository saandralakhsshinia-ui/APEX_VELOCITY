import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ParticleBackground from '../components/ParticleBackground'

/* ──────────────────────────────────────────────
   SKINS / VEHICLES CONFIGURATION (6 UNIQUE CARS)
   ────────────────────────────────────────────── */
const skins = [
  {
    id: 'apex',
    carNumber: '01',
    name: 'Apex R1',
    character: 'God of Thunder Hypercar Specs',
    manufacturer: 'Apex Racing Division',
    primary: '#e10600',
    secondary: '#ff3838',
    accent: '#990400',
    ambient: 'rgba(225, 6, 0, 0.14)',
    ambientStrong: 'rgba(225, 6, 0, 0.28)',
    gradient: 'linear-gradient(135deg, #e10600 0%, #990400 100%)',
    topSpeed: '365 KM/H',
    acceleration: '1.4s',
    weight: '740 KG',
    downforce: '2,200 N',
    powerUnit: 'Thunderstrike Arc-Ion V12 (1,450 HP)',
    gearbox: '9-Speed Seamless Electro-Shift',
    stats: [
      { label: 'Top Speed', value: 99 },
      { label: 'Acceleration', value: 98 },
      { label: 'Handling', value: 96 },
      { label: 'Downforce', value: 97 },
      { label: 'Weight', value: 95 },
      { label: 'Braking', value: 96 },
    ],
  },
  {
    id: 'phantom',
    carNumber: '02',
    name: 'Thor Mjölnir',
    character: 'God of Thunder / Lightning Hypercar',
    manufacturer: 'Asgardian Thunder Skunkworks',
    primary: '#00d4ff',
    secondary: '#ffd700',
    accent: '#0f172a',
    ambient: 'rgba(0, 212, 255, 0.25)',
    ambientStrong: 'rgba(0, 212, 255, 0.45)',
    gradient: 'linear-gradient(135deg, #00d4ff 0%, #0f172a 100%)',
    topSpeed: '365 KM/H',
    acceleration: '1.4s',
    weight: '740 KG',
    downforce: '2,200 N',
    powerUnit: 'Thunderstrike Arc-Ion V12 (1,450 HP)',
    gearbox: '9-Speed Electro-Shift',
    stats: [
      { label: 'Top Speed', value: 99 },
      { label: 'Acceleration', value: 98 },
      { label: 'Handling', value: 96 },
      { label: 'Downforce', value: 97 },
      { label: 'Weight', value: 95 },
      { label: 'Braking', value: 96 },
    ],
  },
  {
    id: 'tempest',
    carNumber: '03',
    name: 'Tempest R',
    character: 'God of Thunder Hypercar Specs',
    manufacturer: 'Tempest Motorsport',
    primary: '#00e5a3',
    secondary: '#33ffc2',
    accent: '#009966',
    ambient: 'rgba(0, 229, 163, 0.14)',
    ambientStrong: 'rgba(0, 229, 163, 0.28)',
    gradient: 'linear-gradient(135deg, #00e5a3 0%, #009966 100%)',
    topSpeed: '365 KM/H',
    acceleration: '1.4s',
    weight: '740 KG',
    downforce: '2,200 N',
    powerUnit: 'Thunderstrike Arc-Ion V12 (1,450 HP)',
    gearbox: '9-Speed Paddle Electro-Shift',
    stats: [
      { label: 'Top Speed', value: 99 },
      { label: 'Acceleration', value: 98 },
      { label: 'Handling', value: 96 },
      { label: 'Downforce', value: 97 },
      { label: 'Weight', value: 95 },
      { label: 'Braking', value: 96 },
    ],
  },
  {
    id: 'titan',
    carNumber: '04',
    name: 'Titan RS',
    character: 'God of Thunder Hypercar Specs',
    manufacturer: 'Titan Heavy Engineering',
    primary: '#e8e8ec',
    secondary: '#ffffff',
    accent: '#888892',
    ambient: 'rgba(220, 225, 240, 0.14)',
    ambientStrong: 'rgba(220, 225, 240, 0.28)',
    gradient: 'linear-gradient(135deg, #e8e8ec 0%, #888892 100%)',
    topSpeed: '365 KM/H',
    acceleration: '1.4s',
    weight: '740 KG',
    downforce: '2,200 N',
    powerUnit: 'Thunderstrike Arc-Ion V12 (1,450 HP)',
    gearbox: '9-Speed Heavy-Duty Electro-Shift',
    stats: [
      { label: 'Top Speed', value: 99 },
      { label: 'Acceleration', value: 98 },
      { label: 'Handling', value: 96 },
      { label: 'Downforce', value: 97 },
      { label: 'Weight', value: 95 },
      { label: 'Braking', value: 96 },
    ],
  },
  {
    id: 'vortex',
    carNumber: '05',
    name: 'Vortex GT',
    character: 'God of Thunder Hypercar Specs',
    manufacturer: 'Vortex Dynamics',
    primary: '#ff5500',
    secondary: '#ff8833',
    accent: '#aa3300',
    ambient: 'rgba(255, 85, 0, 0.14)',
    ambientStrong: 'rgba(255, 85, 0, 0.28)',
    gradient: 'linear-gradient(135deg, #ff5500 0%, #aa3300 100%)',
    topSpeed: '365 KM/H',
    acceleration: '1.4s',
    weight: '740 KG',
    downforce: '2,200 N',
    powerUnit: 'Thunderstrike Arc-Ion V12 (1,450 HP)',
    gearbox: '9-Speed Quickshift Electro-Shift',
    stats: [
      { label: 'Top Speed', value: 99 },
      { label: 'Acceleration', value: 98 },
      { label: 'Handling', value: 96 },
      { label: 'Downforce', value: 97 },
      { label: 'Weight', value: 95 },
      { label: 'Braking', value: 96 },
    ],
  },
]

/* ──────────────────────────────────────────────
   SHARED SVG DEFS — gradients, filters, patterns
   ────────────────────────────────────────────── */
function SvgDefs({ skin, uid }) {
  return (
    <defs>
      {/* 5-stop metallic studio body gradient */}
      <linearGradient id={`bodyGrad-${uid}`} x1="0%" y1="0%" x2="100%" y2="85%">
        <stop offset="0%" stopColor={skin.secondary} />
        <stop offset="25%" stopColor={skin.primary} />
        <stop offset="60%" stopColor={skin.primary} />
        <stop offset="85%" stopColor={skin.accent} />
        <stop offset="100%" stopColor="#08080c" />
      </linearGradient>

      {/* Gloss reflection specular highlight curve */}
      <linearGradient id={`specularGrad-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
        <stop offset="35%" stopColor="rgba(255,255,255,0.12)" />
        <stop offset="65%" stopColor="rgba(255,255,255,0)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0.35)" />
      </linearGradient>

      {/* Dark aerodynamic carbon accent */}
      <linearGradient id={`darkAccent-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#242630" />
        <stop offset="50%" stopColor="#14151b" />
        <stop offset="100%" stopColor="#08090d" />
      </linearGradient>

      {/* Tire gradient */}
      <radialGradient id={`tireGrad-${uid}`} cx="48%" cy="46%" r="52%">
        <stop offset="0%" stopColor="#32343c" />
        <stop offset="70%" stopColor="#141519" />
        <stop offset="100%" stopColor="#090a0d" />
      </radialGradient>

      {/* Rim metallic gradient */}
      <radialGradient id={`rimGrad-${uid}`} cx="40%" cy="40%" r="55%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="40%" stopColor="#c5c8d2" />
        <stop offset="80%" stopColor="#686b76" />
        <stop offset="100%" stopColor="#25272e" />
      </radialGradient>

      {/* Brake rotor ceramic disc */}
      <radialGradient id={`rotorGrad-${uid}`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#555862" />
        <stop offset="65%" stopColor="#8c909c" />
        <stop offset="85%" stopColor="#b4b8c5" />
        <stop offset="100%" stopColor="#484b54" />
      </radialGradient>

      {/* High-res Carbon Fiber pattern */}
      <pattern id={`carbonFiber-${uid}`} x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
        <rect width="6" height="6" fill="#121318" />
        <rect width="3" height="3" fill="#1e2029" />
        <rect x="3" y="3" width="3" height="3" fill="#1e2029" />
        <line x1="0" y1="0" x2="6" y2="6" stroke="#0a0a0e" strokeWidth="0.6" />
      </pattern>

      {/* Metallic chrome sheen */}
      <linearGradient id={`metalSheen-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="rgba(255,255,255,0)" />
        <stop offset="42%" stopColor="rgba(255,255,255,0.06)" />
        <stop offset="50%" stopColor="rgba(255,255,255,0.28)" />
        <stop offset="58%" stopColor="rgba(255,255,255,0.08)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
      </linearGradient>

      {/* Tinted cockpit glass with horizon reflection */}
      <linearGradient id={`cockpitGlass-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="rgba(180,225,255,0.42)" />
        <stop offset="45%" stopColor="rgba(60,130,220,0.28)" />
        <stop offset="70%" stopColor="rgba(10,24,50,0.85)" />
        <stop offset="100%" stopColor="rgba(4,10,22,0.95)" />
      </linearGradient>

      {/* Glow filters */}
      <filter id={`glow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  )
}

/* Helper: draw an ultra-detailed racing wheel with brake caliper & rotor */
function Wheel({ cx, cy, r, skin, uid }) {
  const ir = r * 0.52
  const rr = r * 0.38
  return (
    <g>
      {/* Tire rubber */}
      <circle cx={cx} cy={cy} r={r} fill={`url(#tireGrad-${uid})`} />
      <circle cx={cx} cy={cy} r={r - 2} fill="none" stroke="#22252e" strokeWidth="2.5" />
      <circle cx={cx} cy={cy} r={r - 5} fill="none" stroke="#16181f" strokeWidth="2" strokeDasharray="6 3.5" />

      {/* Brake rotor ceramic disc */}
      <circle cx={cx} cy={cy} r={rr} fill={`url(#rotorGrad-${uid})`} stroke="#333742" strokeWidth="1" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
        <circle
          key={deg}
          cx={cx + (rr - 4) * Math.cos((deg * Math.PI) / 180)}
          cy={cy + (rr - 4) * Math.sin((deg * Math.PI) / 180)}
          r={1.2}
          fill="#1c1d22"
        />
      ))}

      {/* Racing brake caliper (Brembo style with livery color) */}
      <path
        d={`M ${cx - rr * 0.9} ${cy - rr * 0.75} A ${rr} ${rr} 0 0 1 ${cx - rr * 0.2} ${cy - rr * 0.95} L ${cx - rr * 0.3} ${cy - rr * 0.55} A ${rr * 0.65} ${rr * 0.65} 0 0 0 ${cx - rr * 0.75} ${cy - rr * 0.45} Z`}
        fill={skin.primary}
        stroke="#ffffff"
        strokeWidth="0.6"
      />

      {/* Alloy rim barrel & lip */}
      <circle cx={cx} cy={cy} r={ir} fill={`url(#rimGrad-${uid})`} />
      <circle cx={cx} cy={cy} r={ir - 1.8} fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.65" />

      {/* Multi-spoke alloy geometry */}
      {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map(a => (
        <line
          key={a}
          x1={cx}
          y1={cy}
          x2={cx + (ir - 3.5) * Math.cos((a * Math.PI) / 180)}
          y2={cy + (ir - 3.5) * Math.sin((a * Math.PI) / 180)}
          stroke="#424550"
          strokeWidth="2.2"
        />
      ))}
      {[0, 72, 144, 216, 288].map(a => (
        <line
          key={`hi-${a}`}
          x1={cx}
          y1={cy}
          x2={cx + (ir - 3.5) * Math.cos((a * Math.PI) / 180)}
          y2={cy + (ir - 3.5) * Math.sin((a * Math.PI) / 180)}
          stroke="#ffffff"
          strokeWidth="1.2"
          opacity="0.8"
        />
      ))}

      {/* Center hub & titanium lug nut */}
      <circle cx={cx} cy={cy} r={r * 0.16} fill="#14161c" stroke="#555866" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={r * 0.10} fill={skin.primary} />
      <circle cx={cx} cy={cy} r={r * 0.05} fill="#ffcc00" />
    </g>
  )
}

/* ──────────────────────────────────────────────
   CAR 01 — Apex R1: Classic Open-Wheel F1 Car
   ────────────────────────────────────────────── */
function CarApex({ skin, className, style }) {
  const u = 'apex'
  return (
    <svg viewBox="0 0 900 280" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-label="Apex R1 F1 Car">
      <SvgDefs skin={skin} uid={u} />

      {/* PODIUM GROUND SHADOW */}
      <ellipse cx="480" cy="225" rx="380" ry="14" fill="rgba(0,0,0,0.55)" />
      <ellipse cx="480" cy="222" rx="320" ry="8" fill={skin.primary} opacity="0.18" filter={`url(#glow-${u})`} />

      {/* CARBON FLOOR & UNDERBODY DIFFUSER */}
      <path d="M150 154 L260 158 L480 168 L620 160 L780 145 L780 152 L620 166 L480 176 L260 166 L150 162 Z" fill={`url(#carbonFiber-${u})`} />
      <rect x="145" y="160" width="30" height="4" fill="#08080c" />

      {/* REAR WING ASSEMBLY */}
      <g>
        <rect x="114" y="68" width="7" height="74" rx="1.5" fill={`url(#darkAccent-${u})`} />
        <rect x="166" y="68" width="7" height="74" rx="1.5" fill={`url(#darkAccent-${u})`} />
        {/* Main upper wing plane */}
        <path d="M110 72 L178 72 L175 64 L114 64 Z" fill={`url(#bodyGrad-${u})`} />
        {/* Secondary DRS flap */}
        <path d="M108 84 L180 84 L177 76 L111 76 Z" fill={`url(#bodyGrad-${u})`} />
        <rect x="110" y="84" width="70" height="2" fill="#ffffff" opacity="0.4" />
        {/* Endplates */}
        <path d="M106 60 L120 60 L120 144 L106 144 Z" fill={skin.primary} />
        <path d="M172 60 L186 60 L186 144 L172 144 Z" fill={skin.primary} />
        {/* Rain light */}
        <rect x="138" y="152" width="10" height="5" rx="1.5" fill="#ff0033" filter={`url(#glow-${u})`} />
      </g>

      {/* ENGINE COVER & AIRBOX */}
      <path d="M155 140 L168 130 L260 114 L340 112 L480 102 L480 158 L260 158 L168 152 Z" fill={`url(#bodyGrad-${u})`} />
      {/* Shark fin spine */}
      <path d="M260 114 L320 88 L345 88 L340 112 Z" fill={skin.accent} />
      <path d="M270 114 L320 90 L340 90 L335 112 Z" fill="#ffffff" opacity="0.3" />
      {/* Air intake cooling gills */}
      {[0, 1, 2, 3].map(i => (
        <line key={i} x1={200 + i * 14} y1={134 - i * 2} x2={212 + i * 14} y2={128 - i * 2} stroke="#090a0f" strokeWidth="2.5" strokeLinecap="round" />
      ))}

      {/* SIDEPODS WITH AGGRESSIVE UNDERCUT */}
      <path d="M340 106 L480 100 L530 104 L530 162 L480 168 L340 160 Z" fill={`url(#bodyGrad-${u})`} />
      {/* Sidepod air inlet */}
      <path d="M480 100 L520 96 L520 118 L480 122 Z" fill="#090a10" stroke="#252834" strokeWidth="1" />
      <path d="M485 103 L515 100 L515 114 L485 117 Z" fill="#000000" />

      {/* COCKPIT, HALO & DRIVER */}
      <path d="M480 100 L540 90 L590 84 L615 90 L630 102 L630 162 L610 166 L540 164 L480 162 Z" fill={`url(#bodyGrad-${u})`} />
      {/* Halo titanium structure */}
      <path d="M505 104 L528 78 Q552 68 578 74 L602 88 L612 98" fill="none" stroke="#222530" strokeWidth="9" strokeLinecap="round" />
      <path d="M505 104 L528 78 Q552 68 578 74 L602 88 L612 98" fill="none" stroke="#3a3e4e" strokeWidth="6" strokeLinecap="round" />
      <path d="M515 102 L535 84 Q555 76 575 80 L595 92 L605 102" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />
      {/* Cockpit opening & Helmet */}
      <ellipse cx="565" cy="94" rx="16" ry="14" fill="#08090e" />
      <circle cx="565" cy="92" r="12" fill="#ffffff" />
      <path d="M555 90 Q565 85 575 90 L573 96 Q565 92 557 96 Z" fill="#181a24" />
      <path d="M557 91 Q565 87 573 91" stroke={skin.primary} strokeWidth="2" fill="none" />

      {/* SLEEK TAPERED NOSE CONE */}
      <path d="M630 104 L730 114 L790 124 L820 132 L820 138 L790 140 L730 138 L630 156 Z" fill={`url(#bodyGrad-${u})`} />
      <path d="M790 124 L840 132 L840 136 L790 140 Z" fill={skin.accent} />
      <path d="M640 110 L780 124" stroke="#ffffff" strokeWidth="1.2" opacity="0.35" />

      {/* MULTI-ELEMENT FRONT WING */}
      <path d="M790 146 L880 156 L880 164 L790 154 Z" fill={`url(#bodyGrad-${u})`} />
      <path d="M800 152 L885 162 L885 168 L800 158 Z" fill={skin.accent} />
      <path d="M805 156 L888 166 L888 172 L805 162 Z" fill="#0d0e14" />
      {/* Front wing endplates */}
      <path d="M872 148 L888 148 L890 176 L874 176 Z" fill={skin.primary} />
      <line x1="873" y1="149" x2="889" y2="149" stroke="#ffffff" strokeWidth="1.5" />

      {/* SUSPENSION WISHBONES */}
      <line x1="165" y1="142" x2="215" y2="156" stroke="#252834" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="165" y1="148" x2="215" y2="182" stroke="#252834" strokeWidth="3" strokeLinecap="round" />
      <line x1="685" y1="138" x2="735" y2="156" stroke="#252834" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="685" y1="146" x2="735" y2="188" stroke="#252834" strokeWidth="3" strokeLinecap="round" />

      {/* WHEELS */}
      <Wheel cx={215} cy={172} r={50} skin={skin} uid={u} />
      <Wheel cx={735} cy={175} r={42} skin={skin} uid={u} />

      {/* SPECULAR SHEEN & LIVERY DETAILS */}
      <path d="M155 140 L168 130 L260 114 L340 112 L480 100 L590 84 L630 104 L730 114 L790 124 L820 132 L820 138 L790 140 L730 138 L630 156 L480 168 L340 160 L260 158 L168 152 Z" fill={`url(#metalSheen-${u})`} opacity="0.55" />
    </svg>
  )
}

/* ──────────────────────────────────────────────
   CAR 02 — Vortex GT: Mid-Engine GT Supercar
   ────────────────────────────────────────────── */
function CarVortex({ skin, className, style }) {
  const u = 'vortex'
  return (
    <svg viewBox="0 0 900 280" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-label="Vortex GT Supercar">
      <SvgDefs skin={skin} uid={u} />

      {/* PODIUM GROUND SHADOW */}
      <ellipse cx="480" cy="228" rx="370" ry="14" fill="rgba(0,0,0,0.55)" />
      <ellipse cx="480" cy="225" rx="300" ry="8" fill={skin.primary} opacity="0.18" filter={`url(#glow-${u})`} />

      {/* CARBON UNDERBODY FLOOR */}
      <path d="M125 178 L825 178 L825 183 L125 183 Z" fill={`url(#carbonFiber-${u})`} />

      {/* MAIN SLEEK GT COUPE BODY */}
      <path d="M125 174 L155 152 L215 126 L295 112 L395 104 L520 102 L625 108 L725 118 L785 132 L818 148 L825 168 L825 178 L125 178 Z" fill={`url(#bodyGrad-${u})`} />

      {/* ROOF / GLASS CANOPY */}
      <path d="M345 112 L395 92 L495 84 L575 88 L620 108 L395 104 Z" fill={`url(#cockpitGlass-${u})`} opacity="0.85" />
      <path d="M360 110 L400 94 Q480 84 560 90 L610 108" fill="none" stroke="#ffffff" strokeWidth="1.2" opacity="0.4" />
      {/* A-pillar & C-pillar */}
      <line x1="360" y1="112" x2="400" y2="94" stroke="#181a24" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="615" y1="108" x2="578" y2="90" stroke="#181a24" strokeWidth="4.5" strokeLinecap="round" />

      {/* SIDE AIR SCOOP & AERO CHANNELS */}
      <path d="M615 112 L665 116 L665 148 L615 142 Z" fill="#090a10" stroke="#252834" strokeWidth="1" />
      <path d="M620 116 L658 119 L658 138 L620 134 Z" fill="#000000" />
      <path d="M220 162 L600 162 L600 165 L220 165 Z" fill="rgba(255,255,255,0.08)" />

      {/* REAR DIFFUSER & ACTIVE SPOILER LIP */}
      <path d="M120 164 L126 156 L180 154 L185 164 Z" fill={skin.primary} />
      <line x1="122" y1="157" x2="183" y2="155" stroke="#ffffff" strokeWidth="1.5" />
      {[0, 1, 2, 3].map(i => (
        <rect key={i} x={125 + i * 14} y="170" width="4" height="8" fill="#08080c" />
      ))}

      {/* ENGINE VENT LOUVRES ON REAR DECK */}
      {[0, 1, 2, 3, 4].map(i => (
        <rect key={i} x={185 + i * 22} y="126" width="15" height="3" rx="1" fill="#0c0d12" stroke="#252834" strokeWidth="0.5" />
      ))}

      {/* LED MATRIX HEADLIGHTS */}
      <path d="M798 140 L822 152 L822 164 L798 152 Z" fill="#ffffff" opacity="0.95" filter={`url(#glow-${u})`} />
      <line x1="799" y1="142" x2="820" y2="153" stroke="#00d4ff" strokeWidth="2" />

      {/* OLED FULL-WIDTH TAILLIGHT BAR */}
      <rect x="124" y="158" width="22" height="4" rx="2" fill="#ff1100" opacity="0.95" filter={`url(#glow-${u})`} />

      {/* SPECULAR SHEEN */}
      <path d="M125 174 L155 152 L215 126 L295 112 L395 104 L520 102 L625 108 L725 118 L785 132 L818 148 L825 168 L825 178 L125 178 Z" fill={`url(#metalSheen-${u})`} opacity="0.5" />

      {/* WHEELS */}
      <Wheel cx={250} cy={185} r={40} skin={skin} uid={u} />
      <Wheel cx={725} cy={185} r={40} skin={skin} uid={u} />
    </svg>
  )
}

/* ──────────────────────────────────────────────
   CAR 03 — Tempest R: Rally / Off-Road Beast
   ────────────────────────────────────────────── */
function CarTempest({ skin, className, style }) {
  const u = 'tempest'
  return (
    <svg viewBox="0 0 900 280" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-label="Tempest R Rally Car">
      <SvgDefs skin={skin} uid={u} />

      {/* PODIUM GROUND SHADOW */}
      <ellipse cx="460" cy="232" rx="340" ry="16" fill="rgba(0,0,0,0.55)" />
      <ellipse cx="460" cy="228" rx="280" ry="8" fill={skin.primary} opacity="0.18" filter={`url(#glow-${u})`} />

      {/* REINFORCED HEAVY BASH PLATE & SKID GUARD */}
      <rect x="160" y="176" width="590" height="6" rx="2" fill="#14151b" stroke="#333742" strokeWidth="1" />

      {/* RAISED MUSCULAR DAKAR RALLY BODY */}
      <path d="M135 170 L155 142 L195 120 L295 108 L415 104 L560 106 L685 112 L775 126 L815 146 L825 166 L825 176 L135 176 Z" fill={`url(#bodyGrad-${u})`} />

      {/* REINFORCED ROLL CAGE THROUGH GLASS */}
      <path d="M375 106 L405 74 L565 74 L585 108 L375 106 Z" fill={`url(#cockpitGlass-${u})`} opacity="0.85" />
      <line x1="395" y1="106" x2="415" y2="76" stroke="#484d5c" strokeWidth="4" strokeLinecap="round" />
      <line x1="555" y1="108" x2="545" y2="76" stroke="#484d5c" strokeWidth="4" strokeLinecap="round" />
      <line x1="415" y1="76" x2="545" y2="76" stroke="#686e82" strokeWidth="3" strokeLinecap="round" />

      {/* ROOF RALLY LIGHT POD BAR (4 ULTRA BRIGHT LEDS) */}
      <rect x="405" y="66" width="155" height="7" rx="2.5" fill="#181a22" stroke="#3a3e4e" strokeWidth="1" />
      {[0, 1, 2, 3].map(i => (
        <circle key={i} cx={425 + i * 38} cy={69.5} r={5} fill="#ffffff" filter={`url(#glow-${u})`} />
      ))}

      {/* DUAL REAR MUDFLAPS */}
      <rect x="140" y="172" width="12" height="22" rx="1.5" fill="#0c0d12" />

      {/* HIGH-MOUNT DAKAR TAIL SPOILER */}
      <path d="M125 125 L180 120 L178 114 L122 118 Z" fill={`url(#bodyGrad-${u})`} />
      <line x1="124" y1="119" x2="179" y2="115" stroke="#ffffff" strokeWidth="1.5" />

      {/* REINFORCED TOW HOOKS */}
      <circle cx="828" cy="172" r={4} fill="none" stroke="#ff3300" strokeWidth="2" />

      {/* OFF-ROAD QUAD LED HEADLIGHTS */}
      <rect x="805" y="138" width="14" height="10" rx="2" fill="#ffffff" opacity="0.95" filter={`url(#glow-${u})`} />
      <rect x="806" y="140" width="6" height="6" rx="1" fill="#ffdd00" opacity="0.9" />

      {/* REAR LED TAILLIGHT */}
      <rect x="134" y="152" width="10" height="12" rx="2" fill="#ff1100" opacity="0.95" filter={`url(#glow-${u})`} />

      {/* SPECULAR SHEEN */}
      <path d="M135 170 L155 142 L195 120 L295 108 L415 104 L560 106 L685 112 L775 126 L815 146 L825 166 L825 176 L135 176 Z" fill={`url(#metalSheen-${u})`} opacity="0.4" />

      {/* WHEELS */}
      <Wheel cx={235} cy={184} r={46} skin={skin} uid={u} />
      <Wheel cx={730} cy={184} r={46} skin={skin} uid={u} />
    </svg>
  )
}

/* ──────────────────────────────────────────────
   CAR 05 — Titan RS: Heavy Muscle / Touring Car
   ────────────────────────────────────────────── */
function CarTitan({ skin, className, style }) {
  const u = 'titan'
  return (
    <svg viewBox="0 0 900 280" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-label="Titan RS Muscle Car">
      <SvgDefs skin={skin} uid={u} />

      {/* PODIUM GROUND SHADOW */}
      <ellipse cx="480" cy="232" rx="360" ry="15" fill="rgba(0,0,0,0.55)" />
      <ellipse cx="480" cy="228" rx="290" ry="8" fill={skin.primary} opacity="0.18" filter={`url(#glow-${u})`} />

      {/* CARBON CHASSIS UNDERFLOOR */}
      <path d="M115 178 L845 178 L845 184 L115 184 Z" fill={`url(#carbonFiber-${u})`} />

      {/* WIDEBODY AGGRESSIVE MUSCLE CAR BODY */}
      <path d="M115 174 L125 152 L145 132 L215 114 L345 106 L550 104 L705 108 L795 120 L835 142 L845 164 L845 178 L115 178 Z" fill={`url(#bodyGrad-${u})`} />

      {/* AGGRESSIVE HOOD POWER BULGE & VENTS */}
      <path d="M575 104 L605 90 L695 90 L715 108 Z" fill={`url(#darkAccent-${u})`} />
      <rect x="615" y="93" width="65" height="4" rx="1" fill={skin.primary} />
      <line x1="616" y1="94" x2="679" y2="94" stroke="#ffffff" strokeWidth="1" opacity="0.5" />

      {/* SQUARED FASTBACK WINDSHIELD & REAR WINDOW */}
      <path d="M395 106 L425 80 L560 78 L578 104 L395 106 Z" fill={`url(#cockpitGlass-${u})`} opacity="0.85" />
      <path d="M275 112 L315 90 L395 86 L395 106 L275 112 Z" fill={`url(#cockpitGlass-${u})`} opacity="0.75" />
      <line x1="405" y1="106" x2="430" y2="82" stroke="#1d202c" strokeWidth="4" strokeLinecap="round" />
      <line x1="572" y1="104" x2="554" y2="80" stroke="#1d202c" strokeWidth="4" strokeLinecap="round" />

      {/* MASSIVE GT3 REAR RACING WING */}
      <rect x="100" y="112" width="9" height="48" rx="2" fill="#1a1c24" stroke="#353948" strokeWidth="1" />
      <rect x="160" y="112" width="9" height="48" rx="2" fill="#1a1c24" stroke="#353948" strokeWidth="1" />
      <path d="M92 110 L176 110 L174 102 L94 102 Z" fill={`url(#bodyGrad-${u})`} />
      <path d="M90 118 L178 118 L176 112 L92 112 Z" fill={skin.accent} />
      <line x1="93" y1="110" x2="175" y2="110" stroke="#ffffff" strokeWidth="1.5" />

      {/* DUAL CHROME EXHAUST TIPS */}
      <circle cx="120" cy="172" r="6" fill="#444754" stroke="#ffffff" strokeWidth="1" />
      <circle cx="120" cy="172" r="4.2" fill="#08080c" />
      <circle cx="136" cy="172" r="6" fill="#444754" stroke="#ffffff" strokeWidth="1" />
      <circle cx="136" cy="172" r="4.2" fill="#08080c" />

      {/* DUAL LED HEADLIGHT CLUSTERS */}
      <rect x="832" y="144" width="10" height="15" rx="2.5" fill="#ffffff" opacity="0.95" filter={`url(#glow-${u})`} />
      <rect x="830" y="146" width="5" height="11" rx="1.5" fill="#00d4ff" opacity="0.85" />

      {/* WIDE HORIZONTAL OLED TAILLIGHT BAR */}
      <rect x="114" y="154" width="48" height="6" rx="2" fill="#ff1100" opacity="0.95" filter={`url(#glow-${u})`} />

      {/* SPECULAR SHEEN */}
      <path d="M115 174 L125 152 L145 132 L215 114 L345 106 L550 104 L705 108 L795 120 L835 142 L845 164 L845 178 L115 178 Z" fill={`url(#metalSheen-${u})`} opacity="0.45" />

      {/* WHEELS */}
      <Wheel cx={240} cy={188} r={46} skin={skin} uid={u} />
      <Wheel cx={740} cy={188} r={46} skin={skin} uid={u} />
    </svg>
  )
}

/* ──────────────────────────────────────────────
   CAR 06 — Thor Mjölnir: God of Thunder / Lightning Hypercar
   ────────────────────────────────────────────── */
function CarPhantom({ skin, className, style }) {
  const u = 'phantom'
  return (
    <svg viewBox="0 0 900 280" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-label="Thor Mjölnir Thunder Hypercar">
      <SvgDefs skin={skin} uid={u} />

      {/* PODIUM GROUND SHADOW & ELECTRIC LIGHTNING CYAN GLOW */}
      <ellipse cx="480" cy="226" rx="370" ry="14" fill="rgba(0,0,0,0.55)" />
      <ellipse cx="480" cy="223" rx="310" ry="8" fill="#00d4ff" opacity="0.45" filter={`url(#glow-${u})`} />

      {/* ASGARDIAN TITANIUM & GOLD LOWER ARMOR */}
      <path d="M150 178 L800 178 L800 184 L150 184 Z" fill={`url(#carbonFiber-${u})`} />
      <line x1="160" y1="181" x2="790" y2="181" stroke="#ffd700" strokeWidth="2" />

      {/* MJÖLNIR HAMMER FORGED NOSE & CHASSIS SILHOUETTE */}
      <path d="M150 172 L165 146 L210 120 L300 104 L440 94 L580 94 L690 104 L780 120 L830 144 L835 168 L800 176 L150 176 Z" fill={`url(#bodyGrad-${u})`} />

      {/* ASGARDIAN LIGHTNING FANG FRONT SPLITTER */}
      <path d="M760 176 L845 176 L835 158 L780 158 Z" fill="#080d1a" />
      <line x1="780" y1="160" x2="842" y2="176" stroke="#00d4ff" strokeWidth="3" filter={`url(#glow-${u})`} />
      <polygon points="835,160 848,168 835,176" fill="#ffd700" />

      {/* CRACKLING LIGHTNING ARCS & RUNES ON SIDE FLANKS */}
      <path d="M330 132 L400 124 L430 134 L520 122 L550 132 L640 124 L680 142 L640 146 L550 138 L520 148 L430 138 L400 148 Z" fill="#031528" stroke="#00d4ff" strokeWidth="1.5" />
      {/* Glowing Lightning Bolt Ribbon */}
      <path d="M360 136 L430 128 L460 138 L540 126 L570 136 L660 130" fill="none" stroke="#00d4ff" strokeWidth="2.5" filter={`url(#glow-${u})`} />
      <path d="M360 136 L430 128 L460 138 L540 126 L570 136 L660 130" fill="none" stroke="#ffffff" strokeWidth="1.2" />

      {/* VALKYRIE SWEPT AERO WINGS WITH GOLDEN RUNES */}
      <path d="M130 114 L150 72 L210 70 L200 124 Z" fill={`url(#bodyGrad-${u})`} />
      <line x1="150" y1="72" x2="210" y2="70" stroke="#ffd700" strokeWidth="3" />
      <rect x="196" y="72" width="4" height="42" fill="#00d4ff" filter={`url(#glow-${u})`} />

      {/* ASGARDIAN CRYSTAL DOME COCKPIT WITH GOLDEN ARCH */}
      <path d="M390 98 L440 70 Q520 58 595 68 L650 96 L390 98 Z" fill={`url(#cockpitGlass-${u})`} opacity="0.94" />
      <path d="M405 96 L445 74 Q515 64 585 74 L640 96" fill="none" stroke="#ffd700" strokeWidth="1.8" opacity="0.75" />
      {/* Thunder Arc Gold Canopy Frame */}
      <line x1="645" y1="96" x2="595" y2="68" stroke="#ffd700" strokeWidth="4.5" strokeLinecap="round" filter={`url(#glow-${u})`} />
      <line x1="395" y1="98" x2="445" y2="70" stroke="#0a192f" strokeWidth="4.5" strokeLinecap="round" />

      {/* DUAL SPEAR LASER HEADLIGHTS (LIGHTNING CYAN + GOLD) */}
      <polygon points="785,130 825,142 825,152 785,142" fill="#ffffff" opacity="0.95" filter={`url(#glow-${u})`} />
      <line x1="786" y1="132" x2="823" y2="144" stroke="#00d4ff" strokeWidth="3.5" filter={`url(#glow-${u})`} />
      <circle cx="820" cy="144" r="3" fill="#ffd700" />

      {/* TWIN MJÖLNIR THUNDER EXHAUST THRUSTERS */}
      <circle cx="145" cy="152" r="8" fill="#091b2c" stroke="#ffd700" strokeWidth="1.8" />
      <circle cx="145" cy="152" r="5" fill="#00d4ff" filter={`url(#glow-${u})`} />
      <circle cx="145" cy="152" r="2.5" fill="#ffffff" />
      <circle cx="165" cy="152" r="8" fill="#091b2c" stroke="#ffd700" strokeWidth="1.8" />
      <circle cx="165" cy="152" r="5" fill="#00d4ff" filter={`url(#glow-${u})`} />
      <circle cx="165" cy="152" r="2.5" fill="#ffffff" />

      {/* LIGHTNING CYAN UNDERGLOW ACCENT */}
      <line x1="260" y1="174" x2="720" y2="174" stroke="#00d4ff" strokeWidth="3.5" opacity="0.95" filter={`url(#glow-${u})`} />

      {/* SPECULAR SHEEN */}
      <path d="M150 172 L165 146 L210 120 L300 104 L440 94 L580 94 L690 104 L780 120 L830 144 L835 168 L800 176 L150 176 Z" fill={`url(#metalSheen-${u})`} opacity="0.45" />

      {/* HAMMER FORGED ALLOY WHEELS WITH GOLD NUT */}
      <Wheel cx={250} cy={184} r={42} skin={skin} uid={u} />
      <Wheel cx={720} cy={184} r={42} skin={skin} uid={u} />
    </svg>
  )
}

/* ──────────────────────────────────────────────
   CAR RENDERER — picks the right SVG by skin.id
   ────────────────────────────────────────────── */
const CAR_MAP = {
  apex: CarApex,
  vortex: CarVortex,
  tempest: CarTempest,
  titan: CarTitan,
  phantom: CarPhantom,
}
function RacingCar({ skin, className, style }) {
  const Component = CAR_MAP[skin.id] || CarApex
  return <Component skin={skin} className={className} style={style} />
}

/* ──────────────────────────────────────────────
   SHOWROOM FLOATING PARTICLES
   ────────────────────────────────────────────── */
function ShowroomParticles({ color }) {
  const particles = useRef(
    Array.from({ length: 30 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 8 + 6,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.3 + 0.05,
    }))
  ).current

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 2 }}>
      {particles.map((p, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: i % 4 === 0 ? color : 'rgba(255,255,255,0.5)',
          }}
          animate={{
            y: [0, -40, -80, -40, 0],
            x: [0, 15, -10, 20, 0],
            opacity: [0, p.opacity, p.opacity * 0.6, p.opacity, 0],
            scale: [0.5, 1, 1.2, 1, 0.5],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

/* ──────────────────────────────────────────────
   ANIMATED STAT BAR
   ────────────────────────────────────────────── */
function StatBar({ label, value, color, delay = 0 }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.4rem',
      }}>
        <span style={{
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '0.6rem',
          letterSpacing: '0.15em',
          color: 'rgba(255,255,255,0.4)',
          textTransform: 'uppercase',
        }}>{label}</span>
        <span style={{
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '0.7rem',
          letterSpacing: '0.1em',
          color: 'rgba(255,255,255,0.7)',
          fontWeight: 600,
        }}>{value}</span>
      </div>
      <div style={{
        height: '4px',
        background: 'rgba(255,255,255,0.06)',
        borderRadius: '2px',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <motion.div
          style={{
            height: '100%',
            borderRadius: '2px',
            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
            boxShadow: `0 0 10px ${color}40, 0 0 20px ${color}20`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.2, delay: delay * 0.1 + 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────
   SPEC ROW
   ────────────────────────────────────────────── */
function SpecRow({ label, value, unit }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      padding: '0.6rem 0',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <span style={{
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '0.55rem',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.35)',
      }}>{label}</span>
      <span style={{
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '0.75rem',
        fontWeight: 700,
        color: 'rgba(255,255,255,0.8)',
        letterSpacing: '0.05em',
      }}>
        {value}
        {unit && <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', marginLeft: '0.3rem', fontWeight: 500 }}>{unit}</span>}
      </span>
    </div>
  )
}

/* ──────────────────────────────────────────────
   GARAGE PAGE
   ────────────────────────────────────────────── */
export default function Garage() {
  const navigate = useNavigate()
  const [skinIndex, setSkinIndex] = useState(() => {
    try {
      const saved = localStorage.getItem('selectedSkin')
      if (saved) {
        const parsed = JSON.parse(saved)
        const idx = skins.findIndex((s) => s.id === parsed.id)
        if (idx !== -1) return idx
      }
    } catch { /* ignore */ }
    return 0
  })
  const [direction, setDirection] = useState(0)
  const [cameraOffset, setCameraOffset] = useState({ x: 0, y: 0 })
  const skin = skins[skinIndex]

  // Auto-persist selected skin whenever skinIndex changes
  useEffect(() => {
    try {
      localStorage.setItem('selectedSkin', JSON.stringify(skins[skinIndex]))
    } catch { /* ignore */ }
  }, [skinIndex])

  const handleSelectAndRace = () => {
    try {
      localStorage.setItem('selectedSkin', JSON.stringify(skin))
    } catch { /* ignore */ }
    navigate('/game')
  }

  const handleSelectAndHome = () => {
    try {
      localStorage.setItem('selectedSkin', JSON.stringify(skin))
    } catch { /* ignore */ }
    navigate('/')
  }

  const nextSkin = useCallback(() => {
    setDirection(1)
    setSkinIndex((prev) => (prev + 1) % skins.length)
  }, [])

  const prevSkin = useCallback(() => {
    setDirection(-1)
    setSkinIndex((prev) => (prev - 1 + skins.length) % skins.length)
  }, [])

  // Slow cinematic camera drift
  useEffect(() => {
    let frame
    let t = 0
    const drift = () => {
      t += 0.003
      setCameraOffset({
        x: Math.sin(t * 0.7) * 12,
        y: Math.cos(t * 0.5) * 6,
      })
      frame = requestAnimationFrame(drift)
    }
    drift()
    return () => cancelAnimationFrame(frame)
  }, [])

  // Slight camera shift on skin change
  const [cameraKick, setCameraKick] = useState({ x: 0, y: 0 })
  useEffect(() => {
    setCameraKick({ x: direction * 15, y: -5 })
    const timeout = setTimeout(() => setCameraKick({ x: 0, y: 0 }), 400)
    return () => clearTimeout(timeout)
  }, [skinIndex, direction])

  return (
    <div className="page-container carbon-bg" style={{ overflow: 'hidden' }}>
      <ParticleBackground />
      <Navbar />

      {/* ──── SHOWROOM ──── */}
      <section style={{
        position: 'relative',
        zIndex: 10,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '7rem',
        paddingBottom: '2rem',
      }}>

        {/* AMBIENT LIGHTING */}
        <motion.div
          style={{
            position: 'absolute',
            top: '5%',
            left: '50%',
            width: '800px',
            height: '800px',
            borderRadius: '50%',
            pointerEvents: 'none',
            zIndex: 0,
            transform: 'translateX(-50%)',
          }}
          animate={{
            background: `radial-gradient(circle, ${skin.ambientStrong} 0%, ${skin.ambient} 30%, transparent 70%)`,
            scale: [1, 1.08, 1],
          }}
          transition={{
            background: { duration: 0.8, ease: 'easeInOut' },
            scale: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
          }}
        />

        {/* SPOTLIGHT FROM ABOVE */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '500px',
          height: '600px',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 1,
        }} />

        {/* FLOATING PARTICLES */}
        <ShowroomParticles color={skin.primary} />

        {/* HEADER */}
        <motion.div
          style={{ textAlign: 'center', position: 'relative', zIndex: 5, marginBottom: '0.5rem' }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="section-subtitle">Select Your Machine</span>
          <h1 className="section-title" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', marginTop: '0.75rem' }}>
            The <span style={{ color: skin.primary, transition: 'color 0.6s ease' }}>Garage</span>
          </h1>
        </motion.div>

        {/* SKIN / CAR NAME BADGE */}
        <AnimatePresence mode="wait">
          <motion.div
            key={skin.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.4 }}
            style={{
              position: 'relative',
              zIndex: 5,
              marginBottom: '1.5rem',
            }}
          >
            <div className="glass" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.5rem 1.5rem',
              borderRadius: '2rem',
              border: `1px solid ${skin.primary}30`,
            }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: skin.primary,
                boxShadow: `0 0 10px ${skin.primary}80`,
              }} />
              <span style={{
                fontFamily: 'Orbitron, sans-serif',
                fontSize: '0.65rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#ffffff',
                fontWeight: 700,
              }}>
                <span style={{ color: skin.primary, marginRight: '0.4rem' }}>CAR {skin.carNumber}</span>
                {skin.name}
                <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: '0.5rem', fontWeight: 500 }}>• {skin.character}</span>
              </span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ──── CAR DISPLAY AREA ──── */}
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: '900px',
          zIndex: 5,
          margin: '0 auto',
          padding: '0 2rem',
        }}>

          {/* CAR WITH ANIMATIONS */}
          <motion.div
            style={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '280px',
            }}
            animate={{
              x: cameraOffset.x + cameraKick.x,
              y: cameraOffset.y + cameraKick.y,
            }}
            transition={{
              x: { type: 'spring', stiffness: 30, damping: 20 },
              y: { type: 'spring', stiffness: 30, damping: 20 },
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={skin.id}
                initial={{ opacity: 0, scale: 0.95, x: direction * 60 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: 0,
                  y: [0, -8, 0, -5, 0],
                }}
                exit={{ opacity: 0, scale: 0.95, x: -direction * 60 }}
                transition={{
                  opacity: { duration: 0.5 },
                  scale: { duration: 0.5 },
                  x: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
                  y: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
                }}
                style={{ width: '100%', maxWidth: '750px' }}
              >
                <RacingCar
                  skin={skin}
                  style={{
                    width: '100%',
                    height: 'auto',
                    filter: `drop-shadow(0 20px 40px ${skin.primary}30) drop-shadow(0 5px 15px rgba(0,0,0,0.5))`,
                  }}
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* CARBON FIBER PLATFORM */}
          <div style={{
            position: 'relative',
            width: '80%',
            margin: '-20px auto 0',
            zIndex: 3,
          }}>
            {/* Platform surface */}
            <div style={{
              height: '6px',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), rgba(255,255,255,0.12), rgba(255,255,255,0.08), transparent)',
              borderRadius: '50%',
            }} />
            {/* Platform edge glow */}
            <motion.div
              style={{
                height: '2px',
                background: `linear-gradient(90deg, transparent, ${skin.primary}40, ${skin.primary}60, ${skin.primary}40, transparent)`,
                borderRadius: '50%',
                marginTop: '1px',
              }}
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Carbon texture platform body */}
            <div style={{
              height: '30px',
              background: 'linear-gradient(180deg, rgba(30,30,30,0.8), rgba(15,15,15,0.4), transparent)',
              borderRadius: '0 0 50% 50%',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.3,
                backgroundImage: `
                  repeating-conic-gradient(rgba(255,255,255,0.03) 0% 25%, transparent 0% 50%)
                `,
                backgroundSize: '6px 6px',
              }} />
            </div>

            {/* REFLECTION */}
            <motion.div
              style={{
                width: '70%',
                margin: '0 auto',
                height: '80px',
                opacity: 0.12,
                transform: 'scaleY(-1)',
                maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)',
                WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)',
                overflow: 'hidden',
              }}
              animate={{
                opacity: [0.08, 0.14, 0.08],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <RacingCar
                skin={skin}
                style={{
                  width: '100%',
                  height: 'auto',
                  filter: 'blur(2px)',
                }}
              />
            </motion.div>
          </div>
        </div>

        {/* ──── VEHICLE NAVIGATION ──── */}
        <motion.div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.5rem',
            position: 'relative',
            zIndex: 10,
            marginTop: '1rem',
            marginBottom: '2rem',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <motion.button
            className="btn-secondary"
            style={{ padding: '0.75rem 1.5rem', fontSize: '0.65rem' }}
            onClick={prevSkin}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Prev Car
          </motion.button>

          {/* Skin dots */}
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            {skins.map((s, i) => (
              <motion.button
                key={s.id}
                onClick={() => {
                  setDirection(i > skinIndex ? 1 : -1)
                  setSkinIndex(i)
                }}
                style={{
                  width: i === skinIndex ? '28px' : '10px',
                  height: '10px',
                  borderRadius: '5px',
                  background: i === skinIndex ? s.primary : 'rgba(255,255,255,0.15)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.4s ease',
                  boxShadow: i === skinIndex ? `0 0 12px ${s.primary}60` : 'none',
                }}
                whileHover={{ scale: 1.3 }}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </div>

          <motion.button
            className="btn-secondary"
            style={{ padding: '0.75rem 1.5rem', fontSize: '0.65rem' }}
            onClick={nextSkin}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Next Car
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </motion.button>
        </motion.div>

        {/* ──── VEHICLE SPECS PANEL ──── */}
        <motion.div
          style={{
            width: '100%',
            maxWidth: '900px',
            padding: '0 2rem',
            position: 'relative',
            zIndex: 10,
          }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <div className="glass" style={{
            borderRadius: '1rem',
            overflow: 'hidden',
            border: `1px solid ${skin.primary}25`,
            transition: 'border-color 0.6s ease',
          }}>
            {/* Vehicle name header */}
            <div style={{
              padding: '1.5rem 2rem 1rem',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}>
              <div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={skin.id + '-name-block'}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
                      <span style={{
                        fontFamily: 'Orbitron, sans-serif',
                        fontSize: '0.65rem',
                        fontWeight: 900,
                        color: skin.primary,
                        letterSpacing: '0.15em',
                      }}>CAR {skin.carNumber}</span>
                      <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
                      <span style={{
                        fontFamily: 'Orbitron, sans-serif',
                        fontSize: '0.55rem',
                        color: 'rgba(255,255,255,0.4)',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase'
                      }}>{skin.character}</span>
                    </div>
                    <h2
                      style={{
                        fontFamily: 'Orbitron, sans-serif',
                        fontSize: '1.5rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        margin: 0,
                        color: '#ffffff',
                      }}
                    >
                      {skin.name}
                    </h2>
                  </motion.div>
                </AnimatePresence>
                <p style={{
                  fontFamily: 'Orbitron, sans-serif',
                  fontSize: '0.6rem',
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.3)',
                  marginTop: '0.35rem',
                }}>{skin.manufacturer}</p>
              </div>
              <div style={{
                fontFamily: 'Orbitron, sans-serif',
                fontSize: '0.55rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: skin.primary,
                transition: 'color 0.6s ease',
                padding: '0.4rem 1.1rem',
                border: `1px solid ${skin.primary}35`,
                borderRadius: '2rem',
                background: `${skin.primary}10`,
                boxShadow: `0 0 15px ${skin.primary}20`,
                fontWeight: 700,
              }}>
                {skin.character}
              </div>
            </div>

            {/* Specs grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 0,
            }}>
              {/* Left — Key Specs */}
              <div style={{
                padding: '1.5rem 2rem',
                borderRight: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{
                  fontFamily: 'Orbitron, sans-serif',
                  fontSize: '0.55rem',
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color: skin.primary,
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'color 0.6s ease',
                }}>
                  <div style={{
                    width: '3px',
                    height: '12px',
                    background: skin.primary,
                    borderRadius: '2px',
                    boxShadow: `0 0 8px ${skin.primary}60`,
                    transition: 'all 0.6s ease',
                  }} />
                  Specifications
                </div>
                <SpecRow label="Top Speed" value={skin.topSpeed.split(' ')[0]} unit={skin.topSpeed.split(' ')[1] || 'KM/H'} />
                <SpecRow label="0–100 KM/H" value={skin.acceleration} unit="SEC" />
                <SpecRow label="Weight" value={skin.weight.split(' ')[0]} unit={skin.weight.split(' ')[1] || 'KG'} />
                <SpecRow label="Downforce" value={skin.downforce.split(' ')[0]} unit={skin.downforce.split(' ')[1] || 'N'} />
                <SpecRow label="Power Unit" value={skin.powerUnit} />
                <SpecRow label="Gearbox" value={skin.gearbox} />
              </div>

              {/* Right — Performance Bars */}
              <div style={{ padding: '1.5rem 2rem' }}>
                <div style={{
                  fontFamily: 'Orbitron, sans-serif',
                  fontSize: '0.55rem',
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color: skin.primary,
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'color 0.6s ease',
                }}>
                  <div style={{
                    width: '3px',
                    height: '12px',
                    background: skin.primary,
                    borderRadius: '2px',
                    boxShadow: `0 0 8px ${skin.primary}60`,
                    transition: 'all 0.6s ease',
                  }} />
                  Performance Ratings
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={skin.id + '-stats'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    {skin.stats.map((stat, i) => (
                      <StatBar
                        key={stat.label}
                        label={stat.label}
                        value={stat.value}
                        color={skin.primary}
                        delay={i}
                      />
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ──── ACTION BUTTONS ──── */}
        <motion.div
          style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '2rem',
            position: 'relative',
            zIndex: 10,
            flexWrap: 'wrap',
            padding: '0 2rem',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <motion.button
            className="btn-primary"
            style={{
              fontSize: '0.8rem',
              cursor: 'pointer',
              borderRadius: '10px',
              padding: '0.85rem 2rem',
              background: `linear-gradient(135deg, ${skin.primary}, ${skin.accent})`,
              boxShadow: `0 0 25px ${skin.primary}60`,
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontWeight: 800
            }}
            onClick={handleSelectAndRace}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
            </svg>
            Race with {skin.name}
          </motion.button>

          <motion.button
            className="btn-secondary"
            style={{ fontSize: '0.75rem', cursor: 'pointer', borderRadius: '10px', padding: '0.85rem 1.6rem' }}
            onClick={handleSelectAndHome}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Select Vehicle
          </motion.button>

          <motion.button
            className="btn-secondary"
            style={{ fontSize: '0.75rem', cursor: 'pointer', borderRadius: '10px', padding: '0.85rem 1.6rem' }}
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </motion.button>
        </motion.div>

        {/* Bottom spacer */}
        <div style={{ height: '3rem' }} />
      </section>

      <Footer />
    </div>
  )
}
