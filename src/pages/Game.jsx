import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

/* ═══════════════════════════════════════════════════════════════
   SKIN / CAR DEFINITION & STORAGE
   ═══════════════════════════════════════════════════════════════ */
const DEF_SKIN = {
  id: 'apex',
  carNumber: '01',
  name: 'Apex R1',
  character: 'Balanced Starter',
  primary: '#e10600',
  secondary: '#ff3838',
  accent: '#990400'
}

function getSkin() {
  try {
    const s = localStorage.getItem('selectedSkin')
    if (s) return JSON.parse(s)
  } catch { /* ignore */ }
  return DEF_SKIN
}

/* ═══════════════════════════════════════════════════════════════
   AUDIO SYNTHESIZER (Web Audio API)
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

function playNearMissSound(comboLevel = 1) {
  try {
    const ctx = getAudioCtx()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const baseFreq = 440 + Math.min(6, comboLevel) * 90
    osc.type = 'sine'
    osc.frequency.setValueAtTime(baseFreq, now)
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.6, now + 0.15)
    gain.gain.setValueAtTime(0.25, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
    osc.connect(gain); gain.connect(ctx.destination)
    osc.start(now); osc.stop(now + 0.2)
  } catch { /* ignore */ }
}

function playNitroPickupSound() {
  try {
    const ctx = getAudioCtx()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(520, now)
    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.18)
    gain.gain.setValueAtTime(0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
    osc.connect(gain); gain.connect(ctx.destination)
    osc.start(now); osc.stop(now + 0.2)
  } catch { /* ignore */ }
}

function playNitroActivateSound() {
  try {
    const ctx = getAudioCtx()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(180, now)
    osc.frequency.exponentialRampToValueAtTime(920, now + 0.35)
    gain.gain.setValueAtTime(0.35, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)
    osc.connect(gain); gain.connect(ctx.destination)
    osc.start(now); osc.stop(now + 0.45)
  } catch { /* ignore */ }
}

function playCrashSound() {
  try {
    const ctx = getAudioCtx()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(140, now)
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.4)
    gain.gain.setValueAtTime(0.45, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
    osc.connect(gain); gain.connect(ctx.destination)
    osc.start(now); osc.stop(now + 0.5)
  } catch { /* ignore */ }
}

function playCountdownBeep(isGo = false) {
  try {
    const ctx = getAudioCtx()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const freq = isGo ? 980 : 440
    osc.type = isGo ? 'triangle' : 'sine'
    osc.frequency.setValueAtTime(freq, now)
    if (isGo) {
      osc.frequency.exponentialRampToValueAtTime(1240, now + 0.15)
    }
    gain.gain.setValueAtTime(isGo ? 0.35 : 0.22, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isGo ? 0.45 : 0.2))
    osc.connect(gain); gain.connect(ctx.destination)
    osc.start(now); osc.stop(now + (isGo ? 0.45 : 0.2))
  } catch { /* ignore */ }
}

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS & CONFIGURATION
   ═══════════════════════════════════════════════════════════════ */
const LANES = 3
const PW = 52, PH = 98
const BOOST_SZ = 52
const DASH_H = 38, DASH_GAP = 26
const KERB_W = 16, KERB_H = 20

const SEC_CIRCUIT = {
  num: 'SECTOR 01',
  name: 'FORMULA CIRCUIT',
  sub: 'Grand Prix Track',
  icon: '🏁',
  skyT: '#080818',
  skyB: '#141428',
  road: '#1a1a20',
  edge: '#e10600',
  grass: '#091a0e',
  kerb2: '#ffffff',
  ambient: [225, 6, 0],
}

/* ═══════════════════════════════════════════════════════════════
   RACE EVENT TIMELINE (5s gap after start → Speed Zone → 8s gap loop)
   ═══════════════════════════════════════════════════════════════ */
const START_DELAY = 5.0 // 5 seconds gap after starting before Speed Zone begins
const EVENT_DURATION = 10.0 // Exactly 10 seconds for each special zone
const EVENT_GAP = 5.0 // Exactly 5 seconds gap between every zone
const CYCLE_DURATION = 4 * (EVENT_DURATION + EVENT_GAP) // 60 seconds per complete loop (Speed -> Traffic -> Nitro -> Blackout)

function getEventAtTime(raceTime) {
  if (raceTime < START_DELAY) {
    return { id: null, cycleIndex: 0, diffMultiplier: 1.0, timeLeft: 0 }
  }

  const relTime = raceTime - START_DELAY
  const cycleIndex = Math.floor(relTime / CYCLE_DURATION)
  const cycleTime = relTime % CYCLE_DURATION
  const diffMultiplier = 1 + cycleIndex * 0.15

  // 1. SPEED ZONE (Starts right after the 5s start gap, duration 10s: 0s - 10s)
  if (cycleTime >= 0 && cycleTime < EVENT_DURATION) {
    const timeLeft = Math.max(1, Math.ceil(EVENT_DURATION - cycleTime))
    return {
      id: 'speed_zone',
      name: 'SPEED ZONE',
      sub: 'MAX SPEED ACTIVE',
      color: '#ff3333',
      icon: '⚡',
      cycleIndex,
      diffMultiplier,
      timeLeft
    }
  }

  // Gap 1 (10.0s to 15.0s) -> 5 seconds normal racing

  // 2. TRAFFIC SURGE (10s duration: 15s - 25s)
  const t2Start = EVENT_DURATION + EVENT_GAP
  if (cycleTime >= t2Start && cycleTime < t2Start + EVENT_DURATION) {
    const timeLeft = Math.max(1, Math.ceil(t2Start + EVENT_DURATION - cycleTime))
    return {
      id: 'traffic_surge',
      name: 'TRAFFIC SURGE',
      sub: 'HEAVY TRAFFIC',
      color: '#ff2222',
      icon: '🚨',
      cycleIndex,
      diffMultiplier,
      timeLeft
    }
  }

  // Gap 2 (25.0s to 30.0s) -> 5 seconds normal racing

  // 3. BOOST RUSH / NITRO ZONE (10s duration: 30s - 40s)
  const t3Start = 2 * (EVENT_DURATION + EVENT_GAP)
  if (cycleTime >= t3Start && cycleTime < t3Start + EVENT_DURATION) {
    const timeLeft = Math.max(1, Math.ceil(t3Start + EVENT_DURATION - cycleTime))
    return {
      id: 'nitro_zone',
      name: 'BOOST RUSH',
      sub: 'NITRO BOOST',
      color: '#00e5ff',
      icon: '⚡',
      cycleIndex,
      diffMultiplier,
      timeLeft
    }
  }

  // Gap 3 (40.0s to 45.0s) -> 5 seconds normal racing

  // 4. BLACKOUT ZONE (10s duration: 45s - 55s, right after Nitro Boost + 5s gap)
  const t4Start = 3 * (EVENT_DURATION + EVENT_GAP)
  if (cycleTime >= t4Start && cycleTime < t4Start + EVENT_DURATION) {
    const timeLeft = Math.max(1, Math.ceil(t4Start + EVENT_DURATION - cycleTime))
    return {
      id: 'blackout_zone',
      name: 'BLACKOUT ZONE',
      sub: 'LIGHTS OUT. HEADLIGHTS ON. STAY ALERT!',
      color: '#c084fc',
      icon: '⚡',
      cycleIndex,
      diffMultiplier,
      timeLeft
    }
  }

  // Gap 4 (55.0s to 60.0s) -> 5 seconds normal racing before looping back to Speed Zone

  return {
    id: null,
    cycleIndex,
    diffMultiplier,
    timeLeft: 0
  }
}

const V_TYPES = [
  {
    id: 'gt_coupe',
    name: 'Apex GT Supercar',
    w: 44, h: 76,
    roofColor: 'rgba(12,18,30,0.92)',
    headlightColor: 'rgba(200,235,255,0.50)',
    colors: ['#1a2d4a', '#8c1a28', '#2a4a38', '#c4760a', '#3a1a50', '#b01020']
  },
  {
    id: 'hypercar',
    name: 'Le Mans Prototype',
    w: 46, h: 80,
    roofColor: 'rgba(8,14,28,0.94)',
    headlightColor: 'rgba(180,230,255,0.55)',
    colors: ['#0d3a6e', '#8a1838', '#0a4a3a', '#9e6a08', '#3e1866']
  },
  {
    id: 'gt3_racer',
    name: 'GT3 Endurance Racer',
    w: 46, h: 78,
    roofColor: 'rgba(14,18,26,0.92)',
    headlightColor: 'rgba(255,240,200,0.50)',
    colors: ['#c8c8d0', '#c46010', '#1a6a2a', '#184888', '#9a1830']
  },
  {
    id: 'open_wheel',
    name: 'Formula Single-Seater',
    w: 48, h: 86,
    roofColor: 'rgba(10,12,18,0.96)',
    headlightColor: 'rgba(255,255,255,0.42)',
    colors: ['#a01020', '#0a3870', '#0a6848', '#c08810', '#4a1870', '#d0d0d8']
  },
  {
    id: 'sedan',
    name: 'DTM Touring Racer',
    w: 44, h: 76,
    roofColor: 'rgba(16,20,30,0.90)',
    headlightColor: 'rgba(255,250,220,0.48)',
    colors: ['#1e3048', '#481828', '#1e3828', '#2e2e40', '#403018']
  },
  {
    id: 'suv',
    name: 'Grand Prix Pace SUV',
    w: 48, h: 82,
    roofColor: 'rgba(14,18,24,0.93)',
    headlightColor: 'rgba(240,255,255,0.48)',
    colors: ['#162030', '#301818', '#183020', '#301828', '#222630']
  },
  {
    id: 'transporter',
    name: 'Paddock Transporter',
    w: 50, h: 92,
    roofColor: 'rgba(12,14,20,0.96)',
    headlightColor: 'rgba(255,240,190,0.48)',
    colors: ['#2a3040', '#383e50', '#1e2230']
  }
]

function seed(n) {
  let x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function lerp(a, b, t) {
  return a + (b - a) * Math.max(0, Math.min(1, t))
}

function lerpHex(a, b, t) {
  const p = s => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)]
  const [ar, ag, ab] = p(a), [br, bg, bb] = p(b)
  return `rgb(${Math.round(lerp(ar, br, t))},${Math.round(lerp(ag, bg, t))},${Math.round(lerp(ab, bb, t))})`
}

function getSectorInfo() {
  return { idx: 0, sec: SEC_CIRCUIT, nextSec: SEC_CIRCUIT, inTransition: false, transProgress: 0, blend: 0 }
}

/* ═══════════════════════════════════════════════════════════════
   WHEEL & TIRE HELPERS FOR TOP-DOWN RACING CARS
   ═══════════════════════════════════════════════════════════════ */
function drawF1Wheel(ctx, wx, wy, isFront, pCol, hw, hh) {
  const tw = hw * 0.28, th = hh * (isFront ? 0.28 : 0.33)
  ctx.fillStyle = '#0c0d10'
  ctx.beginPath()
  ctx.roundRect(wx - tw / 2, wy - th / 2, tw, th, 3)
  ctx.fill()
  ctx.strokeStyle = '#1e2028'
  ctx.lineWidth = 1.2
  ctx.strokeRect(wx - tw / 2, wy - th / 2, tw, th)

  // Tread grooves
  ctx.strokeStyle = '#16171c'
  ctx.lineWidth = 0.8
  for (let g = -2; g <= 2; g++) {
    const gy = wy + g * (th * 0.15)
    ctx.beginPath()
    ctx.moveTo(wx - tw * 0.45, gy)
    ctx.lineTo(wx + tw * 0.45, gy)
    ctx.stroke()
  }

  // Rim face
  const rimGrad = ctx.createRadialGradient(wx - 1, wy - 1, 0, wx, wy, tw * 0.35)
  rimGrad.addColorStop(0, '#e8e8e8')
  rimGrad.addColorStop(0.5, '#aaaaaa')
  rimGrad.addColorStop(1, '#555555')
  ctx.fillStyle = rimGrad
  ctx.beginPath()
  ctx.arc(wx, wy, tw * 0.32, 0, Math.PI * 2)
  ctx.fill()

  // Spokes
  ctx.strokeStyle = '#777'
  ctx.lineWidth = 1.4
  for (let s = 0; s < 5; s++) {
    const angle = (s * Math.PI * 2) / 5 - Math.PI / 2
    ctx.beginPath()
    ctx.moveTo(wx, wy)
    ctx.lineTo(wx + Math.cos(angle) * tw * 0.28, wy + Math.sin(angle) * tw * 0.28)
    ctx.stroke()
  }

  // Hub & caliper
  ctx.fillStyle = pCol
  ctx.beginPath()
  ctx.arc(wx, wy, tw * 0.12, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#ffcc00'
  ctx.beginPath()
  ctx.arc(wx, wy, tw * 0.06, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(255,30,0,0.7)'
  ctx.beginPath()
  ctx.arc(wx + tw * 0.15, wy, tw * 0.08, 0, Math.PI * 2)
  ctx.fill()
}

function drawSportsWheel(ctx, wx, wy, tw, th, pCol, isOffroad = false) {
  ctx.fillStyle = '#0a0b0e'
  ctx.beginPath()
  ctx.roundRect(wx - tw / 2, wy - th / 2, tw, th, isOffroad ? 4 : 3)
  ctx.fill()
  ctx.strokeStyle = '#22252e'
  ctx.lineWidth = 1.0
  ctx.stroke()

  if (isOffroad) {
    // Off-road aggressive sidewall lugs
    ctx.fillStyle = '#181a20'
    for (let o = -3; o <= 3; o++) {
      const oy = wy + o * (th * 0.14)
      ctx.fillRect(wx - tw / 2 - 1, oy - 1.5, 2, 3)
      ctx.fillRect(wx + tw / 2 - 1, oy - 1.5, 2, 3)
    }
  }

  // Ceramic rotor disc & rim
  ctx.fillStyle = '#666a78'
  ctx.beginPath()
  ctx.arc(wx, wy, tw * 0.36, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#1c1d22'
  ctx.beginPath()
  ctx.arc(wx, wy, tw * 0.22, 0, Math.PI * 2)
  ctx.fill()

  // Caliper
  ctx.fillStyle = pCol || '#ff3300'
  ctx.fillRect(wx - tw * 0.15, wy - tw * 0.35, tw * 0.3, tw * 0.18)
}

/* ═══════════════════════════════════════════════════════════════
   MODEL 01: APEX R1 (Classic Open-Wheel F1 Single-Seater)
   ═══════════════════════════════════════════════════════════════ */
function drawCarApex(ctx, hw, hh, skin, st, pCol, sCol, aCol, t) {
  // Suspension Wishbones
  ctx.strokeStyle = '#1a1a22'
  ctx.lineWidth = 2.0
  ctx.beginPath()
  ctx.moveTo(-hw * 0.22, -hh * 0.48); ctx.lineTo(-hw * 0.88, -hh * 0.56)
  ctx.moveTo(hw * 0.22, -hh * 0.48); ctx.lineTo(hw * 0.88, -hh * 0.56)
  ctx.moveTo(-hw * 0.22, -hh * 0.62); ctx.lineTo(-hw * 0.88, -hh * 0.58)
  ctx.moveTo(hw * 0.22, -hh * 0.62); ctx.lineTo(hw * 0.88, -hh * 0.58)
  ctx.moveTo(-hw * 0.30, hh * 0.30); ctx.lineTo(-hw * 0.88, hh * 0.46)
  ctx.moveTo(hw * 0.30, hh * 0.30); ctx.lineTo(hw * 0.88, hh * 0.46)
  ctx.moveTo(-hw * 0.30, hh * 0.40); ctx.lineTo(-hw * 0.88, hh * 0.50)
  ctx.moveTo(hw * 0.30, hh * 0.40); ctx.lineTo(hw * 0.88, hh * 0.50)
  ctx.stroke()

  // Push-rods
  ctx.strokeStyle = '#2a2a32'
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(-hw * 0.35, -hh * 0.40); ctx.lineTo(-hw * 0.50, -hh * 0.55)
  ctx.moveTo(hw * 0.35, -hh * 0.40); ctx.lineTo(hw * 0.50, -hh * 0.55)
  ctx.stroke()

  // Tires
  drawF1Wheel(ctx, -hw * 0.85, -hh * 0.56, true, pCol, hw, hh)
  drawF1Wheel(ctx, hw * 0.85, -hh * 0.56, true, pCol, hw, hh)
  drawF1Wheel(ctx, -hw * 0.85, hh * 0.48, false, pCol, hw, hh)
  drawF1Wheel(ctx, hw * 0.85, hh * 0.48, false, pCol, hw, hh)

  // Carbon floor plank
  ctx.fillStyle = '#0a0b10'
  ctx.beginPath()
  ctx.moveTo(-hw * 0.72, -hh * 0.30); ctx.lineTo(hw * 0.72, -hh * 0.30)
  ctx.lineTo(hw * 0.60, hh * 0.72); ctx.lineTo(-hw * 0.60, hh * 0.72)
  ctx.closePath()
  ctx.fill()

  // Main Monocoque & Sidepods
  const bodyGrad = ctx.createLinearGradient(-hw * 0.7, -hh * 0.3, hw * 0.7, hh * 0.3)
  bodyGrad.addColorStop(0, aCol)
  bodyGrad.addColorStop(0.2, pCol)
  bodyGrad.addColorStop(0.5, pCol)
  bodyGrad.addColorStop(0.8, pCol)
  bodyGrad.addColorStop(1, aCol)

  ctx.fillStyle = bodyGrad
  ctx.beginPath()
  ctx.moveTo(0, -hh * 1.04)
  ctx.lineTo(hw * 0.16, -hh * 0.96)
  ctx.lineTo(hw * 0.24, -hh * 0.50)
  ctx.lineTo(hw * 0.65, -hh * 0.22)
  ctx.quadraticCurveTo(hw * 0.68, hh * 0.05, hw * 0.60, hh * 0.28)
  ctx.quadraticCurveTo(hw * 0.45, hh * 0.60, hw * 0.36, hh * 0.76)
  ctx.lineTo(-hw * 0.36, hh * 0.76)
  ctx.quadraticCurveTo(-hw * 0.45, hh * 0.60, -hw * 0.60, hh * 0.28)
  ctx.quadraticCurveTo(-hw * 0.68, hh * 0.05, -hw * 0.65, -hh * 0.22)
  ctx.lineTo(-hw * 0.24, -hh * 0.50)
  ctx.lineTo(-hw * 0.16, -hh * 0.96)
  ctx.closePath()
  ctx.fill()

  // Specular sheen
  const sheenGrad = ctx.createLinearGradient(-hw * 0.3, -hh * 0.8, hw * 0.1, hh * 0.2)
  sheenGrad.addColorStop(0, 'rgba(255,255,255,0)')
  sheenGrad.addColorStop(0.5, 'rgba(255,255,255,0.22)')
  sheenGrad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = sheenGrad
  ctx.fill()

  // Sidepod inlets
  ctx.fillStyle = '#060710'
  ctx.beginPath()
  ctx.ellipse(-hw * 0.46, -hh * 0.18, hw * 0.14, hh * 0.06, -0.1, 0, Math.PI * 2)
  ctx.ellipse(hw * 0.46, -hh * 0.18, hw * 0.14, hh * 0.06, 0.1, 0, Math.PI * 2)
  ctx.fill()

  // Nose central ridge
  ctx.fillStyle = 'rgba(255,255,255,0.18)'
  ctx.beginPath()
  ctx.moveTo(-2, -hh * 1.0); ctx.lineTo(2, -hh * 1.0)
  ctx.lineTo(3, -hh * 0.45); ctx.lineTo(-3, -hh * 0.45)
  ctx.closePath()
  ctx.fill()

  // Cockpit, Halo & Driver
  ctx.fillStyle = '#070810'
  ctx.beginPath()
  ctx.ellipse(0, -hh * 0.06, hw * 0.20, hh * 0.16, 0, 0, Math.PI * 2)
  ctx.fill()

  // Driver Helmet
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(0, -hh * 0.06, hw * 0.13, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#1a1a2a'
  ctx.fillRect(-hw * 0.10, -hh * 0.10, hw * 0.20, hh * 0.04)
  ctx.fillStyle = pCol
  ctx.fillRect(-hw * 0.10, -hh * 0.09, hw * 0.20, hh * 0.015)

  // Halo titanium structure
  ctx.strokeStyle = '#2a2c38'
  ctx.lineWidth = 3.0
  ctx.beginPath()
  ctx.arc(0, -hh * 0.06, hw * 0.22, Math.PI * 0.12, Math.PI * 0.88)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(0, -hh * 0.17); ctx.lineTo(0, -hh * 0.30)
  ctx.stroke()

  // Shark fin & cooling vents
  ctx.fillStyle = '#0e0f16'
  ctx.fillRect(-hw * 0.08, 0, hw * 0.16, hh * 0.40)
  ctx.fillStyle = sCol
  ctx.fillRect(-1.2, hh * 0.02, 2.4, hh * 0.52)

  // Front Wing
  ctx.fillStyle = pCol
  ctx.fillRect(-hw * 0.98, -hh * 1.05, hw * 1.96, hh * 0.07)
  ctx.fillStyle = aCol
  ctx.fillRect(-hw * 0.92, -hh * 1.00, hw * 1.84, hh * 0.03)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(-hw * 1.02, -hh * 1.08, hw * 0.06, hh * 0.16)
  ctx.fillRect(hw * 0.96, -hh * 1.08, hw * 0.06, hh * 0.16)

  // Rear Wing
  ctx.fillStyle = '#1a1c24'
  ctx.fillRect(-hw * 0.18, hh * 0.72, 3, hh * 0.12)
  ctx.fillRect(hw * 0.15, hh * 0.72, 3, hh * 0.12)
  ctx.fillStyle = pCol
  ctx.fillRect(-hw * 0.90, hh * 0.82, hw * 1.80, hh * 0.08)
  ctx.fillStyle = '#0c0d14'
  ctx.fillRect(-hw * 0.86, hh * 0.88, hw * 1.72, hh * 0.035)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(-hw * 0.94, hh * 0.78, hw * 0.06, hh * 0.18)
  ctx.fillRect(hw * 0.88, hh * 0.78, hw * 0.06, hh * 0.18)

  // FIA Rain light
  const rainFlash = Math.sin(t * 20) > 0
  ctx.fillStyle = rainFlash ? '#ff0033' : '#330008'
  ctx.shadowColor = '#ff0033'
  ctx.shadowBlur = rainFlash ? 12 : 0
  ctx.beginPath()
  ctx.roundRect(-5, hh * 0.91, 10, 4, 2)
  ctx.fill()
  ctx.shadowBlur = 0
}

/* ═══════════════════════════════════════════════════════════════
   MODEL 02: VORTEX GT (Mid-Engine High-Acceleration Supercar)
   ═══════════════════════════════════════════════════════════════ */
function drawCarVortex(ctx, hw, hh, skin, st, pCol, sCol, aCol, t) {
  // Sports Wheels (enclosed wide haunches)
  drawSportsWheel(ctx, -hw * 0.82, -hh * 0.54, hw * 0.28, hh * 0.28, pCol)
  drawSportsWheel(ctx, hw * 0.82, -hh * 0.54, hw * 0.28, hh * 0.28, pCol)
  drawSportsWheel(ctx, -hw * 0.84, hh * 0.48, hw * 0.32, hh * 0.32, pCol)
  drawSportsWheel(ctx, hw * 0.84, hh * 0.48, hw * 0.32, hh * 0.32, pCol)

  // Carbon underbody & front splitter
  ctx.fillStyle = '#0a0b10'
  ctx.beginPath()
  ctx.roundRect(-hw * 0.92, -hh * 0.98, hw * 1.84, hh * 1.94, 6)
  ctx.fill()

  // Main Sculpted Supercar Body
  const bodyGrad = ctx.createLinearGradient(-hw * 0.9, 0, hw * 0.9, 0)
  bodyGrad.addColorStop(0, aCol)
  bodyGrad.addColorStop(0.18, pCol)
  bodyGrad.addColorStop(0.5, pCol)
  bodyGrad.addColorStop(0.82, pCol)
  bodyGrad.addColorStop(1, aCol)

  ctx.fillStyle = bodyGrad
  ctx.beginPath()
  // Nose & front hood
  ctx.moveTo(-hw * 0.60, -hh * 0.96)
  ctx.quadraticCurveTo(0, -hh * 1.02, hw * 0.60, -hh * 0.96)
  // Front wheel arch flare
  ctx.lineTo(hw * 0.88, -hh * 0.70)
  ctx.lineTo(hw * 0.84, -hh * 0.36)
  // Sculpted waist & side intake scoops
  ctx.quadraticCurveTo(hw * 0.70, -hh * 0.05, hw * 0.92, hh * 0.24)
  // Wide rear haunches
  ctx.lineTo(hw * 0.90, hh * 0.66)
  // Rear ducktail bumper
  ctx.quadraticCurveTo(hw * 0.50, hh * 0.92, 0, hh * 0.90)
  ctx.quadraticCurveTo(-hw * 0.50, hh * 0.92, -hw * 0.90, hh * 0.66)
  // Left rear haunch
  ctx.lineTo(-hw * 0.92, hh * 0.24)
  ctx.quadraticCurveTo(-hw * 0.70, -hh * 0.05, -hw * 0.84, -hh * 0.36)
  ctx.lineTo(-hw * 0.88, -hh * 0.70)
  ctx.closePath()
  ctx.fill()

  // Front Splitter carbon ducts
  ctx.fillStyle = '#06070a'
  ctx.fillRect(-hw * 0.44, -hh * 0.94, hw * 0.88, hh * 0.06)
  ctx.fillStyle = pCol
  ctx.fillRect(-hw * 0.04, -hh * 0.94, hw * 0.08, hh * 0.06)

  // LED Matrix Projector Headlights (Forward light beams)
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = '#00e5ff'
  ctx.shadowBlur = 8
  // Left angled headlight
  ctx.beginPath()
  ctx.moveTo(-hw * 0.74, -hh * 0.84); ctx.lineTo(-hw * 0.52, -hh * 0.76); ctx.lineTo(-hw * 0.62, -hh * 0.70); ctx.closePath(); ctx.fill()
  // Right angled headlight
  ctx.beginPath()
  ctx.moveTo(hw * 0.74, -hh * 0.84); ctx.lineTo(hw * 0.52, -hh * 0.76); ctx.lineTo(hw * 0.62, -hh * 0.70); ctx.closePath(); ctx.fill()
  ctx.shadowBlur = 0

  // Hood Heat Extractor Vents
  ctx.fillStyle = '#0c0d14'
  ctx.beginPath()
  ctx.moveTo(-hw * 0.36, -hh * 0.55); ctx.lineTo(-hw * 0.16, -hh * 0.55); ctx.lineTo(-hw * 0.24, -hh * 0.38); ctx.closePath(); ctx.fill()
  ctx.beginPath()
  ctx.moveTo(hw * 0.36, -hh * 0.55); ctx.lineTo(hw * 0.16, -hh * 0.55); ctx.lineTo(hw * 0.24, -hh * 0.38); ctx.closePath(); ctx.fill()

  // Side Air Scoops (3D deep radiator ducts)
  ctx.fillStyle = '#050608'
  ctx.beginPath()
  ctx.moveTo(-hw * 0.76, -hh * 0.06); ctx.lineTo(-hw * 0.60, 0); ctx.lineTo(-hw * 0.60, hh * 0.22); ctx.lineTo(-hw * 0.82, hh * 0.18); ctx.closePath(); ctx.fill()
  ctx.beginPath()
  ctx.moveTo(hw * 0.76, -hh * 0.06); ctx.lineTo(hw * 0.60, 0); ctx.lineTo(hw * 0.60, hh * 0.22); ctx.lineTo(hw * 0.82, hh * 0.18); ctx.closePath(); ctx.fill()

  // Panoramic Glass Canopy & Roof
  const glassGrad = ctx.createLinearGradient(0, -hh * 0.32, 0, hh * 0.20)
  glassGrad.addColorStop(0, 'rgba(160,220,255,0.7)')
  glassGrad.addColorStop(0.35, 'rgba(40,110,200,0.5)')
  glassGrad.addColorStop(0.7, 'rgba(8,18,36,0.95)')
  glassGrad.addColorStop(1, 'rgba(4,8,16,0.98)')

  ctx.fillStyle = glassGrad
  ctx.beginPath()
  ctx.moveTo(-hw * 0.44, -hh * 0.30)
  ctx.quadraticCurveTo(0, -hh * 0.38, hw * 0.44, -hh * 0.30)
  ctx.lineTo(hw * 0.50, hh * 0.14)
  ctx.quadraticCurveTo(0, hh * 0.22, -hw * 0.50, hh * 0.14)
  ctx.closePath()
  ctx.fill()

  // Windshield Horizon Reflection
  ctx.strokeStyle = 'rgba(255,255,255,0.45)'
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(-hw * 0.38, -hh * 0.22)
  ctx.quadraticCurveTo(0, -hh * 0.28, hw * 0.38, -hh * 0.22)
  ctx.stroke()

  // A-Pillars & Roof Frame
  ctx.strokeStyle = '#12141c'
  ctx.lineWidth = 2.2
  ctx.beginPath()
  ctx.moveTo(-hw * 0.44, -hh * 0.30); ctx.lineTo(-hw * 0.34, -hh * 0.04)
  ctx.moveTo(hw * 0.44, -hh * 0.30); ctx.lineTo(hw * 0.34, -hh * 0.04)
  ctx.stroke()

  // Mid-Engine Glass Hatch & Cooling Louvres
  ctx.fillStyle = '#08090e'
  ctx.beginPath()
  ctx.moveTo(-hw * 0.36, hh * 0.18); ctx.lineTo(hw * 0.36, hh * 0.18)
  ctx.lineTo(hw * 0.42, hh * 0.58); ctx.lineTo(-hw * 0.42, hh * 0.58)
  ctx.closePath()
  ctx.fill()

  // Engine block glow & vents
  ctx.fillStyle = pCol
  ctx.globalAlpha = 0.5
  ctx.fillRect(-hw * 0.18, hh * 0.26, hw * 0.36, hh * 0.16)
  ctx.globalAlpha = 1.0
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'
  ctx.lineWidth = 1.0
  for (let l = 0; l < 4; l++) {
    const ly = hh * 0.22 + l * hh * 0.09
    ctx.beginPath(); ctx.moveTo(-hw * 0.28, ly); ctx.lineTo(hw * 0.28, ly); ctx.stroke()
  }

  // Active Rear Ducktail Spoiler
  ctx.fillStyle = '#0d0f16'
  ctx.fillRect(-hw * 0.72, hh * 0.72, hw * 1.44, hh * 0.08)
  ctx.fillStyle = pCol
  ctx.fillRect(-hw * 0.68, hh * 0.74, hw * 1.36, hh * 0.03)

  // Full-Width OLED Red Taillight Bar
  ctx.fillStyle = '#ff1100'
  ctx.shadowColor = '#ff1100'
  ctx.shadowBlur = 10
  ctx.beginPath()
  ctx.roundRect(-hw * 0.78, hh * 0.83, hw * 1.56, 3.5, 1.5)
  ctx.fill()
  ctx.shadowBlur = 0

}

/* ═══════════════════════════════════════════════════════════════
   MODEL 03: FALCON X (Stealth Carbon Black & Racing Red Hypercar)
   ═══════════════════════════════════════════════════════════════ */
function drawCarFalcon(ctx, hw, hh, skin, st, pCol, sCol, aCol, t) {
  const redPrimary = '#ff1e1e'
  const redDark = '#b30000'
  const carbonBlack = '#10121a'
  const carbonDark = '#06070a'

  // Performance Racing Wheels (Carbon Black with Red Center Nut)
  drawSportsWheel(ctx, -hw * 0.86, -hh * 0.54, hw * 0.26, hh * 0.28, redPrimary)
  drawSportsWheel(ctx, hw * 0.86, -hh * 0.54, hw * 0.26, hh * 0.28, redPrimary)
  drawSportsWheel(ctx, -hw * 0.88, hh * 0.44, hw * 0.28, hh * 0.32, redPrimary)
  drawSportsWheel(ctx, hw * 0.88, hh * 0.44, hw * 0.28, hh * 0.32, redPrimary)

  // Carbon Fiber Underbody Ground Effects Floor
  ctx.fillStyle = carbonDark
  ctx.beginPath()
  ctx.moveTo(-hw * 0.94, -hh * 0.96); ctx.lineTo(hw * 0.94, -hh * 0.96)
  ctx.lineTo(hw * 0.90, hh * 0.94); ctx.lineTo(-hw * 0.90, hh * 0.94)
  ctx.closePath()
  ctx.fill()

  // Front Aerodynamic Carbon Splitter & Dive Planes (Red Trimmed)
  ctx.fillStyle = '#0a0d14'
  ctx.beginPath()
  ctx.moveTo(-hw * 0.96, -hh * 0.92); ctx.lineTo(hw * 0.96, -hh * 0.92)
  ctx.lineTo(hw * 0.88, -hh * 0.82); ctx.lineTo(-hw * 0.88, -hh * 0.82)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = redPrimary
  ctx.lineWidth = 2.0
  ctx.beginPath()
  ctx.moveTo(-hw * 0.96, -hh * 0.92); ctx.lineTo(hw * 0.96, -hh * 0.92)
  ctx.stroke()

  // Main Stealth Black & Racing Red Hypercar Body
  const bodyGrad = ctx.createLinearGradient(-hw * 0.92, 0, hw * 0.92, 0)
  bodyGrad.addColorStop(0, carbonDark)
  bodyGrad.addColorStop(0.25, carbonBlack)
  bodyGrad.addColorStop(0.5, '#1e2230')
  bodyGrad.addColorStop(0.75, carbonBlack)
  bodyGrad.addColorStop(1, carbonDark)

  ctx.fillStyle = bodyGrad
  ctx.beginPath()
  // Nose section
  ctx.moveTo(-hw * 0.40, -hh * 0.96)
  ctx.lineTo(hw * 0.40, -hh * 0.96)
  // Front right fender
  ctx.lineTo(hw * 0.94, -hh * 0.86)
  ctx.lineTo(hw * 0.92, -hh * 0.30)
  // Undercut aerodynamic waist
  ctx.quadraticCurveTo(hw * 0.58, -hh * 0.05, hw * 0.92, hh * 0.20)
  // Rear right fender
  ctx.lineTo(hw * 0.94, hh * 0.80)
  ctx.lineTo(hw * 0.60, hh * 0.88)
  // Rear diffuser center
  ctx.lineTo(0, hh * 0.94)
  // Rear left fender
  ctx.lineTo(-hw * 0.60, hh * 0.88)
  ctx.lineTo(-hw * 0.94, hh * 0.80)
  // Undercut left aerodynamic waist
  ctx.lineTo(-hw * 0.92, hh * 0.20)
  ctx.quadraticCurveTo(-hw * 0.58, -hh * 0.05, -hw * 0.92, -hh * 0.30)
  // Front left fender
  ctx.lineTo(-hw * 0.94, -hh * 0.86)
  ctx.closePath()
  ctx.fill()

  // Bold Crimson Red Center Racing Livery Stripes
  ctx.fillStyle = redPrimary
  ctx.fillRect(-hw * 0.12, -hh * 0.96, hw * 0.24, hh * 0.54)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(-hw * 0.02, -hh * 0.96, hw * 0.04, hh * 0.54)

  // Dual Hood Cooling NACA Vents with Dark Carbon Inset
  ctx.fillStyle = '#070910'
  ctx.beginPath()
  ctx.moveTo(-hw * 0.42, -hh * 0.76); ctx.lineTo(-hw * 0.16, -hh * 0.76)
  ctx.lineTo(-hw * 0.22, -hh * 0.52); ctx.lineTo(-hw * 0.36, -hh * 0.52)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(hw * 0.42, -hh * 0.76); ctx.lineTo(hw * 0.16, -hh * 0.76)
  ctx.lineTo(hw * 0.22, -hh * 0.52); ctx.lineTo(hw * 0.36, -hh * 0.52)
  ctx.closePath()
  ctx.fill()

  // NACA Vent Red Accent Trim
  ctx.strokeStyle = redPrimary
  ctx.lineWidth = 1.4
  ctx.strokeRect(-hw * 0.42, -hh * 0.76, hw * 0.26, 1.5)
  ctx.strokeRect(hw * 0.16, -hh * 0.76, hw * 0.26, 1.5)

  // Aerodynamic Side Mirrors (Carbon Black + Red Line)
  ctx.fillStyle = '#080a12'
  ctx.fillRect(-hw * 0.98, -hh * 0.26, hw * 0.12, hh * 0.08)
  ctx.fillRect(hw * 0.86, -hh * 0.26, hw * 0.12, hh * 0.08)
  ctx.fillStyle = redPrimary
  ctx.fillRect(-hw * 0.97, -hh * 0.25, 2, hh * 0.06)
  ctx.fillRect(hw * 0.95, -hh * 0.25, 2, hh * 0.06)

  // ── DETAILED COCKPIT WINDOW & INTERIOR ──
  ctx.fillStyle = '#05070c'
  ctx.beginPath()
  ctx.roundRect(-hw * 0.48, -hh * 0.36, hw * 0.96, hh * 0.64, 12)
  ctx.fill()

  // Dashboard Telemetry Screen (Red glow)
  ctx.fillStyle = '#2b0000'
  ctx.fillRect(-hw * 0.20, -hh * 0.30, hw * 0.40, hh * 0.08)
  ctx.fillStyle = redPrimary
  ctx.fillRect(-hw * 0.16, -hh * 0.28, hw * 0.32, hh * 0.04)

  // ── SPORT RACING STEERING WHEEL ──
  ctx.save()
  ctx.fillStyle = '#181b24'
  ctx.fillRect(-2, -hh * 0.22, 4, hh * 0.06)

  ctx.strokeStyle = '#282c3c'
  ctx.lineWidth = 3.0
  ctx.beginPath()
  ctx.roundRect(-hw * 0.22, -hh * 0.24, hw * 0.44, hh * 0.14, 5)
  ctx.stroke()

  // Left & Right Hand Grips (Textured Red Accent)
  ctx.fillStyle = redPrimary
  ctx.fillRect(-hw * 0.24, -hh * 0.23, 4, hh * 0.12)
  ctx.fillRect(hw * 0.24 - 4, -hh * 0.23, 4, hh * 0.12)

  // Center Hub
  ctx.fillStyle = '#0d0f17'
  ctx.beginPath()
  ctx.arc(0, -hh * 0.17, 4.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#ff1e1e'
  ctx.fillRect(-6, -hh * 0.22, 12, 1.5)
  ctx.restore()

  // Driver Helmet Visible Under Glass
  ctx.fillStyle = '#0b0d14'
  ctx.beginPath()
  ctx.ellipse(0, -hh * 0.02, hw * 0.18, hh * 0.12, 0, 0, Math.PI * 2)
  ctx.fill()
  // Helmet Visor (Ruby Red Tint)
  ctx.fillStyle = redPrimary
  ctx.beginPath()
  ctx.ellipse(0, -hh * 0.05, hw * 0.14, hh * 0.04, 0, 0, Math.PI * 2)
  ctx.fill()

  // ── PANORAMIC GLASS CANOPY & WINDOWS ──
  const glassGrad = ctx.createLinearGradient(0, -hh * 0.38, 0, hh * 0.28)
  glassGrad.addColorStop(0, 'rgba(255, 30, 30, 0.45)')
  glassGrad.addColorStop(0.35, 'rgba(28, 8, 8, 0.65)')
  glassGrad.addColorStop(0.8, 'rgba(10, 4, 4, 0.90)')
  glassGrad.addColorStop(1, 'rgba(255, 30, 30, 0.25)')

  ctx.fillStyle = glassGrad
  ctx.beginPath()
  ctx.moveTo(-hw * 0.42, -hh * 0.34)
  ctx.quadraticCurveTo(0, -hh * 0.42, hw * 0.42, -hh * 0.34)
  ctx.lineTo(hw * 0.46, hh * 0.24)
  ctx.quadraticCurveTo(0, hh * 0.30, -hw * 0.46, hh * 0.24)
  ctx.closePath()
  ctx.fill()

  // Sleek Carbon A-Pillars & Roof Trim
  ctx.strokeStyle = '#080a12'
  ctx.lineWidth = 3.0
  ctx.beginPath()
  ctx.moveTo(-hw * 0.44, -hh * 0.35); ctx.lineTo(-hw * 0.48, hh * 0.25)
  ctx.moveTo(hw * 0.44, -hh * 0.35); ctx.lineTo(hw * 0.48, hh * 0.25)
  ctx.stroke()

  // Windshield Specular Gloss Reflection Arcs
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)'
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.moveTo(-hw * 0.36, -hh * 0.30)
  ctx.quadraticCurveTo(-hw * 0.10, -hh * 0.36, hw * 0.10, -hh * 0.32)
  ctx.stroke()

  // Front Quad Laser Headlights (Ultra Bright Red)
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = redPrimary
  ctx.shadowBlur = 12
  for (let hIndex = 0; hIndex < 2; hIndex++) {
    const hy = -hh * 0.88 + hIndex * hh * 0.05
    ctx.fillRect(-hw * 0.86, hy, 5, 2.5)
    ctx.fillRect(hw * 0.86 - 5, hy, 5, 2.5)
  }
  ctx.shadowBlur = 0

  // Rear Transverse Carbon Wing & Endplates (with Red Wing Flap)
  ctx.fillStyle = '#06080e'
  ctx.fillRect(-hw * 0.94, hh * 0.72, hw * 1.88, hh * 0.08)
  ctx.fillStyle = redPrimary
  ctx.fillRect(-hw * 0.90, hh * 0.74, hw * 1.80, hh * 0.035)

  // Full-Width LED Red Rear Light Strip
  ctx.fillStyle = redPrimary
  ctx.shadowColor = redPrimary
  ctx.shadowBlur = 8
  ctx.fillRect(-hw * 0.84, hh * 0.86, hw * 1.68, 2.5)
  ctx.shadowBlur = 0
}

/* ═══════════════════════════════════════════════════════════════
   MODEL 04: TEMPEST R (Rally / Dakar Off-Road Monster)
   ═══════════════════════════════════════════════════════════════ */
function drawCarTempest(ctx, hw, hh, skin, st, pCol, sCol, aCol, t) {
  // Heavy All-Terrain Tires (Extra wide with rugged teeth)
  drawSportsWheel(ctx, -hw * 0.88, -hh * 0.50, hw * 0.32, hh * 0.34, pCol, true)
  drawSportsWheel(ctx, hw * 0.88, -hh * 0.50, hw * 0.32, hh * 0.34, pCol, true)
  drawSportsWheel(ctx, -hw * 0.88, hh * 0.46, hw * 0.34, hh * 0.36, pCol, true)
  drawSportsWheel(ctx, hw * 0.88, hh * 0.46, hw * 0.34, hh * 0.36, pCol, true)

  // Heavy Skid Plate & Chassis Armor
  ctx.fillStyle = '#14161f'
  ctx.beginPath()
  ctx.roundRect(-hw * 0.86, -hh * 0.98, hw * 1.72, hh * 1.94, 8)
  ctx.fill()

  // Muscular Dakar Rally Widebody
  const bodyGrad = ctx.createLinearGradient(-hw * 0.85, 0, hw * 0.85, 0)
  bodyGrad.addColorStop(0, aCol)
  bodyGrad.addColorStop(0.2, pCol)
  bodyGrad.addColorStop(0.5, pCol)
  bodyGrad.addColorStop(0.8, pCol)
  bodyGrad.addColorStop(1, aCol)

  ctx.fillStyle = bodyGrad
  ctx.beginPath()
  // Heavy square front bumper
  ctx.moveTo(-hw * 0.68, -hh * 0.94)
  ctx.lineTo(hw * 0.68, -hh * 0.94)
  // Front right box flare
  ctx.lineTo(hw * 0.96, -hh * 0.72)
  ctx.lineTo(hw * 0.90, -hh * 0.30)
  // Dakar side waist
  ctx.lineTo(hw * 0.80, hh * 0.18)
  // Rear right box flare
  ctx.lineTo(hw * 0.96, hh * 0.34)
  ctx.lineTo(hw * 0.92, hh * 0.74)
  // Rear heavy bumper
  ctx.lineTo(hw * 0.68, hh * 0.90)
  ctx.lineTo(-hw * 0.68, hh * 0.90)
  // Rear left box flare
  ctx.lineTo(-hw * 0.92, hh * 0.74)
  ctx.lineTo(-hw * 0.96, hh * 0.34)
  // Dakar left side waist
  ctx.lineTo(-hw * 0.80, hh * 0.18)
  // Front left box flare
  ctx.lineTo(-hw * 0.90, -hh * 0.30)
  ctx.lineTo(-hw * 0.96, -hh * 0.72)
  ctx.closePath()
  ctx.fill()

  // Front Steel Bullbar / Skid Guard Plate
  ctx.fillStyle = '#222530'
  ctx.fillRect(-hw * 0.50, -hh * 0.96, hw * 1.0, hh * 0.08)
  ctx.fillStyle = '#ffcc00'
  // Dual recovery hooks
  ctx.fillRect(-hw * 0.32, -hh * 0.99, 4, 6)
  ctx.fillRect(hw * 0.32 - 4, -hh * 0.99, 4, 6)

  // Hood Heat Vents
  ctx.fillStyle = '#0b0c12'
  ctx.fillRect(-hw * 0.40, -hh * 0.68, hw * 0.80, hh * 0.14)
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'
  ctx.lineWidth = 1.0
  for (let v = 0; v < 3; v++) {
    const vy = -hh * 0.66 + v * hh * 0.04
    ctx.beginPath(); ctx.moveTo(-hw * 0.36, vy); ctx.lineTo(hw * 0.36, vy); ctx.stroke()
  }

  // Snorkel intake (right pillar)
  ctx.fillStyle = '#1c1e28'
  ctx.fillRect(hw * 0.54, -hh * 0.45, hw * 0.14, hh * 0.35)
  ctx.fillStyle = '#0a0a0f'
  ctx.fillRect(hw * 0.52, -hh * 0.48, hw * 0.18, hh * 0.08)

  // Reinforced Glass & Internal Roll Cage
  ctx.fillStyle = '#081018'
  ctx.beginPath()
  ctx.roundRect(-hw * 0.52, -hh * 0.30, hw * 1.04, hh * 0.50, 4)
  ctx.fill()

  // Roll Cage Tubes (Bright steel structural cross-bars)
  ctx.strokeStyle = '#5a6278'
  ctx.lineWidth = 2.4
  ctx.beginPath()
  ctx.moveTo(-hw * 0.46, -hh * 0.26); ctx.lineTo(hw * 0.46, hh * 0.16)
  ctx.moveTo(hw * 0.46, -hh * 0.26); ctx.lineTo(-hw * 0.46, hh * 0.16)
  ctx.moveTo(-hw * 0.46, -hh * 0.26); ctx.lineTo(hw * 0.46, -hh * 0.26)
  ctx.moveTo(-hw * 0.46, hh * 0.16); ctx.lineTo(hw * 0.46, hh * 0.16)
  ctx.stroke()

  // ROOF RALLY LIGHT POD BAR (4 Ultra-Bright circular projector lamps)
  ctx.fillStyle = '#181a24'
  ctx.fillRect(-hw * 0.60, -hh * 0.34, hw * 1.20, hh * 0.07)
  for (let lp = 0; lp < 4; lp++) {
    const lx = -hw * 0.45 + lp * (hw * 0.30)
    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = '#ffea00'
    ctx.shadowBlur = 12
    ctx.beginPath()
    ctx.arc(lx, -hh * 0.32, 4.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.strokeStyle = '#333745'
    ctx.lineWidth = 1.0
    ctx.stroke()
  }

  // High-Mount Rally Tail Spoiler
  ctx.fillStyle = '#0a0c12'
  ctx.fillRect(-hw * 0.80, hh * 0.74, hw * 1.60, hh * 0.10)
  ctx.fillStyle = pCol
  ctx.fillRect(-hw * 0.76, hh * 0.76, hw * 1.52, hh * 0.04)

  // Mud flaps
  ctx.fillStyle = '#06070a'
  ctx.fillRect(-hw * 0.94, hh * 0.80, hw * 0.22, hh * 0.08)
  ctx.fillRect(hw * 0.72, hh * 0.80, hw * 0.22, hh * 0.08)

}

/* ═══════════════════════════════════════════════════════════════
   MODEL 05: TITAN RS (Heavy GT3 Muscle Touring Car)
   ═══════════════════════════════════════════════════════════════ */
function drawCarTitan(ctx, hw, hh, skin, st, pCol, sCol, aCol, t) {
  // Ultra-Wide Deep-Dish Slicks
  drawSportsWheel(ctx, -hw * 0.86, -hh * 0.52, hw * 0.32, hh * 0.30, pCol)
  drawSportsWheel(ctx, hw * 0.86, -hh * 0.52, hw * 0.32, hh * 0.30, pCol)
  drawSportsWheel(ctx, -hw * 0.88, hh * 0.46, hw * 0.34, hh * 0.34, pCol)
  drawSportsWheel(ctx, hw * 0.88, hh * 0.46, hw * 0.34, hh * 0.34, pCol)

  // Carbon Front Splitter with dual dive planes / canards
  ctx.fillStyle = '#0a0b10'
  ctx.beginPath()
  ctx.roundRect(-hw * 0.94, -hh * 0.98, hw * 1.88, hh * 1.94, 4)
  ctx.fill()

  // Widebody Muscular GT3 Body
  const bodyGrad = ctx.createLinearGradient(-hw * 0.85, 0, hw * 0.85, 0)
  bodyGrad.addColorStop(0, aCol)
  bodyGrad.addColorStop(0.18, pCol)
  bodyGrad.addColorStop(0.5, pCol)
  bodyGrad.addColorStop(0.82, pCol)
  bodyGrad.addColorStop(1, aCol)

  ctx.fillStyle = bodyGrad
  ctx.beginPath()
  // Square front nose
  ctx.moveTo(-hw * 0.72, -hh * 0.96)
  ctx.lineTo(hw * 0.72, -hh * 0.96)
  // Boxy front fender arch
  ctx.lineTo(hw * 0.92, -hh * 0.72)
  ctx.lineTo(hw * 0.88, -hh * 0.32)
  // GT3 muscle waist
  ctx.lineTo(hw * 0.82, hh * 0.18)
  // Boxy rear haunch
  ctx.lineTo(hw * 0.94, hh * 0.32)
  ctx.lineTo(hw * 0.92, hh * 0.72)
  // Rear bumper
  ctx.lineTo(hw * 0.74, hh * 0.92)
  ctx.lineTo(-hw * 0.74, hh * 0.92)
  // Left rear haunch
  ctx.lineTo(-hw * 0.92, hh * 0.72)
  ctx.lineTo(-hw * 0.94, hh * 0.32)
  // Left waist
  ctx.lineTo(-hw * 0.82, hh * 0.18)
  // Left front fender
  ctx.lineTo(-hw * 0.88, -hh * 0.32)
  ctx.lineTo(-hw * 0.92, -hh * 0.72)
  ctx.closePath()
  ctx.fill()

  // Dual GT3 Front Canards (Aerodynamic dive planes)
  ctx.fillStyle = '#06070a'
  ctx.fillRect(-hw * 0.98, -hh * 0.88, hw * 0.14, 4)
  ctx.fillRect(hw * 0.84, -hh * 0.88, hw * 0.14, 4)

  // Hood Power Bulge & Massive Heat Extractor
  ctx.fillStyle = '#141620'
  ctx.beginPath()
  ctx.moveTo(-hw * 0.36, -hh * 0.86); ctx.lineTo(hw * 0.36, -hh * 0.86)
  ctx.lineTo(hw * 0.42, -hh * 0.40); ctx.lineTo(-hw * 0.42, -hh * 0.40)
  ctx.closePath()
  ctx.fill()

  // Center Racing Stripe
  ctx.fillStyle = sCol
  ctx.globalAlpha = 0.65
  ctx.fillRect(-hw * 0.08, -hh * 0.96, hw * 0.16, hh * 1.84)
  ctx.globalAlpha = 1.0

  // Dual LED Headlight Clusters
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = '#00d4ff'
  ctx.shadowBlur = 8
  ctx.fillRect(-hw * 0.76, -hh * 0.92, hw * 0.22, hh * 0.06)
  ctx.fillRect(hw * 0.54, -hh * 0.92, hw * 0.22, hh * 0.06)
  ctx.shadowBlur = 0

  // Fastback Greenhouse Glass & Louvred Rear Window
  const fastbackGrad = ctx.createLinearGradient(0, -hh * 0.32, 0, hh * 0.30)
  fastbackGrad.addColorStop(0, 'rgba(180,210,240,0.6)')
  fastbackGrad.addColorStop(0.4, 'rgba(30,45,70,0.85)')
  fastbackGrad.addColorStop(1, 'rgba(8,10,16,0.98)')

  ctx.fillStyle = fastbackGrad
  ctx.beginPath()
  ctx.roundRect(-hw * 0.50, -hh * 0.32, hw * 1.0, hh * 0.64, 4)
  ctx.fill()

  // Rear Window Fastback Louvres
  ctx.fillStyle = '#10121a'
  for (let r = 0; r < 4; r++) {
    const ry = hh * 0.04 + r * hh * 0.07
    ctx.fillRect(-hw * 0.42, ry, hw * 0.84, 3)
  }

  // MASSIVE GT3 REAR CARBON WING (Mounted on twin uprights)
  ctx.fillStyle = '#181a24'
  ctx.fillRect(-hw * 0.32, hh * 0.62, 5, hh * 0.18)
  ctx.fillRect(hw * 0.32 - 5, hh * 0.62, 5, hh * 0.18)

  // Main high-downforce airfoil
  ctx.fillStyle = '#0b0d14'
  ctx.fillRect(-hw * 0.98, hh * 0.74, hw * 1.96, hh * 0.10)
  ctx.fillStyle = pCol
  ctx.fillRect(-hw * 0.94, hh * 0.76, hw * 1.88, hh * 0.03)

  // Vertical GT3 Wing Endplates
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(-hw * 1.02, hh * 0.68, 5, hh * 0.22)
  ctx.fillRect(hw * 1.02 - 5, hh * 0.68, 5, hh * 0.22)

  // Horizontal OLED Taillight Bar
  ctx.fillStyle = '#ff1100'
  ctx.shadowColor = '#ff1100'
  ctx.shadowBlur = 8
  ctx.fillRect(-hw * 0.68, hh * 0.88, hw * 1.36, 4)
  ctx.shadowBlur = 0

}

/* ═══════════════════════════════════════════════════════════════
   MODEL 06: THOR MJÖLNIR (God of Thunder / Lightning Hypercar)
   ═══════════════════════════════════════════════════════════════ */
function drawCarPhantom(ctx, hw, hh, skin, st, pCol, sCol, aCol, t) {
  const cyanPrimary = '#00d4ff'
  const goldSecondary = '#ffd700'
  const armorDark = '#0f172a'
  const time = (typeof t === 'number') ? t : (Date.now() * 0.001)

  // Asgardian Electric Underglow Plasma Halo
  ctx.fillStyle = cyanPrimary
  ctx.shadowColor = cyanPrimary
  ctx.shadowBlur = 20
  ctx.globalAlpha = 0.40
  ctx.beginPath()
  ctx.ellipse(0, 0, hw * 0.94, hh * 0.90, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1.0
  ctx.shadowBlur = 0

  // Hammer-Forged Sports Wheels with Golden Rune Hub
  drawSportsWheel(ctx, -hw * 0.86, -hh * 0.54, hw * 0.28, hh * 0.28, goldSecondary)
  drawSportsWheel(ctx, hw * 0.86, -hh * 0.54, hw * 0.28, hh * 0.28, goldSecondary)
  drawSportsWheel(ctx, -hw * 0.88, hh * 0.44, hw * 0.30, hh * 0.32, goldSecondary)
  drawSportsWheel(ctx, hw * 0.88, hh * 0.44, hw * 0.30, hh * 0.32, goldSecondary)

  // Asgardian Titanium Underfloor
  ctx.fillStyle = '#060a12'
  ctx.beginPath()
  ctx.moveTo(-hw * 0.94, -hh * 0.96); ctx.lineTo(hw * 0.94, -hh * 0.96)
  ctx.lineTo(hw * 0.90, hh * 0.94); ctx.lineTo(-hw * 0.90, hh * 0.94)
  ctx.closePath()
  ctx.fill()

  // Front Asgardian Lightning Fang Splitters
  ctx.fillStyle = '#0a1424'
  ctx.beginPath()
  ctx.moveTo(-hw * 0.96, -hh * 0.92); ctx.lineTo(hw * 0.96, -hh * 0.92)
  ctx.lineTo(hw * 0.88, -hh * 0.82); ctx.lineTo(-hw * 0.88, -hh * 0.82)
  ctx.closePath()
  ctx.fill()

  // Main Midnight Blue & Gold Mjölnir Body
  const bodyGrad = ctx.createLinearGradient(-hw * 0.92, 0, hw * 0.92, 0)
  bodyGrad.addColorStop(0, armorDark)
  bodyGrad.addColorStop(0.18, '#0369a1')
  bodyGrad.addColorStop(0.5, '#0284c7')
  bodyGrad.addColorStop(0.82, '#0369a1')
  bodyGrad.addColorStop(1, armorDark)

  ctx.fillStyle = bodyGrad
  ctx.beginPath()
  // Mjölnir Hammer nose
  ctx.moveTo(-hw * 0.46, -hh * 0.96)
  ctx.lineTo(hw * 0.46, -hh * 0.96)
  // Front right pontoon
  ctx.lineTo(hw * 0.94, -hh * 0.86)
  ctx.lineTo(hw * 0.92, -hh * 0.30)
  // Undercut aerodynamic waist
  ctx.quadraticCurveTo(hw * 0.58, -hh * 0.05, hw * 0.92, hh * 0.20)
  // Rear right haunch
  ctx.lineTo(hw * 0.94, hh * 0.80)
  ctx.lineTo(hw * 0.60, hh * 0.88)
  // Rear center nozzle
  ctx.lineTo(0, hh * 0.94)
  // Rear left haunch
  ctx.lineTo(-hw * 0.60, hh * 0.88)
  ctx.lineTo(-hw * 0.94, hh * 0.80)
  // Left undercut waist
  ctx.lineTo(-hw * 0.92, hh * 0.20)
  ctx.quadraticCurveTo(-hw * 0.58, -hh * 0.05, -hw * 0.92, -hh * 0.30)
  // Front left pontoon
  ctx.lineTo(-hw * 0.94, -hh * 0.86)
  ctx.closePath()
  ctx.fill()

  // ── DUAL LIGHTNING ARCS & ASGARDIAN RUNES ON HOOD ──
  ctx.strokeStyle = cyanPrimary
  ctx.shadowColor = cyanPrimary
  ctx.shadowBlur = 10
  ctx.lineWidth = 1.8
  ctx.beginPath()
  ctx.moveTo(-hw * 0.35, -hh * 0.88); ctx.lineTo(-hw * 0.15, -hh * 0.68); ctx.lineTo(-hw * 0.28, -hh * 0.58); ctx.lineTo(-hw * 0.10, -hh * 0.42)
  ctx.moveTo(hw * 0.35, -hh * 0.88); ctx.lineTo(hw * 0.15, -hh * 0.68); ctx.lineTo(hw * 0.28, -hh * 0.58); ctx.lineTo(hw * 0.10, -hh * 0.42)
  ctx.stroke()
  ctx.shadowBlur = 0

  // Gold Nose Inlay & Hammer Crest
  ctx.fillStyle = goldSecondary
  ctx.fillRect(-hw * 0.18, -hh * 0.94, hw * 0.36, 3)
  ctx.fillRect(-3, -hh * 0.94, 6, hh * 0.12)

  // ── DETAILED COCKPIT & GOLDEN VIKING YOKE ──
  ctx.fillStyle = '#030814'
  ctx.beginPath()
  ctx.roundRect(-hw * 0.48, -hh * 0.36, hw * 0.96, hh * 0.64, 12)
  ctx.fill()

  // Dashboard Telemetry Screen (Lightning Cyan glow)
  ctx.fillStyle = '#082f49'
  ctx.fillRect(-hw * 0.20, -hh * 0.30, hw * 0.40, hh * 0.08)
  ctx.fillStyle = cyanPrimary
  ctx.fillRect(-hw * 0.16, -hh * 0.28, hw * 0.32, hh * 0.04)

  // Golden Steering Yoke
  ctx.save()
  ctx.fillStyle = '#1e293b'
  ctx.fillRect(-2, -hh * 0.22, 4, hh * 0.06)
  ctx.strokeStyle = goldSecondary
  ctx.lineWidth = 2.8
  ctx.beginPath()
  ctx.roundRect(-hw * 0.22, -hh * 0.24, hw * 0.44, hh * 0.14, 5)
  ctx.stroke()
  ctx.fillStyle = cyanPrimary
  ctx.fillRect(-hw * 0.24, -hh * 0.23, 4, hh * 0.12)
  ctx.fillRect(hw * 0.24 - 4, -hh * 0.23, 4, hh * 0.12)
  ctx.restore()

  // Driver Helmet (Asgardian Winged Silver & Gold)
  ctx.fillStyle = '#1e293b'
  ctx.beginPath()
  ctx.ellipse(0, -hh * 0.02, hw * 0.18, hh * 0.12, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = goldSecondary
  ctx.beginPath()
  ctx.ellipse(0, -hh * 0.05, hw * 0.14, hh * 0.04, 0, 0, Math.PI * 2)
  ctx.fill()

  // ── ASGARDIAN CRYSTAL GLASS CANOPY ──
  const glassGrad = ctx.createLinearGradient(0, -hh * 0.38, 0, hh * 0.28)
  glassGrad.addColorStop(0, 'rgba(0, 212, 255, 0.50)')
  glassGrad.addColorStop(0.35, 'rgba(8, 47, 73, 0.65)')
  glassGrad.addColorStop(0.8, 'rgba(2, 6, 23, 0.90)')
  glassGrad.addColorStop(1, 'rgba(0, 212, 255, 0.30)')

  ctx.fillStyle = glassGrad
  ctx.beginPath()
  ctx.moveTo(-hw * 0.42, -hh * 0.34)
  ctx.quadraticCurveTo(0, -hh * 0.42, hw * 0.42, -hh * 0.34)
  ctx.lineTo(hw * 0.46, hh * 0.24)
  ctx.quadraticCurveTo(0, hh * 0.30, -hw * 0.46, hh * 0.24)
  ctx.closePath()
  ctx.fill()

  // Gold A-Pillars & Roof Frame
  ctx.strokeStyle = goldSecondary
  ctx.lineWidth = 2.4
  ctx.beginPath()
  ctx.moveTo(-hw * 0.44, -hh * 0.35); ctx.lineTo(-hw * 0.48, hh * 0.25)
  ctx.moveTo(hw * 0.44, -hh * 0.35); ctx.lineTo(hw * 0.48, hh * 0.25)
  ctx.stroke()

  // Front Quad Spear Laser Headlights (Ultra-Bright Lightning Cyan + Gold)
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = cyanPrimary
  ctx.shadowBlur = 14
  for (let hIndex = 0; hIndex < 2; hIndex++) {
    const hy = -hh * 0.88 + hIndex * hh * 0.05
    ctx.fillRect(-hw * 0.86, hy, 5, 2.5)
    ctx.fillRect(hw * 0.86 - 5, hy, 5, 2.5)
  }
  ctx.shadowBlur = 0

  // ── VALKYRIE GOLD & TITANIUM REAR WING ──
  ctx.fillStyle = armorDark
  ctx.fillRect(-hw * 0.94, hh * 0.72, hw * 1.88, hh * 0.08)
  ctx.fillStyle = goldSecondary
  ctx.fillRect(-hw * 0.90, hh * 0.74, hw * 1.80, hh * 0.035)

  // Full-Width LED Lightning Cyan Rear Light Bar
  ctx.fillStyle = cyanPrimary
  ctx.shadowColor = cyanPrimary
  ctx.shadowBlur = 8
  ctx.fillRect(-hw * 0.84, hh * 0.86, hw * 1.68, 2.5)
  ctx.shadowBlur = 0
}

/* ═══════════════════════════════════════════════════════════════
   DYNAMIC MOTORSPORT EXHAUST FLAME (EXACT MATCH TO USER PHOTO)
   ═══════════════════════════════════════════════════════════════ */
function drawRealisticExhaustFlames(ctx, hw, hh, st, t, carId) {
  // Turn electric blue when nitro is active OR when a nitro boost pickup is collected!
  const isNitro = !!(st && (st.nitroActive || st.boosted))
  const isSpeedZone = !!(st && st.activeEvent === 'speed_zone')
  const spd = (st && typeof st.speed === 'number') ? st.speed : 16
  const time = (typeof t === 'number') ? t : (Date.now() * 0.001)
  
  // Speed ratio from 0 to 1 (scales smoothly with driving speed)
  const spdRatio = Math.max(0, Math.min(1, spd / 34))

  // Prominent, bold flame ALWAYS present behind the car
  const baseFlameLen = 34 + spdRatio * 38
  const flutter = (Math.sin(time * 38) * 3.0 + Math.cos(time * 58) * 1.8) * (0.8 + spdRatio * 0.5)
  const flLen = isNitro ? (baseFlameLen * 1.75 + flutter * 2.5) : (baseFlameLen + flutter)
  const flWidth = isNitro ? (hw * 0.70) : (hw * 0.58 + spdRatio * 3.0)

  // Colors: Normal = exact warm amber-orange with cream-yellow core from Photo, Nitro = pure electric cyan-blue with white core
  const outerColor = isNitro
    ? 'rgba(0, 145, 255, 0.98)'
    : (isSpeedZone ? 'rgba(255, 60, 0, 0.98)' : 'rgba(230, 85, 0, 0.96)')
  const innerColor = isNitro
    ? 'rgba(255, 255, 255, 1.0)'
    : (isSpeedZone ? 'rgba(255, 245, 160, 1.0)' : 'rgba(255, 240, 120, 1.0)')

  ctx.save()
  ctx.globalAlpha = 1.0
  
  // Rear center diffuser exhaust outlet position (at the rear edge of the car)
  const rearY = hh * 0.88

  ctx.shadowColor = isNitro ? '#00d4ff' : '#ff6600'
  ctx.shadowBlur = isNitro ? 24 : (14 + spdRatio * 8)

  // 1. Outer Flame Triangle (Clean sharp triangle pointing backwards)
  ctx.fillStyle = outerColor
  ctx.beginPath()
  ctx.moveTo(-flWidth / 2, rearY)
  ctx.lineTo(0, rearY + flLen)
  ctx.lineTo(flWidth / 2, rearY)
  ctx.closePath()
  ctx.fill()

  // 2. Inner Core Triangle (Centered bright radiant core)
  ctx.fillStyle = innerColor
  ctx.beginPath()
  ctx.moveTo(-flWidth * 0.36, rearY)
  ctx.lineTo(0, rearY + flLen * 0.58)
  ctx.lineTo(flWidth * 0.36, rearY)
  ctx.closePath()
  ctx.fill()

  // 3. Trailing sparks popping off the flame tip
  const sparkCount = isNitro ? 6 : (spdRatio > 0.2 ? 3 : 2)
  for (let i = 0; i < sparkCount; i++) {
    ctx.fillStyle = isNitro ? '#00f0ff' : '#ffd54f'
    ctx.beginPath()
    const sx = (Math.random() - 0.5) * (flWidth * 0.8)
    const sy = rearY + flLen * 0.70 + Math.random() * (flLen * 0.35)
    ctx.arc(sx, sy, Math.random() * 1.8 + 0.8, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.shadowBlur = 0
  ctx.restore()
}

/* ═══════════════════════════════════════════════════════════════
   MAIN DRAW PLAYER DISPATCHER (Exact Selected Model Rendering)
   ═══════════════════════════════════════════════════════════════ */
function drawPlayer(ctx, x, y, skin, st) {
  const w = PW, h = PH, hw = w / 2, hh = h / 2
  const cx = x + hw, cy = y + hh
  const pCol = skin.primary || '#e10600'
  const sCol = skin.secondary || '#ffffff'
  const aCol = skin.accent || '#990400'
  const steer = (st.steerAngle || 0) * 0.045
  const t = st.time || 0
  const carId = (skin && skin.id) ? skin.id.toLowerCase() : 'apex'

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(steer)

  // ──── 1. DYNAMIC GROUND SHADOW (Exact from Video) ────
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
  ctx.beginPath()
  ctx.ellipse(0, 12, hw * 1.05, hh * 0.75, 0, 0, Math.PI * 2)
  ctx.fill()

  // ──── 2. DISPATCH TO EXACT SELECTED CAR MODEL ────
  switch (carId) {
    case 'vortex':
      drawCarVortex(ctx, hw, hh, skin, st, pCol, sCol, aCol, t)
      break
    case 'falcon':
      drawCarFalcon(ctx, hw, hh, skin, st, pCol, sCol, aCol, t)
      break
    case 'tempest':
      drawCarTempest(ctx, hw, hh, skin, st, pCol, sCol, aCol, t)
      break
    case 'titan':
      drawCarTitan(ctx, hw, hh, skin, st, pCol, sCol, aCol, t)
      break
    case 'phantom':
      drawCarPhantom(ctx, hw, hh, skin, st, pCol, sCol, aCol, t)
      break
    case 'apex':
    default:
      drawCarApex(ctx, hw, hh, skin, st, pCol, sCol, aCol, t)
      break
  }

  // ──── 3. RACING NUMBER '09' IN CENTER (From Video Preview) ────
  if (carId === 'apex') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'
    ctx.font = '900 11px Orbitron, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('09', 0, hh * 0.28)
  }

  // ──── 4. DYNAMIC REALISTIC EXHAUST FLAMES & SPARKS (DRAWN AFTER CAR SO FULLY VISIBLE) ────
  drawRealisticExhaustFlames(ctx, hw, hh, st, t, carId)

  ctx.restore()
}

/* ═══════════════════════════════════════════════════════════════
   ENEMY / TRAFFIC VEHICLES — PREMIUM QUALITY RENDERING
   ═══════════════════════════════════════════════════════════════ */
function drawTraffic(ctx, t) {
  const { x, y, w, h, color, vType } = t
  const cx = x + w / 2, cy = y + h / 2, hw = w / 2, hh = h / 2
  const vId = (vType && vType.id) ? vType.id : 'gt_coupe'

  ctx.save()
  ctx.translate(cx, cy)

  // 1. Soft Ground Shadow (elliptical, realistic contact patch)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.50)'
  ctx.beginPath()
  ctx.ellipse(2, 8, hw * 1.12, hh * 0.88, 0, 0, Math.PI * 2)
  ctx.fill()

  // 2. Headlight Forward Light Beams (warm glow projected onto asphalt)
  const beamG = ctx.createLinearGradient(0, -hh, 0, -hh - 120)
  beamG.addColorStop(0, vType.headlightColor || 'rgba(255, 245, 210, 0.45)')
  beamG.addColorStop(0.30, 'rgba(255, 240, 195, 0.18)')
  beamG.addColorStop(1, 'transparent')
  ctx.fillStyle = beamG
  ctx.beginPath()
  ctx.moveTo(-hw * 0.68, -hh)
  ctx.lineTo(-hw * 1.40, -hh - 120)
  ctx.lineTo(hw * 1.40, -hh - 120)
  ctx.lineTo(hw * 0.68, -hh)
  ctx.closePath()
  ctx.fill()

  // 3. Dispatch to vehicle-specific premium renderer
  switch (vId) {
    case 'hypercar':
      drawTrafficHypercar(ctx, hw, hh, color)
      break
    case 'gt3_racer':
      drawTrafficGT3(ctx, hw, hh, color)
      break
    case 'open_wheel':
      drawTrafficOpenWheel(ctx, hw, hh, color)
      break
    case 'sedan':
      drawTrafficSedanPremium(ctx, hw, hh, color, vType)
      break
    case 'suv':
      drawTrafficSUVPremium(ctx, hw, hh, color, vType)
      break
    case 'transporter':
      drawTrafficTransporterPremium(ctx, hw, hh, color, vType)
      break
    case 'gt_coupe':
    default:
      drawTrafficGTCoupePremium(ctx, hw, hh, color, vType)
      break
  }

  ctx.restore()
}

/* ── GT COUPE (Premium Supercar) ── */
function drawTrafficGTCoupePremium(ctx, hw, hh, color, vType) {
  // Wheels with brake disc detail
  drawSportsWheel(ctx, -hw * 0.86, -hh * 0.54, hw * 0.26, hh * 0.28, color)
  drawSportsWheel(ctx, hw * 0.86, -hh * 0.54, hw * 0.26, hh * 0.28, color)
  drawSportsWheel(ctx, -hw * 0.88, hh * 0.46, hw * 0.28, hh * 0.30, color)
  drawSportsWheel(ctx, hw * 0.88, hh * 0.46, hw * 0.28, hh * 0.30, color)

  // Metallic body with side-to-side gradient (3D illusion)
  const bodyGrad = ctx.createLinearGradient(-hw, 0, hw, 0)
  bodyGrad.addColorStop(0, '#080a10')
  bodyGrad.addColorStop(0.18, color)
  bodyGrad.addColorStop(0.50, color)
  bodyGrad.addColorStop(0.82, color)
  bodyGrad.addColorStop(1, '#080a10')
  ctx.fillStyle = bodyGrad

  // Sleek GT coupe silhouette with curved nose
  ctx.beginPath()
  ctx.moveTo(-hw * 0.38, -hh * 0.96)
  ctx.quadraticCurveTo(0, -hh * 1.06, hw * 0.38, -hh * 0.96)
  ctx.lineTo(hw * 0.72, -hh * 0.68)
  ctx.lineTo(hw * 0.86, -hh * 0.20)
  ctx.lineTo(hw * 0.88, hh * 0.40)
  ctx.lineTo(hw * 0.72, hh * 0.92)
  ctx.lineTo(-hw * 0.72, hh * 0.92)
  ctx.lineTo(-hw * 0.88, hh * 0.40)
  ctx.lineTo(-hw * 0.86, -hh * 0.20)
  ctx.lineTo(-hw * 0.72, -hh * 0.68)
  ctx.closePath()
  ctx.fill()

  // Specular highlight (metallic sheen across the hood)
  const sheenG = ctx.createLinearGradient(-hw * 0.3, -hh * 0.9, hw * 0.1, -hh * 0.1)
  sheenG.addColorStop(0, 'rgba(255,255,255,0)')
  sheenG.addColorStop(0.45, 'rgba(255,255,255,0.18)')
  sheenG.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = sheenG
  ctx.fill()

  // Hood crease line
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.lineWidth = 0.8
  ctx.beginPath()
  ctx.moveTo(0, -hh * 0.94)
  ctx.lineTo(0, -hh * 0.40)
  ctx.stroke()

  // Front air intakes
  ctx.fillStyle = '#060810'
  ctx.fillRect(-hw * 0.55, -hh * 0.72, hw * 0.30, hh * 0.06)
  ctx.fillRect(hw * 0.25, -hh * 0.72, hw * 0.30, hh * 0.06)

  // Windshield & Glass Canopy (smooth tinted)
  const glassGrad = ctx.createLinearGradient(0, -hh * 0.32, 0, hh * 0.28)
  glassGrad.addColorStop(0, 'rgba(60,80,120,0.85)')
  glassGrad.addColorStop(0.5, 'rgba(15,25,45,0.92)')
  glassGrad.addColorStop(1, 'rgba(8,12,22,0.90)')
  ctx.fillStyle = glassGrad
  ctx.beginPath()
  ctx.moveTo(-hw * 0.58, -hh * 0.32)
  ctx.quadraticCurveTo(-hw * 0.56, -hh * 0.42, -hw * 0.34, -hh * 0.42)
  ctx.lineTo(hw * 0.34, -hh * 0.42)
  ctx.quadraticCurveTo(hw * 0.56, -hh * 0.42, hw * 0.58, -hh * 0.32)
  ctx.lineTo(hw * 0.52, hh * 0.16)
  ctx.lineTo(-hw * 0.52, hh * 0.16)
  ctx.closePath()
  ctx.fill()

  // Glass frame highlight
  ctx.strokeStyle = 'rgba(255,255,255,0.20)'
  ctx.lineWidth = 0.6
  ctx.stroke()

  // Roof pillar
  ctx.fillStyle = color
  ctx.fillRect(-hw * 0.42, -hh * 0.12, hw * 0.84, hh * 0.10)

  // Rear diffuser
  ctx.fillStyle = '#0a0c12'
  ctx.fillRect(-hw * 0.64, hh * 0.86, hw * 1.28, hh * 0.08)
  // Diffuser vents
  ctx.fillStyle = '#181c24'
  for (let v = 0; v < 4; v++) {
    ctx.fillRect(-hw * 0.52 + v * hw * 0.28, hh * 0.87, hw * 0.14, hh * 0.05)
  }

  // Rear spoiler lip
  ctx.fillStyle = '#0c0e16'
  ctx.fillRect(-hw * 0.80, hh * 0.78, hw * 1.60, hh * 0.06)
  ctx.fillStyle = color
  ctx.fillRect(-hw * 0.76, hh * 0.80, hw * 1.52, hh * 0.02)

  // Headlights (LED DRL style with glow)
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = '#ffffff'
  ctx.shadowBlur = 8
  ctx.beginPath()
  ctx.roundRect(-hw * 0.62, -hh * 0.94, hw * 0.26, hh * 0.05, 2)
  ctx.roundRect(hw * 0.36, -hh * 0.94, hw * 0.26, hh * 0.05, 2)
  ctx.fill()
  ctx.shadowBlur = 0

  // Taillights (LED light bar with glow)
  ctx.fillStyle = '#ff1100'
  ctx.shadowColor = '#ff1100'
  ctx.shadowBlur = 12
  ctx.beginPath()
  ctx.roundRect(-hw * 0.68, hh * 0.90, hw * 1.36, hh * 0.035, 1)
  ctx.fill()
  ctx.shadowBlur = 0

  // Side markers
  ctx.fillStyle = '#ff5500'
  ctx.fillRect(-hw * 0.88, hh * 0.20, 2, hh * 0.08)
  ctx.fillRect(hw * 0.86, hh * 0.20, 2, hh * 0.08)
}

/* ── DTM TOURING SEDAN (Premium) ── */
function drawTrafficSedanPremium(ctx, hw, hh, color, vType) {
  drawSportsWheel(ctx, -hw * 0.84, -hh * 0.52, hw * 0.26, hh * 0.28, color)
  drawSportsWheel(ctx, hw * 0.84, -hh * 0.52, hw * 0.26, hh * 0.28, color)
  drawSportsWheel(ctx, -hw * 0.86, hh * 0.46, hw * 0.28, hh * 0.30, color)
  drawSportsWheel(ctx, hw * 0.86, hh * 0.46, hw * 0.28, hh * 0.30, color)

  // Metallic body
  const bodyGrad = ctx.createLinearGradient(-hw, 0, hw, 0)
  bodyGrad.addColorStop(0, '#0a0c14')
  bodyGrad.addColorStop(0.15, color)
  bodyGrad.addColorStop(0.50, color)
  bodyGrad.addColorStop(0.85, color)
  bodyGrad.addColorStop(1, '#0a0c14')
  ctx.fillStyle = bodyGrad

  // Sedan body - muscular, squared shoulders
  ctx.beginPath()
  ctx.moveTo(-hw * 0.62, -hh * 0.94)
  ctx.lineTo(hw * 0.62, -hh * 0.94)
  ctx.lineTo(hw * 0.80, -hh * 0.70)
  ctx.lineTo(hw * 0.86, -hh * 0.20)
  ctx.lineTo(hw * 0.86, hh * 0.60)
  ctx.lineTo(hw * 0.74, hh * 0.94)
  ctx.lineTo(-hw * 0.74, hh * 0.94)
  ctx.lineTo(-hw * 0.86, hh * 0.60)
  ctx.lineTo(-hw * 0.86, -hh * 0.20)
  ctx.lineTo(-hw * 0.80, -hh * 0.70)
  ctx.closePath()
  ctx.fill()

  // Specular sheen
  const sheenG = ctx.createLinearGradient(-hw * 0.2, -hh * 0.9, hw * 0.2, -hh * 0.2)
  sheenG.addColorStop(0, 'rgba(255,255,255,0)')
  sheenG.addColorStop(0.4, 'rgba(255,255,255,0.14)')
  sheenG.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = sheenG
  ctx.fill()

  // Hood crease
  ctx.strokeStyle = 'rgba(255,255,255,0.10)'
  ctx.lineWidth = 0.7
  ctx.beginPath()
  ctx.moveTo(-hw * 0.20, -hh * 0.90)
  ctx.lineTo(-hw * 0.20, -hh * 0.40)
  ctx.moveTo(hw * 0.20, -hh * 0.90)
  ctx.lineTo(hw * 0.20, -hh * 0.40)
  ctx.stroke()

  // Front grille
  ctx.fillStyle = '#080a12'
  ctx.beginPath()
  ctx.roundRect(-hw * 0.48, -hh * 0.92, hw * 0.96, hh * 0.10, 2)
  ctx.fill()

  // Windshield & rear window
  const glassGrad = ctx.createLinearGradient(0, -hh * 0.38, 0, hh * 0.32)
  glassGrad.addColorStop(0, 'rgba(50,70,110,0.88)')
  glassGrad.addColorStop(0.5, 'rgba(15,22,40,0.92)')
  glassGrad.addColorStop(1, 'rgba(10,15,28,0.88)')
  ctx.fillStyle = glassGrad
  ctx.beginPath()
  ctx.roundRect(-hw * 0.60, -hh * 0.38, hw * 1.20, hh * 0.70, 3)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'
  ctx.lineWidth = 0.5
  ctx.stroke()

  // Roof panel & B-pillar
  ctx.fillStyle = color
  ctx.fillRect(-hw * 0.54, -hh * 0.14, hw * 1.08, hh * 0.12)

  // Trunk spoiler (DTM racing style)
  ctx.fillStyle = '#0a0c14'
  ctx.fillRect(-hw * 0.74, hh * 0.78, hw * 1.48, hh * 0.07)
  ctx.fillStyle = color
  ctx.fillRect(-hw * 0.70, hh * 0.80, hw * 1.40, hh * 0.02)

  // Headlights
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = '#ffffff'
  ctx.shadowBlur = 6
  ctx.beginPath()
  ctx.roundRect(-hw * 0.72, -hh * 0.93, hw * 0.24, hh * 0.05, 2)
  ctx.roundRect(hw * 0.48, -hh * 0.93, hw * 0.24, hh * 0.05, 2)
  ctx.fill()
  ctx.shadowBlur = 0

  // Taillights (split LED)
  ctx.fillStyle = '#ff1100'
  ctx.shadowColor = '#ff1100'
  ctx.shadowBlur = 10
  ctx.beginPath()
  ctx.roundRect(-hw * 0.70, hh * 0.88, hw * 0.28, hh * 0.04, 1)
  ctx.roundRect(hw * 0.42, hh * 0.88, hw * 0.28, hh * 0.04, 1)
  ctx.fill()
  ctx.shadowBlur = 0
}

/* ── GRAND PRIX PACE SUV (Premium) ── */
function drawTrafficSUVPremium(ctx, hw, hh, color, vType) {
  drawSportsWheel(ctx, -hw * 0.88, -hh * 0.50, hw * 0.30, hh * 0.32, color, true)
  drawSportsWheel(ctx, hw * 0.88, -hh * 0.50, hw * 0.30, hh * 0.32, color, true)
  drawSportsWheel(ctx, -hw * 0.88, hh * 0.44, hw * 0.32, hh * 0.34, color, true)
  drawSportsWheel(ctx, hw * 0.88, hh * 0.44, hw * 0.32, hh * 0.34, color, true)

  // Metallic body
  const bodyGrad = ctx.createLinearGradient(-hw, 0, hw, 0)
  bodyGrad.addColorStop(0, '#0a0c14')
  bodyGrad.addColorStop(0.15, color)
  bodyGrad.addColorStop(0.50, color)
  bodyGrad.addColorStop(0.85, color)
  bodyGrad.addColorStop(1, '#0a0c14')
  ctx.fillStyle = bodyGrad

  // Tall, muscular SUV body
  ctx.beginPath()
  ctx.moveTo(-hw * 0.72, -hh * 0.94)
  ctx.lineTo(hw * 0.72, -hh * 0.94)
  ctx.lineTo(hw * 0.88, -hh * 0.68)
  ctx.lineTo(hw * 0.90, -hh * 0.20)
  ctx.lineTo(hw * 0.90, hh * 0.68)
  ctx.lineTo(hw * 0.80, hh * 0.94)
  ctx.lineTo(-hw * 0.80, hh * 0.94)
  ctx.lineTo(-hw * 0.90, hh * 0.68)
  ctx.lineTo(-hw * 0.90, -hh * 0.20)
  ctx.lineTo(-hw * 0.88, -hh * 0.68)
  ctx.closePath()
  ctx.fill()

  // Specular highlight
  const sheenG = ctx.createLinearGradient(-hw * 0.2, -hh * 0.9, hw * 0.15, -hh * 0.2)
  sheenG.addColorStop(0, 'rgba(255,255,255,0)')
  sheenG.addColorStop(0.4, 'rgba(255,255,255,0.12)')
  sheenG.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = sheenG
  ctx.fill()

  // Hood power bulge
  ctx.fillStyle = '#101420'
  ctx.beginPath()
  ctx.roundRect(-hw * 0.36, -hh * 0.86, hw * 0.72, hh * 0.22, 3)
  ctx.fill()

  // Glass greenhouse (tall)
  const glassGrad = ctx.createLinearGradient(0, -hh * 0.42, 0, hh * 0.42)
  glassGrad.addColorStop(0, 'rgba(45,65,100,0.88)')
  glassGrad.addColorStop(0.5, 'rgba(12,18,32,0.94)')
  glassGrad.addColorStop(1, 'rgba(8,12,22,0.90)')
  ctx.fillStyle = glassGrad
  ctx.beginPath()
  ctx.roundRect(-hw * 0.64, -hh * 0.42, hw * 1.28, hh * 0.84, 4)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.lineWidth = 0.5
  ctx.stroke()

  // Roof rack rails
  ctx.strokeStyle = '#2a2e38'
  ctx.lineWidth = 2.0
  ctx.beginPath()
  ctx.moveTo(-hw * 0.56, -hh * 0.18)
  ctx.lineTo(-hw * 0.56, hh * 0.28)
  ctx.moveTo(hw * 0.56, -hh * 0.18)
  ctx.lineTo(hw * 0.56, hh * 0.28)
  ctx.stroke()

  // Amber roof light bar
  ctx.fillStyle = '#ffaa00'
  ctx.shadowColor = '#ffaa00'
  ctx.shadowBlur = 8
  ctx.beginPath()
  ctx.roundRect(-hw * 0.38, -hh * 0.22, hw * 0.76, 3.5, 2)
  ctx.fill()
  ctx.shadowBlur = 0

  // Headlights (chunky LED matrix)
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = '#ffffff'
  ctx.shadowBlur = 8
  ctx.beginPath()
  ctx.roundRect(-hw * 0.78, -hh * 0.93, hw * 0.28, hh * 0.07, 2)
  ctx.roundRect(hw * 0.50, -hh * 0.93, hw * 0.28, hh * 0.07, 2)
  ctx.fill()
  ctx.shadowBlur = 0

  // Full-width taillight bar
  ctx.fillStyle = '#ff1100'
  ctx.shadowColor = '#ff1100'
  ctx.shadowBlur = 10
  ctx.beginPath()
  ctx.roundRect(-hw * 0.76, hh * 0.86, hw * 1.52, hh * 0.04, 2)
  ctx.fill()
  ctx.shadowBlur = 0
}

/* ── PADDOCK TRANSPORTER (Premium) ── */
function drawTrafficTransporterPremium(ctx, hw, hh, color, vType) {
  // 6-wheel tandem rear axle
  drawSportsWheel(ctx, -hw * 0.90, -hh * 0.54, hw * 0.26, hh * 0.26, color)
  drawSportsWheel(ctx, hw * 0.90, -hh * 0.54, hw * 0.26, hh * 0.26, color)
  drawSportsWheel(ctx, -hw * 0.92, hh * 0.28, hw * 0.28, hh * 0.28, color)
  drawSportsWheel(ctx, hw * 0.92, hh * 0.28, hw * 0.28, hh * 0.28, color)
  drawSportsWheel(ctx, -hw * 0.92, hh * 0.60, hw * 0.28, hh * 0.28, color)
  drawSportsWheel(ctx, hw * 0.92, hh * 0.60, hw * 0.28, hh * 0.28, color)

  // Metallic cargo body
  const bodyGrad = ctx.createLinearGradient(-hw, 0, hw, 0)
  bodyGrad.addColorStop(0, '#0c0e16')
  bodyGrad.addColorStop(0.12, color)
  bodyGrad.addColorStop(0.50, color)
  bodyGrad.addColorStop(0.88, color)
  bodyGrad.addColorStop(1, '#0c0e16')
  ctx.fillStyle = bodyGrad

  // Transporter body (tall box)
  ctx.beginPath()
  ctx.roundRect(-hw * 0.86, -hh * 0.96, hw * 1.72, hh * 1.92, 4)
  ctx.fill()

  // Specular highlight on cargo wall
  const sheenG = ctx.createLinearGradient(-hw * 0.3, -hh * 0.9, hw * 0.1, 0)
  sheenG.addColorStop(0, 'rgba(255,255,255,0)')
  sheenG.addColorStop(0.4, 'rgba(255,255,255,0.10)')
  sheenG.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = sheenG
  ctx.fill()

  // Front cab windshield
  ctx.fillStyle = 'rgba(40,55,80,0.90)'
  ctx.beginPath()
  ctx.roundRect(-hw * 0.72, -hh * 0.88, hw * 1.44, hh * 0.22, 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.lineWidth = 0.5
  ctx.stroke()

  // Sun visor
  ctx.fillStyle = '#0c0e18'
  ctx.fillRect(-hw * 0.76, -hh * 0.92, hw * 1.52, hh * 0.06)

  // Cargo bay roof ribs (structural detail)
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'
  ctx.lineWidth = 0.8
  for (let rib = 0; rib < 5; rib++) {
    const ry = -hh * 0.40 + rib * (hh * 0.24)
    ctx.beginPath()
    ctx.moveTo(-hw * 0.78, ry)
    ctx.lineTo(hw * 0.78, ry)
    ctx.stroke()
  }

  // Team livery center stripe
  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  ctx.fillRect(-hw * 0.08, -hh * 0.50, hw * 0.16, hh * 1.30)

  // Clearance marker lights (amber)
  ctx.fillStyle = '#ffaa00'
  ctx.shadowColor = '#ffaa00'
  ctx.shadowBlur = 4
  ctx.fillRect(-hw * 0.82, -hh * 0.94, 4, 3)
  ctx.fillRect(hw * 0.78, -hh * 0.94, 4, 3)
  ctx.shadowBlur = 0

  // Rear loading door split
  ctx.strokeStyle = '#0a0c14'
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(0, hh * 0.68)
  ctx.lineTo(0, hh * 0.94)
  ctx.stroke()

  // Taillights
  ctx.fillStyle = '#ff1100'
  ctx.shadowColor = '#ff1100'
  ctx.shadowBlur = 8
  ctx.fillRect(-hw * 0.82, hh * 0.88, 6, 7)
  ctx.fillRect(hw * 0.76, hh * 0.88, 6, 7)
  ctx.shadowBlur = 0
}

/* ═══════════════════════════════════════════════════════════════
   DRAW — NITRO BOOST PICKUP (EXACT MATCH TO USER PHOTO)
   ═══════════════════════════════════════════════════════════════ */
function drawBoostItem(ctx, b, st, t, isBoostRush) {
  const s = BOOST_SZ
  const cx = b.x + s / 2
  const cy = b.y + s / 2

  // Floating bob animation
  const bobY = Math.sin(t * 3.6 + b.x * 0.1) * 3.5
  const pulse = 0.85 + Math.sin(t * 5.5) * 0.15

  ctx.save()
  ctx.translate(cx, cy + bobY)

  // 1. Soft Asphalt Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
  ctx.beginPath()
  ctx.ellipse(0, s * 0.44 - bobY * 0.5, s * 0.38, s * 0.13, 0, 0, Math.PI * 2)
  ctx.fill()

  // 2. Outer Glowing Cyan Spherical Aura (Photo 1)
  const auraGrad = ctx.createRadialGradient(0, 0, s * 0.12, 0, 0, s * 0.52 * pulse)
  auraGrad.addColorStop(0, isBoostRush ? 'rgba(0, 255, 255, 0.55)' : 'rgba(0, 229, 255, 0.45)')
  auraGrad.addColorStop(0.55, 'rgba(0, 170, 255, 0.20)')
  auraGrad.addColorStop(1, 'rgba(0, 229, 255, 0)')
  ctx.fillStyle = auraGrad
  ctx.beginPath()
  ctx.arc(0, 0, s * 0.52 * pulse, 0, Math.PI * 2)
  ctx.fill()

  // Capsule dimensions
  const cw = s * 0.32 // half-width ~13px
  const ch = s * 0.38 // half-height ~16px

  // 3. Dark Metallic Navy Blue Barrel / Capsule Body
  const bodyGrad = ctx.createLinearGradient(-cw, 0, cw, 0)
  bodyGrad.addColorStop(0, '#061220')
  bodyGrad.addColorStop(0.25, '#0e243c')
  bodyGrad.addColorStop(0.50, '#1a3c60')
  bodyGrad.addColorStop(0.75, '#0e243c')
  bodyGrad.addColorStop(1, '#061220')
  ctx.fillStyle = bodyGrad

  // Barrel / curved capsule silhouette
  ctx.beginPath()
  ctx.moveTo(-cw * 0.75, -ch)
  ctx.quadraticCurveTo(0, -ch * 1.05, cw * 0.75, -ch)
  ctx.quadraticCurveTo(cw * 1.15, 0, cw * 0.75, ch)
  ctx.quadraticCurveTo(0, ch * 1.05, -cw * 0.75, ch)
  ctx.quadraticCurveTo(-cw * 1.15, 0, -cw * 0.75, -ch)
  ctx.closePath()
  ctx.fill()

  // 4. Top & Bottom Bright Glowing Cyan Curved Bands (Photo 1)
  ctx.strokeStyle = '#00e5ff'
  ctx.shadowColor = '#00e5ff'
  ctx.shadowBlur = 10 * pulse
  ctx.lineWidth = 2.4

  // Top band
  ctx.beginPath()
  ctx.moveTo(-cw * 0.72, -ch * 0.88)
  ctx.quadraticCurveTo(0, -ch * 0.98, cw * 0.72, -ch * 0.88)
  ctx.stroke()

  // Bottom band
  ctx.beginPath()
  ctx.moveTo(-cw * 0.72, ch * 0.88)
  ctx.quadraticCurveTo(0, ch * 0.98, cw * 0.72, ch * 0.88)
  ctx.stroke()

  // 5. Central Glowing Horizontal Cyan Line (Photo 1)
  ctx.lineWidth = 1.8
  ctx.beginPath()
  ctx.moveTo(-cw * 0.82, 0)
  ctx.lineTo(cw * 0.82, 0)
  ctx.stroke()

  // 6. Central Bright White Star Flare / Sparkle (Photo 1)
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = '#ffffff'
  ctx.shadowBlur = 12 * pulse

  // Center radial glow
  const starGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.14)
  starGlow.addColorStop(0, '#ffffff')
  starGlow.addColorStop(0.4, 'rgba(0, 240, 255, 0.8)')
  starGlow.addColorStop(1, 'rgba(0, 240, 255, 0)')
  ctx.fillStyle = starGlow
  ctx.beginPath()
  ctx.arc(0, 0, s * 0.14, 0, Math.PI * 2)
  ctx.fill()

  // 4-Pointed Star Flare
  ctx.fillStyle = '#ffffff'
  const starSize = s * 0.16 * pulse
  ctx.beginPath()
  ctx.moveTo(0, -starSize)
  ctx.lineTo(starSize * 0.16, -starSize * 0.16)
  ctx.lineTo(starSize, 0)
  ctx.lineTo(starSize * 0.16, starSize * 0.16)
  ctx.lineTo(0, starSize)
  ctx.lineTo(-starSize * 0.16, starSize * 0.16)
  ctx.lineTo(-starSize, 0)
  ctx.lineTo(-starSize * 0.16, -starSize * 0.16)
  ctx.closePath()
  ctx.fill()

  ctx.shadowBlur = 0
  ctx.restore()
}

/* 2. LE MANS PROTOTYPE HYPERCAR */
function drawTrafficHypercar(ctx, hw, hh, color) {
  // Wheels
  drawSportsWheel(ctx, -hw * 0.88, -hh * 0.54, hw * 0.24, hh * 0.28, color)
  drawSportsWheel(ctx, hw * 0.88, -hh * 0.54, hw * 0.24, hh * 0.28, color)
  drawSportsWheel(ctx, -hw * 0.88, hh * 0.46, hw * 0.26, hh * 0.30, color)
  drawSportsWheel(ctx, hw * 0.88, hh * 0.46, hw * 0.26, hh * 0.30, color)

  // Streamliner aerodynamic body
  const bodyGrad = ctx.createLinearGradient(-hw, 0, hw, 0)
  bodyGrad.addColorStop(0, '#080c14')
  bodyGrad.addColorStop(0.25, color)
  bodyGrad.addColorStop(0.5, color)
  bodyGrad.addColorStop(0.75, color)
  bodyGrad.addColorStop(1, '#080c14')
  ctx.fillStyle = bodyGrad

  ctx.beginPath()
  ctx.moveTo(-hw * 0.35, -hh * 0.98)
  ctx.lineTo(hw * 0.35, -hh * 0.98)
  ctx.lineTo(hw * 0.94, -hh * 0.82)
  ctx.lineTo(hw * 0.90, -hh * 0.32)
  ctx.quadraticCurveTo(hw * 0.50, -hh * 0.05, hw * 0.92, hh * 0.22)
  ctx.lineTo(hw * 0.94, hh * 0.78)
  ctx.lineTo(hw * 0.55, hh * 0.88)
  ctx.lineTo(0, hh * 0.96)
  ctx.lineTo(-hw * 0.55, hh * 0.88)
  ctx.lineTo(-hw * 0.94, hh * 0.78)
  ctx.lineTo(-hw * 0.92, hh * 0.22)
  ctx.quadraticCurveTo(-hw * 0.50, -hh * 0.05, -hw * 0.90, -hh * 0.32)
  ctx.lineTo(-hw * 0.94, -hh * 0.82)
  ctx.closePath()
  ctx.fill()

  // Jet Bubble Canopy
  ctx.fillStyle = 'rgba(10,25,50,0.95)'
  ctx.beginPath()
  ctx.ellipse(0, -hh * 0.12, hw * 0.32, hh * 0.26, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.45)'
  ctx.lineWidth = 1.0
  ctx.stroke()

  // Dorsal Shark Fin
  ctx.fillStyle = '#06080e'
  ctx.fillRect(-1.5, -hh * 0.18, 3, hh * 0.92)

  // Transverse Rear Wing
  ctx.fillStyle = color
  ctx.fillRect(-hw * 0.94, hh * 0.70, hw * 1.88, hh * 0.07)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(-hw * 0.96, hh * 0.62, 3, hh * 0.22)
  ctx.fillRect(hw * 0.96 - 3, hh * 0.62, 3, hh * 0.22)

  // Vertical LED headlights
  ctx.fillStyle = '#00d4ff'
  ctx.fillRect(-hw * 0.88, -hh * 0.90, 4, 8)
  ctx.fillRect(hw * 0.88 - 4, -hh * 0.90, 4, 8)

  // OLED Taillight
  ctx.fillStyle = '#ff1100'
  ctx.fillRect(-hw * 0.80, hh * 0.84, hw * 1.60, 3)
}

/* 3. GT3 ENDURANCE RACER */
function drawTrafficGT3(ctx, hw, hh, color) {
  drawSportsWheel(ctx, -hw * 0.86, -hh * 0.52, hw * 0.30, hh * 0.28, color)
  drawSportsWheel(ctx, hw * 0.86, -hh * 0.52, hw * 0.30, hh * 0.28, color)
  drawSportsWheel(ctx, -hw * 0.88, hh * 0.46, hw * 0.32, hh * 0.32, color)
  drawSportsWheel(ctx, hw * 0.88, hh * 0.46, hw * 0.32, hh * 0.32, color)

  // Widebody GT3 Chassis
  const bodyGrad = ctx.createLinearGradient(-hw, 0, hw, 0)
  bodyGrad.addColorStop(0, '#101218')
  bodyGrad.addColorStop(0.18, color)
  bodyGrad.addColorStop(0.5, color)
  bodyGrad.addColorStop(0.82, color)
  bodyGrad.addColorStop(1, '#101218')
  ctx.fillStyle = bodyGrad

  ctx.beginPath()
  ctx.moveTo(-hw * 0.72, -hh * 0.95)
  ctx.lineTo(hw * 0.72, -hh * 0.95)
  ctx.lineTo(hw * 0.92, -hh * 0.70)
  ctx.lineTo(hw * 0.88, -hh * 0.32)
  ctx.lineTo(hw * 0.82, hh * 0.18)
  ctx.lineTo(hw * 0.94, hh * 0.32)
  ctx.lineTo(hw * 0.92, hh * 0.72)
  ctx.lineTo(hw * 0.70, hh * 0.90)
  ctx.lineTo(-hw * 0.70, hh * 0.90)
  ctx.lineTo(-hw * 0.92, hh * 0.72)
  ctx.lineTo(-hw * 0.94, hh * 0.32)
  ctx.lineTo(-hw * 0.82, hh * 0.18)
  ctx.lineTo(-hw * 0.88, -hh * 0.32)
  ctx.lineTo(-hw * 0.92, -hh * 0.70)
  ctx.closePath()
  ctx.fill()

  // Front Dive Planes (Canards)
  ctx.fillStyle = '#06070a'
  ctx.fillRect(-hw * 0.98, -hh * 0.86, hw * 0.14, 3.5)
  ctx.fillRect(hw * 0.84, -hh * 0.86, hw * 0.14, 3.5)

  // Hood Heat Extractor
  ctx.fillStyle = '#0b0d14'
  ctx.fillRect(-hw * 0.36, -hh * 0.72, hw * 0.72, hh * 0.24)

  // Cockpit Glass
  ctx.fillStyle = 'rgba(20,30,48,0.92)'
  ctx.beginPath()
  ctx.roundRect(-hw * 0.50, -hh * 0.30, hw * 1.0, hh * 0.56, 4)
  ctx.fill()

  // GT3 Rear Wing on dual pylons
  ctx.fillStyle = '#161822'
  ctx.fillRect(-hw * 0.32, hh * 0.60, 4, hh * 0.18)
  ctx.fillRect(hw * 0.32 - 4, hh * 0.60, 4, hh * 0.18)
  ctx.fillStyle = '#0b0d14'
  ctx.fillRect(-hw * 0.96, hh * 0.72, hw * 1.92, hh * 0.09)
  ctx.fillStyle = color
  ctx.fillRect(-hw * 0.92, hh * 0.74, hw * 1.84, hh * 0.03)

  // Headlights & Taillights
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(-hw * 0.76, -hh * 0.92, hw * 0.22, hh * 0.06)
  ctx.fillRect(hw * 0.54, -hh * 0.92, hw * 0.22, hh * 0.06)
  ctx.fillStyle = '#ff1100'
  ctx.fillRect(-hw * 0.66, hh * 0.86, hw * 1.32, 4)
}

/* 4. FORMULA RIVAL SINGLE-SEATER */
function drawTrafficOpenWheel(ctx, hw, hh, color) {
  // Suspension Wishbones
  ctx.strokeStyle = '#181a22'
  ctx.lineWidth = 1.8
  ctx.beginPath()
  ctx.moveTo(-hw * 0.22, -hh * 0.48); ctx.lineTo(-hw * 0.88, -hh * 0.56)
  ctx.moveTo(hw * 0.22, -hh * 0.48); ctx.lineTo(hw * 0.88, -hh * 0.56)
  ctx.moveTo(-hw * 0.30, hh * 0.32); ctx.lineTo(-hw * 0.88, hh * 0.48)
  ctx.moveTo(hw * 0.30, hh * 0.32); ctx.lineTo(hw * 0.88, hh * 0.48)
  ctx.stroke()

  // Open wheels
  drawF1Wheel(ctx, -hw * 0.85, -hh * 0.56, true, color, hw, hh)
  drawF1Wheel(ctx, hw * 0.85, -hh * 0.56, true, color, hw, hh)
  drawF1Wheel(ctx, -hw * 0.85, hh * 0.48, false, color, hw, hh)
  drawF1Wheel(ctx, hw * 0.85, hh * 0.48, false, color, hw, hh)

  // Monocoque Body
  const bodyGrad = ctx.createLinearGradient(-hw * 0.7, 0, hw * 0.7, 0)
  bodyGrad.addColorStop(0, '#0a0d14')
  bodyGrad.addColorStop(0.2, color)
  bodyGrad.addColorStop(0.5, color)
  bodyGrad.addColorStop(0.8, color)
  bodyGrad.addColorStop(1, '#0a0d14')
  ctx.fillStyle = bodyGrad

  ctx.beginPath()
  ctx.moveTo(0, -hh * 1.04)
  ctx.lineTo(hw * 0.16, -hh * 0.96)
  ctx.lineTo(hw * 0.24, -hh * 0.50)
  ctx.lineTo(hw * 0.65, -hh * 0.22)
  ctx.quadraticCurveTo(hw * 0.68, hh * 0.05, hw * 0.60, hh * 0.28)
  ctx.quadraticCurveTo(hw * 0.45, hh * 0.60, hw * 0.36, hh * 0.76)
  ctx.lineTo(-hw * 0.36, hh * 0.76)
  ctx.quadraticCurveTo(-hw * 0.45, hh * 0.60, -hw * 0.60, hh * 0.28)
  ctx.quadraticCurveTo(-hw * 0.68, hh * 0.05, -hw * 0.65, -hh * 0.22)
  ctx.lineTo(-hw * 0.24, -hh * 0.50)
  ctx.lineTo(-hw * 0.16, -hh * 0.96)
  ctx.closePath()
  ctx.fill()

  // Cockpit & Helmet
  ctx.fillStyle = '#06070a'
  ctx.beginPath()
  ctx.ellipse(0, -hh * 0.06, hw * 0.20, hh * 0.16, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(0, -hh * 0.06, hw * 0.12, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#222530'
  ctx.lineWidth = 2.4
  ctx.beginPath()
  ctx.arc(0, -hh * 0.06, hw * 0.22, Math.PI * 0.12, Math.PI * 0.88)
  ctx.stroke()

  // Front & Rear Wings
  ctx.fillStyle = color
  ctx.fillRect(-hw * 0.98, -hh * 1.05, hw * 1.96, hh * 0.07)
  ctx.fillRect(-hw * 0.90, hh * 0.82, hw * 1.80, hh * 0.08)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(-hw * 1.02, -hh * 1.08, hw * 0.06, hh * 0.16)
  ctx.fillRect(hw * 0.96, -hh * 1.08, hw * 0.06, hh * 0.16)
}

/* ═══════════════════════════════════════════════════════════════
   DRAW — TRACKSIDE DECORATIONS

   ═══════════════════════════════════════════════════════════════ */
function drawDecor(ctx, type, x, y, side, sec, t, worldSeed) {
  const f = side === 'right' ? -1 : 1
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(f, 1)

  const sSeed = Math.abs(worldSeed) || 1

  switch (type) {
    case 'pit_building': {
      // Pit Garage with live LED red ticker
      ctx.fillStyle = 'rgba(38, 40, 48, 0.92)'
      ctx.fillRect(3, -42, 68, 42)
      ctx.fillStyle = sec.edge
      ctx.fillRect(3, -44, 68, 2.5)

      for (let g = 0; g < 3; g++) {
        ctx.fillStyle = '#181820'
        ctx.fillRect(8 + g * 20, -22, 14, 22)
      }

      // Live LED Ticker
      ctx.fillStyle = 'rgba(10, 10, 15, 0.9)'
      ctx.fillRect(3, -8, 68, 8)
      ctx.fillStyle = '#e10600'
      ctx.font = 'bold 5px Orbitron, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('APEX VELOCITY ★ PIT LANE LIVE', 5, -2)
      break
    }
    case 'start_gantry': {
      // Start / Finish Line Arch Gantry
      ctx.fillStyle = '#3a3a48'
      ctx.fillRect(0, -90, 8, 90)
      ctx.fillRect(52, -90, 8, 90)
      ctx.fillStyle = 'rgba(25, 25, 35, 0.95)'
      ctx.fillRect(-5, -94, 70, 12)
      ctx.strokeStyle = sec.edge
      ctx.lineWidth = 1.5
      ctx.strokeRect(-5, -94, 70, 12)

      ctx.fillStyle = '#00ff44'
      ctx.font = 'bold 6px Orbitron, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('00:42.185', 30, -86)
      break
    }
    case 'grandstand': {
      ctx.fillStyle = 'rgba(45, 45, 55, 0.92)'
      ctx.fillRect(4, -38, 64, 38)
      ctx.fillStyle = sec.edge
      ctx.fillRect(4, -40, 64, 2.5)

      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = `rgba(60, 65, 80, ${0.6 + i * 0.1})`
        ctx.fillRect(6 + i * 4, -34 + i * 8, 58 - i * 4, 7)
      }
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 7; c++) {
          const personSeed = seed(sSeed * 13 + r * 7 + c)
          const bounce = Math.sin(t * 3 + r * 0.8 + c * 1.2) * 1.2
          ctx.fillStyle = `hsl(${Math.floor(personSeed * 360)}, 65%, 55%)`
          ctx.fillRect(9 + c * 7 + r * 3, -33 + r * 8 + bounce, 3.5, 4.5)
        }
      }
      break
    }
    case 'floodlight': {
      ctx.fillStyle = '#33333e'
      ctx.fillRect(18, -100, 5, 100)
      ctx.fillStyle = '#ffffaa'
      ctx.shadowColor = '#ffffaa'
      ctx.shadowBlur = 15
      ctx.fillRect(12, -106, 17, 7)
      ctx.shadowBlur = 0
      break
    }
    case 'neon_building': {
      const bh = 65 + seed(sSeed) * 100
      ctx.fillStyle = 'rgba(16, 16, 34, 0.95)'
      ctx.fillRect(3, -bh, 54, bh)
      ctx.strokeStyle = sec.edge
      ctx.lineWidth = 1.2
      ctx.strokeRect(3, -bh, 54, bh)
      break
    }
    default: {
      ctx.fillStyle = '#282832'
      ctx.fillRect(2, -22, 54, 22)
      ctx.fillStyle = sec.edge
      ctx.fillRect(2, -22, 54, 3)
      break
    }
  }

  ctx.restore()
}

const CIRCUIT_DECORS = ['pit_building', 'start_gantry', 'grandstand', 'floodlight', 'led_barrier']
const NEON_DECORS = ['neon_building', 'floodlight', 'neon_building', 'led_barrier']

/* ═══════════════════════════════════════════════════════════════
   PARTICLES
   ═══════════════════════════════════════════════════════════════ */
class Spark {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.vx = (Math.random() - 0.5) * 8
    this.vy = (Math.random() - 0.5) * 8
    this.life = 1
    this.decay = 0.025 + Math.random() * 0.025
    this.size = 1.5 + Math.random() * 2.5
    this.color = Math.random() > 0.5 ? '#ff4444' : '#ffaa00'
  }
  update() {
    this.x += this.vx
    this.y += this.vy
    this.vy += 0.15
    this.life -= this.decay
  }
  draw(ctx) {
    if (this.life <= 0) return
    ctx.globalAlpha = Math.max(0, this.life)
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }
}

/* ═══════════════════════════════════════════════════════════════
   GAME COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function Game() {
  const canvasRef = useRef(null)
  const navigate = useNavigate()
  const gameRef = useRef(null)

  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(false)

  const [countdownStage, setCountdownStage] = useState('3')
  const countdownRef = useRef('3')
  const [countdownKey, setCountdownKey] = useState(0)

  const [hud, setHud] = useState({
    speed: 0,
    distance: 0,
    score: 0,
    highScore: parseInt(localStorage.getItem('highScore') || '0', 10),
    boosted: false,
    sector: 'FORMULA CIRCUIT',
    combo: 0,
    activeEvent: null,
    eventTimeLeft: 0,
    nitroMeter: 40,
    nitroActive: false
  })

  const [gameOver, setGameOver] = useState(false)
  const [resultsData, setResultsData] = useState(null)
  const [isMobile, setIsMobile] = useState(false)
  const [sectorTitle, setSectorTitle] = useState(null)
  const [eventCard, setEventCard] = useState(null)
  const [milestoneText, setMilestoneText] = useState(null)

  const keysRef = useRef({})
  const touchRef = useRef({ left: false, right: false })
  const skin = useRef(getSkin()).current

  useEffect(() => { pausedRef.current = paused }, [paused])
  useEffect(() => {
    const checkMob = () => setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window)
    checkMob()
    window.addEventListener('resize', checkMob)
    return () => window.removeEventListener('resize', checkMob)
  }, [])

  // ═══ BULLETPROOF COUNTDOWN PROGRESSION (3 → 2 → 1 → GO → RACING) ═══
  useEffect(() => {
    setCountdownStage('3')
    countdownRef.current = '3'
    playCountdownBeep(false)

    const t1 = setTimeout(() => {
      setCountdownStage('2')
      countdownRef.current = '2'
      playCountdownBeep(false)
    }, 1000)
    const t2 = setTimeout(() => {
      setCountdownStage('1')
      countdownRef.current = '1'
      playCountdownBeep(false)
    }, 2000)
    const t3 = setTimeout(() => {
      setCountdownStage('GO')
      countdownRef.current = 'GO'
      playCountdownBeep(true)
    }, 3000)
    const t4 = setTimeout(() => {
      setCountdownStage('done')
      countdownRef.current = 'done'
    }, 3800)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [countdownKey])

  useEffect(() => {
    const onKeyDown = e => {
      const k = e.key.toLowerCase()
      keysRef.current[k] = true
      if (
        (e.key === ' ' || e.key === 'Shift' || e.code === 'ShiftLeft' || e.code === 'ShiftRight' || k === 'n') &&
        gameRef.current && !gameRef.current.nitroActive && gameRef.current.nitroMeter >= 20
      ) {
        gameRef.current.triggerNitro()
      }
      if (e.key === 'Escape') setPaused(p => !p)
      if (e.key === 'Tab') {
        e.preventDefault()
        navigate('/leaderboard')
      }
    }
    const onKeyUp = e => {
      keysRef.current[e.key.toLowerCase()] = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [navigate])

  const handleRestartGame = () => {
    if (gameRef.current) {
      const s = gameRef.current
      s.crashed = false
      s.crashTimer = 0
      s.hasSavedStats = false
      s.slowMo = 1.0
      s.baseSpeed = 16
      s.speed = 0
      s.maxSpeed = 34
      s.distance = 0
      s.roadOffset = 0
      s.traffic = []
      s.trafficTimer = 0
      s.boosts = []
      s.boostSpawnTimer = 0
      s.boosted = false
      s.nitroMeter = 40
      s.nitroActive = false
      s.nearMissCombo = 0
      s.comboTimer = 0
      s.totalNearMisses = 0
      s.maxCombo = 0
      s.nitroUsedCount = 0
      s.maxSpeedReached = 0
      s.sparks = []
      s.nitroEmbers = []
      s.boostBursts = []
      s.shakeIntensity = 0
      s.shakeX = 0
      s.shakeY = 0
      s.impactFlash = 0
      s.flameFactor = 0
      s.activeEvent = null
      s.shownTitle = {}
      s.shownEvents = {}
      s.playerLane = 1
      s.raceTime = 0
      s.lastMilestone = 0
      s.milestonePopups = []
      s.nearMissPopups = []
      if (s.getLaneX) {
        s.playerX = s.getLaneX(1)
        s.playerTargetX = s.getLaneX(1)
      }
    }
    setGameOver(false)
    setResultsData(null)
    setEventCard(null)
    setMilestoneText(null)
    setCountdownKey(k => k + 1)
  }

  const handleActivateNitro = () => {
    if (gameRef.current && !gameRef.current.nitroActive && gameRef.current.nitroMeter >= 20) {
      gameRef.current.triggerNitro()
    }
  }

  /* ═══════════════════════════════════════════════════════════
     CANVAS ENGINE LOOP
     ═══════════════════════════════════════════════════════════ */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId, destroyed = false

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const roadWRatio = 0.71
    const getRoad = () => {
      const rw = Math.min(canvas.width * roadWRatio, 860)
      const rx = (canvas.width - rw) / 2
      return { rx, rw }
    }
    const getLaneX = lane => {
      const { rx, rw } = getRoad()
      const lw = rw / LANES
      return rx + lw * lane + (lw - PW) / 2
    }

    const st = {
      getLaneX,
      playerLane: 1,
      playerX: getLaneX(1),
      playerTargetX: getLaneX(1),
      playerY: canvas.height - PH - 85,
      countdownRemaining: 3.0,
      lastCountdownStage: '3',
      baseSpeed: 16,
      speed: 0,
      maxSpeed: 34,
      speedIncrement: 0.0028,
      boosted: false,
      boostTimer: 0,
      boostSpeed: 0,
      nitroMeter: 40,
      nitroActive: false,
      distance: 0,
      roadOffset: 0,
      traffic: [],
      trafficTimer: 0,
      trafficInterval: 65,
      boosts: [],
      boostSpawnTimer: 0,
      crashed: false,
      crashTimer: 0,
      hasSavedStats: false,
      slowMo: 1,
      time: 0,
      steerAngle: 0,
      nearMiss: 0,
      nearMissCombo: 0,
      comboTimer: 0,
      totalNearMisses: 0,
      maxCombo: 0,
      nitroUsedCount: 0,
      maxSpeedReached: 0,
      shownTitle: {},
      shownEvents: {},
      frame: 0,
      raceTime: 0,
      lastMilestone: 0,
      sparks: [],
      nitroEmbers: [],
      boostBursts: [],
      shakeIntensity: 0,
      shakeX: 0,
      shakeY: 0,
      impactFlash: 0,
      flameFactor: 0,
      activeEvent: null,
      triggerNitro: () => {}
    }
    gameRef.current = st

    st.triggerNitro = () => {
      if (st.crashed || st.nitroActive || st.nitroMeter < 20) return
      st.nitroActive = true
      st.nitroUsedCount++
      playNitroActivateSound()
    }

    function spawnTraffic() {
      const occupiedLanes = [false, false, false]
      st.traffic.forEach(t => {
        if (t.y < canvas.height * 0.5) occupiedLanes[t.lane] = true
      })
      if (occupiedLanes.filter(Boolean).length >= 2) return

      const availableLanes = [0, 1, 2].filter(l => !occupiedLanes[l])
      if (availableLanes.length === 0) return

      const lane = availableLanes[Math.floor(Math.random() * availableLanes.length)]
      const vt = V_TYPES[Math.floor(Math.random() * V_TYPES.length)]
      const color = vt.colors[Math.floor(Math.random() * vt.colors.length)]

      st.traffic.push({
        lane,
        x: getLaneX(lane) + (PW - vt.w) / 2,
        y: -vt.h - 40,
        w: vt.w,
        h: vt.h,
        color,
        vType: vt,
        speed: 0.35 + Math.random() * 0.35
      })
    }

    function spawnBoost() {
      const lane = Math.floor(Math.random() * LANES)
      st.boosts.push({
        x: getLaneX(lane) + (PW - BOOST_SZ) / 2,
        y: -BOOST_SZ - 25,
        lane
      })
    }

    function collides(ax, ay, aw, ah, bx, by, bw, bh) {
      const s = 6
      return ax + s < bx + bw - s && ax + aw - s > bx + s && ay + s < by + bh - s && ay + ah - s > by + s
    }

    function triggerCrash() {
      st.nearMissCombo = 0
      st.comboTimer = 0
      st.nitroActive = false
      st.crashed = true
      st.crashTimer = 0
      st.slowMo = 0.12
      st.shakeIntensity = 25
      st.impactFlash = 0.75
      playCrashSound()
      for (let i = 0; i < 50; i++) {
        st.sparks.push(new Spark(st.playerX + PW / 2, st.playerY + 15))
      }
    }

    function triggerEvent() {
      const ev = RACE_EVENTS[st.eventIndex % RACE_EVENTS.length]
      st.eventIndex++
      st.activeEvent = ev.id
      st.eventTimer = ev.duration
      setRaceEvent({ name: ev.name, sub: ev.sub, icon: ev.icon, color: ev.color })
      setTimeout(() => setRaceEvent(null), 2200)
    }

    /* ═══ ANIMATION TICK ═══ */
    function tick() {
      if (destroyed) return
      if (pausedRef.current) {
        animId = requestAnimationFrame(tick)
        return
      }

      const cw = canvas.width, ch = canvas.height
      const { rx, rw } = getRoad()
      const lw = rw / LANES

      st.frame++

      const isCountingDown = countdownRef.current !== 'done'

      const currentEvent = getEventAtTime(st.raceTime)
      st.activeEvent = currentEvent.id

      // ── FREEZE ROAD & CAR POSITION COMPLETELY UNTIL 3, 2, 1, GO FINISHES ──
      if (isCountingDown) {
        st.speed = 0
        st.distance = 0
        st.roadOffset = 0
        st.flameFactor = 0
        st.raceTime = 0
        st.time += 0.016
        st.playerTargetX = getLaneX(st.playerLane)
        st.playerX = st.playerTargetX
        st.playerY = ch - PH - 85
      } else {
        st.time += 0.016 * st.slowMo
      }

      if (!isCountingDown && !st.crashed) {
        const k = keysRef.current, tc = touchRef.current
        if ((k['a'] || k['arrowleft'] || tc.left) && st.playerLane > 0) {
          if (!st._lp) { st.playerLane--; st._lp = true }
        } else { st._lp = false }

        if ((k['d'] || k['arrowright'] || tc.right) && st.playerLane < LANES - 1) {
          if (!st._rp) { st.playerLane++; st._rp = true }
        } else { st._rp = false }

        st.playerTargetX = getLaneX(st.playerLane)

        if (k['w'] || k['arrowup']) st.speed = Math.min(st.maxSpeed + 4, st.speed + 0.25)
        if (k['s'] || k['arrowdown']) st.speed = Math.max(10, st.speed - 0.35)

        const targetSteer = (st.playerTargetX - st.playerX) * 0.008
        st.steerAngle += (targetSteer - st.steerAngle) * 0.15
        st.playerX += (st.playerTargetX - st.playerX) * 0.22
        st.playerY = ch - PH - 85

        // Nitro handling
        if (st.nitroActive) {
          st.nitroMeter = Math.max(0, st.nitroMeter - 0.36)
          if (st.nitroMeter <= 0) st.nitroActive = false
        }

        // Event Detection (Time-based: 10s start -> 10s event -> 8s gap loop)
        st.raceTime += 0.016 * st.slowMo
        const eventKey = currentEvent.id ? `${currentEvent.id}_${currentEvent.cycleIndex}` : null

        if (eventKey && !st.shownEvents[eventKey]) {
          st.shownEvents[eventKey] = true
          setEventCard({
            name: currentEvent.name,
            sub: currentEvent.sub,
            color: currentEvent.color,
            icon: currentEvent.icon
          })
          setTimeout(() => setEventCard(null), 1200)
        }

        // Speed & distance progression
        st.baseSpeed = Math.min(st.maxSpeed, st.baseSpeed + st.speedIncrement)
        if (st.boosted) {
          st.boostTimer--
          st.boostSpeed = Math.max(0, st.boostSpeed - 0.025)
          if (st.boostTimer <= 0) { st.boosted = false; st.boostSpeed = 0 }
        }

        const eventSpeedMod = st.activeEvent === 'speed_zone' ? st.baseSpeed * 0.20 : 0
        const nitroSpeedMod = st.nitroActive ? st.baseSpeed * 0.25 : 0
        st.speed = st.baseSpeed + st.boostSpeed + eventSpeedMod + nitroSpeedMod

        const distMod = (st.activeEvent === 'speed_zone' ? 1.2 : 1) + (st.nitroActive ? 0.2 : 0)
        st.distance += st.speed * 0.14 * st.slowMo * distMod
        st.maxSpeedReached = Math.max(st.maxSpeedReached, Math.floor(st.speed * 32))
        st.roadOffset = (st.roadOffset + st.speed * st.slowMo) % (DASH_H + DASH_GAP)

        // Spawning Traffic & Boosts according to distance timeline
        st.trafficTimer++
        const baseInterval = Math.max(20, 62 - currentEvent.cycleIndex * 3.5)
        const surgeInterval = Math.max(14, 24 - currentEvent.cycleIndex * 2)
        const activeTrafficInterval = st.activeEvent === 'traffic_surge' ? surgeInterval : baseInterval

        if (st.trafficTimer >= activeTrafficInterval) {
          spawnTraffic()
          st.trafficTimer = 0
        }

        st.boostSpawnTimer++
        const boostInterval = st.activeEvent === 'nitro_zone' ? 65 : 240
        if (st.activeEvent !== 'blackout_zone' && st.boostSpawnTimer >= boostInterval) {
          spawnBoost()
          st.boostSpawnTimer = 0
        }

        // Traffic movement & collision
        st.traffic.forEach(t => {
          t.y += (st.speed - st.speed * t.speed) * st.slowMo
          if (!st.crashed && collides(st.playerX, st.playerY, PW, PH, t.x, t.y, t.w, t.h)) {
            triggerCrash()
          }
        })
        st.traffic = st.traffic.filter(t => t.y < ch + 80)

        // Boost items & pickup
        st.boosts.forEach(b => {
          b.y += st.speed * st.slowMo
          if (!st.crashed && collides(st.playerX, st.playerY, PW, PH, b.x, b.y, BOOST_SZ, BOOST_SZ)) {
            b.picked = true
            st.nitroMeter = Math.min(100, st.nitroMeter + 35)
            st.boosted = true
            st.boostTimer = 75
            st.boostSpeed = 4.5
            playNitroPickupSound()

            // Spawn bright cyan energy burst & particle explosion
            const burstX = b.x + BOOST_SZ / 2
            const burstY = b.y + BOOST_SZ / 2
            const particles = []
            for (let i = 0; i < 18; i++) {
              const angle = Math.random() * Math.PI * 2
              const speed = 2.5 + Math.random() * 5.5
              particles.push({
                x: burstX,
                y: burstY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2.5 + Math.random() * 3.0,
                alpha: 1.0,
                color: Math.random() > 0.35 ? '#00f0ff' : '#ffffff'
              })
            }
            st.boostBursts.push({
              x: burstX,
              y: burstY,
              radius: 6,
              maxRadius: 44,
              alpha: 0.95,
              particles
            })
          }
        })
        st.boosts = st.boosts.filter(b => b.y < ch + 50 && !b.picked)

        // Near miss detection & floating popup
        if (!st.crashed && st.nearMiss <= 0) {
          for (const t of st.traffic) {
            const yOverlap = !(st.playerY + PH < t.y || st.playerY > t.y + t.h)
            if (yOverlap) {
              const dx = Math.abs((st.playerX + PW / 2) - (t.x + t.w / 2))
              if (dx < PW * 0.92 && dx > PW * 0.28) {
                st.nearMiss = 22
                st.totalNearMisses++

                if (st.comboTimer <= 0) st.nearMissCombo = 1
                else st.nearMissCombo++
                st.comboTimer = 220
                st.maxCombo = Math.max(st.maxCombo, st.nearMissCombo)

                st.shakeIntensity = Math.max(st.shakeIntensity, 6)

                // Near Miss Floating Popups
                if (!st.nearMissPopups) st.nearMissPopups = []
                st.nearMissPopups.push({
                  x: st.playerX + PW / 2,
                  y: st.playerY - 12,
                  text: st.nearMissCombo > 1 ? `+250 COMBO x${st.nearMissCombo}` : '+250 NEAR MISS',
                  alpha: 1.0,
                  vy: -1.8
                })

                playNearMissSound(st.nearMissCombo)
                break
              }
            }
          }
        }

        if (st.nearMiss > 0) st.nearMiss--
        if (st.comboTimer > 0) {
          st.comboTimer--
          if (st.comboTimer <= 0) st.nearMissCombo = 0
        }

        // Tire Smoke on sharp steering or braking
        if (!st.tireSmokes) st.tireSmokes = []
        const isBraking = (keysRef.current['s'] || keysRef.current['arrowdown']) && st.speed > 5
        const isSharpTurning = Math.abs(st.steerAngle) > 0.08 && st.speed > 12

        if (isBraking || isSharpTurning) {
          st.tireSmokes.push({
            x: st.playerX + (Math.random() > 0.5 ? 6 : PW - 6),
            y: st.playerY + PH * 0.75,
            vx: (Math.random() - 0.5) * 1.5,
            vy: 2.0 + Math.random() * 3.0,
            radius: 4 + Math.random() * 3,
            alpha: 0.45
          })
        }

        // Exhaust flame factor interpolation & trailing nitro embers (strictly tied to active Nitro/Boost)
        const isNitroOrBoost = st.nitroActive || st.boosted
        const targetFlame = st.nitroActive ? 1.0 : (st.boosted ? 0.75 : 0.0)
        
        if (isNitroOrBoost) {
          st.flameFactor += (targetFlame - st.flameFactor) * 0.20
          if (st.flameFactor > 0.3) {
            for (let e = 0; e < 2; e++) {
              st.nitroEmbers.push({
                x: st.playerX + PW / 2 + (Math.random() - 0.5) * 16,
                y: st.playerY + PH + 4,
                vx: (Math.random() - 0.5) * 1.5,
                vy: 4.0 + Math.random() * 5.0,
                size: 2.2 + Math.random() * 2.8,
                alpha: 0.85,
                color: Math.random() > 0.35 ? '#00e5ff' : '#ffffff'
              })
            }
          }
        } else {
          // Rapid smooth decay to absolute 0
          st.flameFactor += (0 - st.flameFactor) * 0.30
          if (st.flameFactor < 0.01) {
            st.flameFactor = 0
            st.nitroEmbers = []
          }
        }
      }

      // Update & clean tire smokes
      if (st.tireSmokes) {
        st.tireSmokes.forEach(sm => {
          sm.x += sm.vx * st.slowMo
          sm.y += sm.vy * st.slowMo
          sm.radius += 0.4 * st.slowMo
          sm.alpha -= 0.035 * st.slowMo
        })
        st.tireSmokes = st.tireSmokes.filter(sm => sm.alpha > 0.02)
      }

      // Update & clean near miss popups
      if (st.nearMissPopups) {
        st.nearMissPopups.forEach(p => {
          p.y += p.vy * st.slowMo
          p.alpha -= 0.028 * st.slowMo
        })
        st.nearMissPopups = st.nearMissPopups.filter(p => p.alpha > 0.02)
      }

      // Update & clean nitroEmbers
      st.nitroEmbers.forEach(em => {
        em.x += em.vx * st.slowMo
        em.y += em.vy * st.slowMo
        em.alpha -= (st.nitroActive || st.boosted ? 0.045 : 0.12) * st.slowMo
        em.size *= 0.95
      })
      st.nitroEmbers = st.nitroEmbers.filter(em => em.alpha > 0.02)

      // Distance Milestone Notification (Strictly every 1000m: stays clearly for 2 seconds near vehicle)
      const currentDistInt = Math.floor(st.distance)
      const milestoneInterval = 1000
      const milestoneVal = Math.floor(currentDistInt / milestoneInterval) * milestoneInterval
      if (milestoneVal >= 1000 && milestoneVal !== st.lastMilestone && currentDistInt >= milestoneVal && currentDistInt < milestoneVal + 80) {
        st.lastMilestone = milestoneVal
        if (!st.milestonePopups) st.milestonePopups = []
        st.milestonePopups.push({
          x: st.playerX + PW / 2,
          y: st.playerY - 36,
          text: `★ ${milestoneVal.toLocaleString()}M`,
          timer: 120,
          maxTimer: 120
        })
      }

      // Update & clean milestone popups (2 full seconds)
      if (st.milestonePopups) {
        st.milestonePopups.forEach(m => {
          m.timer--
          m.y -= 0.22 * st.slowMo
        })
        st.milestonePopups = st.milestonePopups.filter(m => m.timer > 0)
      }

      // Sector Title Intro
      if (st.distance > 20 && !st.shownTitle['circuit']) {
        st.shownTitle['circuit'] = true
        setSectorTitle({ name: SEC_CIRCUIT.name, sub: SEC_CIRCUIT.sub, icon: SEC_CIRCUIT.icon })
        setTimeout(() => setSectorTitle(null), 2500)
      }

      // Crash handler & Smooth Results Transition
      if (st.crashed) {
        st.crashTimer++
        if (st.crashTimer > 75 && !st.hasSavedStats) {
          st.hasSavedStats = true
          const finalScore = Math.floor(st.raceTime * 10 + st.totalNearMisses * 50 + st.maxCombo * 20)
          const currentHigh = parseInt(localStorage.getItem('highScore') || '0', 10)
          const isNew = finalScore > currentHigh
          if (isNew) localStorage.setItem('highScore', finalScore.toString())

          const raceData = {
            distance: Math.floor(st.distance),
            topSpeed: st.maxSpeedReached,
            nearMisses: st.totalNearMisses,
            highestCombo: st.maxCombo,
            nitroUsed: st.nitroUsedCount,
            finalScore,
            highScore: Math.max(currentHigh, finalScore),
            isNewRecord: isNew,
            skinName: skin.name || 'Apex R1'
          }
          localStorage.setItem('lastRace', JSON.stringify(raceData))
          setResultsData(raceData)
          setGameOver(true)
        }
      }

      // Update React HUD state
      if (st.frame % 4 === 0) {
        setHud({
          speed: isCountingDown ? 0 : Math.floor(st.speed * 32),
          distance: Math.floor(st.distance),
          score: Math.floor(st.raceTime * 10 + st.totalNearMisses * 50 + st.nearMissCombo * 20),
          highScore: Math.max(Math.floor(st.raceTime * 10 + st.totalNearMisses * 50), parseInt(localStorage.getItem('highScore') || '0', 10)),
          boosted: st.boosted,
          sector: SEC_CIRCUIT.name,
          combo: st.nearMissCombo,
          activeEvent: st.activeEvent,
          eventName: currentEvent.name,
          eventColor: currentEvent.color,
          eventIcon: currentEvent.icon,
          eventTimeLeft: currentEvent.timeLeft || 0,
          nitroMeter: st.nitroMeter,
          nitroActive: st.nitroActive
        })
      }

      // Update Boost Collection Bursts
      st.boostBursts.forEach(burst => {
        burst.radius += (burst.maxRadius - burst.radius) * 0.18 * st.slowMo
        burst.alpha -= 0.05 * st.slowMo
        burst.particles.forEach(p => {
          p.x += p.vx * st.slowMo
          p.y += p.vy * st.slowMo
          p.vx *= 0.94
          p.vy *= 0.94
          p.alpha -= 0.045 * st.slowMo
          p.size *= 0.96
        })
        burst.particles = burst.particles.filter(p => p.alpha > 0.05)
      })
      st.boostBursts = st.boostBursts.filter(burst => burst.alpha > 0.05)

      st.sparks.forEach(s => s.update())
      st.sparks = st.sparks.filter(s => s.life > 0)

      /* ═══════════════════════════════════════
         CANVAS RENDERING
         ═══════════════════════════════════════ */
      ctx.save()

      // ── POLISHED CAMERA SHAKE & HIGH-SPEED MICRO RUMBLE ──
      const speedRumble = (!isCountingDown && st.speed > 24) ? (st.speed - 24) * 0.06 : 0
      const totalShake = st.shakeIntensity + speedRumble
      if (totalShake > 0.1) {
        st.shakeX = (Math.random() - 0.5) * totalShake
        st.shakeY = (Math.random() - 0.5) * totalShake
        st.shakeIntensity *= 0.86
        ctx.translate(st.shakeX, st.shakeY)
      } else {
        st.shakeIntensity = 0
        st.shakeX = 0
        st.shakeY = 0
      }

      const bSkyT = SEC_CIRCUIT.skyT
      const bSkyB = SEC_CIRCUIT.skyB
      const bGrass = SEC_CIRCUIT.grass
      const bEdge = SEC_CIRCUIT.edge

      // Continuous smooth road scroll without wrapping discontinuities
      st.roadScrollY = (st.roadScrollY || 0) + st.speed * st.slowMo
      const dashPeriod = DASH_H + DASH_GAP
      const kerbPeriod = KERB_H * 2
      const dashOffset = st.roadScrollY % dashPeriod
      const kerbOffset = st.roadScrollY % kerbPeriod

      // ── BLACKOUT ZONE INTERPOLATION ──
      const targetBlackout = st.activeEvent === 'blackout_zone' ? 1.0 : 0.0
      st.blackoutFactor = (st.blackoutFactor || 0) + (targetBlackout - (st.blackoutFactor || 0)) * 0.05
      const bf = st.blackoutFactor || 0

      // Sky & Terrain Grass Runoff (Darkens into pitch black night during Blackout Zone)
      if (bf > 0.01) {
        ctx.fillStyle = `rgb(${Math.floor(18 * (1 - bf))}, ${Math.floor(22 * (1 - bf))}, ${Math.floor(32 * (1 - bf))})`
        ctx.fillRect(0, 0, cw, ch)
        ctx.fillStyle = `rgb(${Math.floor(20 * (1 - bf))}, ${Math.floor(26 * (1 - bf))}, ${Math.floor(22 * (1 - bf))})`
        ctx.fillRect(0, 0, rx - KERB_W, ch)
        ctx.fillRect(rx + rw + KERB_W, 0, cw - (rx + rw + KERB_W), ch)
      } else {
        ctx.fillStyle = SEC_CIRCUIT.skyT
        ctx.fillRect(0, 0, cw, ch)
        ctx.fillStyle = SEC_CIRCUIT.grass
        ctx.fillRect(0, 0, rx - KERB_W, ch)
        ctx.fillRect(rx + rw + KERB_W, 0, cw - (rx + rw + KERB_W), ch)
      }

      // Asphalt Road Surface
      ctx.fillStyle = bf > 0.01 ? `rgb(${Math.floor(24 * (1 - bf * 0.6))}, ${Math.floor(25 * (1 - bf * 0.6))}, ${Math.floor(32 * (1 - bf * 0.6))})` : '#181920'
      ctx.fillRect(rx, 0, rw, ch)

      // Kerbs (Smooth alternating FIA Red & White rumblestrips)
      for (let ky = -kerbPeriod * 2; ky < ch + kerbPeriod * 2; ky += kerbPeriod) {
        const yPos = ky + kerbOffset
        // Red block
        ctx.fillStyle = '#e10600'
        ctx.fillRect(rx - KERB_W, yPos, KERB_W, KERB_H)
        ctx.fillRect(rx + rw, yPos, KERB_W, KERB_H)
        // White block
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(rx - KERB_W, yPos + KERB_H, KERB_W, KERB_H)
        ctx.fillRect(rx + rw, yPos + KERB_H, KERB_W, KERB_H)
      }

      // Outer White Track Boundary Lines
      ctx.fillStyle = '#ffffff'
      ctx.globalAlpha = 0.85
      ctx.fillRect(rx, 0, 3, ch)
      ctx.fillRect(rx + rw - 3, 0, 3, ch)
      ctx.globalAlpha = 1.0

      // Lane Dividers (Smooth dashed white lines)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.24)'
      for (let l = 1; l < LANES; l++) {
        const lx = rx + lw * l - 1
        for (let dy = -dashPeriod * 2; dy < ch + dashPeriod * 2; dy += dashPeriod) {
          ctx.fillRect(lx, dy + dashOffset, 2, DASH_H)
        }
      }

      // High Speed Aerodynamic Peripheral Motion Streaks
      if (!isCountingDown && (st.speed > 22 || st.nitroActive) && bf < 0.8) {
        const streakAlpha = st.nitroActive ? 0.35 : Math.min(0.24, (st.speed - 22) * 0.02) * (1 - bf)
        ctx.strokeStyle = st.nitroActive ? 'rgba(0, 229, 255, 0.30)' : 'rgba(255, 255, 255, 0.18)'
        ctx.lineWidth = 1.5
        for (let i = 0; i < 6; i++) {
          const side = i % 2 === 0 ? rx - 10 - seed(i * 19) * 40 : rx + rw + 10 + seed(i * 19) * 40
          const sy = ((st.time * 1600 + i * 180) % (ch + 100)) - 50
          ctx.beginPath()
          ctx.moveTo(side, sy)
          ctx.lineTo(side, sy + 70 + (st.nitroActive ? 40 : 0))
          ctx.stroke()
        }
      }

      // Speed Zone Dynamic Motion Speed Lines
      if (st.activeEvent === 'speed_zone' && !isCountingDown) {
        ctx.strokeStyle = 'rgba(255, 170, 0, 0.28)'
        ctx.lineWidth = 1.8
        for (let i = 0; i < 8; i++) {
          const sx = rx + 25 + seed(i * 23) * (rw - 50)
          const sy = ((st.time * 1100 + i * 150) % (ch + 120)) - 60
          ctx.beginPath()
          ctx.moveTo(sx, sy)
          ctx.lineTo(sx, sy + 60)
          ctx.stroke()
        }
      }

      // World Decorations (Dimmed in Blackout Zone)
      const PPM = 10, decorGap = 28 * PPM
      const visStart = st.distance * PPM - 200, visEnd = st.distance * PPM + ch + 200
      const firstD = Math.floor(visStart / decorGap) * decorGap
      const decOffset = KERB_W + 35
      for (let wd = firstD; wd < visEnd; wd += decorGap) {
        const screenY = ch - (wd - st.distance * PPM) - (ch - st.playerY)
        if (screenY < -160 || screenY > ch + 60) continue
        const decType = CIRCUIT_DECORS[Math.floor(seed(wd) * CIRCUIT_DECORS.length)]
        ctx.save()
        if (bf > 0.05) ctx.globalAlpha = Math.max(0.08, 1 - bf * 0.92)
        drawDecor(ctx, decType, rx - decOffset, screenY, 'left', SEC_CIRCUIT, st.time, wd)
        drawDecor(ctx, decType, rx + rw + decOffset, screenY, 'right', SEC_CIRCUIT, st.time, wd + 55)
        ctx.restore()
      }

      // ── BLACKOUT ZONE: CIRCULAR HEADLIGHT ILLUMINATION & PITCH-BLACK NIGHT ──
      const spotX = st.playerX + PW / 2
      const spotY = st.playerY - 210
      const spotR = 210

      if (bf > 0.005) {
        ctx.save()
        // 1. Realistic Road Illumination in Circular Falling Area
        const beamGrad = ctx.createRadialGradient(
          spotX, spotY, 20,
          spotX, spotY, spotR
        )
        beamGrad.addColorStop(0, `rgba(255, 255, 245, ${0.70 * bf})`)
        beamGrad.addColorStop(0.45, `rgba(235, 245, 255, ${0.40 * bf})`)
        beamGrad.addColorStop(0.85, `rgba(200, 230, 255, ${0.15 * bf})`)
        beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')

        // Draw light connecting player headlights to the circular pool
        ctx.fillStyle = beamGrad
        ctx.beginPath()
        ctx.moveTo(st.playerX + 4, st.playerY)
        ctx.lineTo(st.playerX + PW - 4, st.playerY)
        ctx.lineTo(spotX + spotR, spotY)
        ctx.arc(spotX, spotY, spotR, 0, Math.PI, true)
        ctx.lineTo(spotX - spotR, spotY)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      }

      // Tire Smoke Puffs
      if (st.tireSmokes && st.tireSmokes.length > 0) {
        st.tireSmokes.forEach(sm => {
          ctx.save()
          ctx.globalAlpha = Math.max(0, sm.alpha * (1 - bf * 0.5))
          ctx.fillStyle = 'rgba(210, 215, 225, 0.65)'
          ctx.beginPath()
          ctx.arc(sm.x, sm.y, sm.radius, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        })
      }

      // Boost items (Physical Racing Nitro Canisters with Proximity Sensing)
      st.boosts.forEach(b => drawBoostItem(ctx, b, st, st.time, st.activeEvent === 'nitro_zone'))

      // Boost Collection Energy Bursts (Optimized, 60 FPS)
      if (st.boostBursts && st.boostBursts.length > 0) {
        st.boostBursts.forEach(burst => {
          if (burst.alpha <= 0.01) return
          ctx.save()
          ctx.globalAlpha = Math.max(0, burst.alpha)
          ctx.strokeStyle = '#00f0ff'
          ctx.lineWidth = 2.0
          ctx.beginPath()
          ctx.arc(burst.x, burst.y, burst.radius, 0, Math.PI * 2)
          ctx.stroke()

          burst.particles.forEach(p => {
            if (p.alpha <= 0.01) return
            ctx.fillStyle = p.color === '#ffffff' ? `rgba(255, 255, 255, ${p.alpha})` : `rgba(0, 229, 255, ${p.alpha})`
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
            ctx.fill()
          })
          ctx.restore()
        })
      }

      // Traffic
      st.traffic.forEach(t => drawTraffic(ctx, t))

      // ── BLACKOUT ZONE: TOTAL PITCH-BLACK NIGHT DARKNESS OUTSIDE HEADLIGHT CIRCLE ──
      if (bf > 0.005) {
        // Darkness overlay (pure cinematic blackness outside the headlight circle)
        ctx.save()
        const darkGrad = ctx.createRadialGradient(
          spotX, spotY, 50,
          spotX, spotY, spotR + 35
        )
        darkGrad.addColorStop(0, 'rgba(0, 0, 0, 0)')
        darkGrad.addColorStop(0.35, `rgba(0, 0, 0, ${0.25 * bf})`)
        darkGrad.addColorStop(0.70, `rgba(0, 0, 0, ${0.88 * bf})`)
        darkGrad.addColorStop(1, `rgba(0, 0, 0, ${0.995 * bf})`)
        ctx.fillStyle = darkGrad
        ctx.fillRect(0, 0, cw, ch)
        ctx.restore()

        // Distant Traffic Taillights Glowing in the Dark
        st.traffic.forEach(t => {
          ctx.save()
          ctx.fillStyle = '#ff1100'
          ctx.shadowColor = '#ff1100'
          ctx.shadowBlur = 14
          ctx.fillRect(t.x + 4, t.y + t.h - 4, t.w - 8, 3.5)
          ctx.restore()
        })

        // Dual Volumetric High-Beam Rays Shooting from Car Headlights into the Circle
        ctx.save()
        ctx.globalAlpha = 0.65 * bf
        const bL = ctx.createLinearGradient(st.playerX + 6, st.playerY, spotX - 80, spotY)
        bL.addColorStop(0, 'rgba(255, 255, 255, 0.95)')
        bL.addColorStop(0.35, 'rgba(235, 245, 255, 0.50)')
        bL.addColorStop(1, 'rgba(200, 235, 255, 0)')
        ctx.fillStyle = bL
        ctx.beginPath()
        ctx.moveTo(st.playerX + 4, st.playerY)
        ctx.lineTo(st.playerX + 12, st.playerY)
        ctx.lineTo(spotX - 10, spotY)
        ctx.lineTo(spotX - spotR * 0.75, spotY)
        ctx.closePath()
        ctx.fill()

        const bR = ctx.createLinearGradient(st.playerX + PW - 6, st.playerY, spotX + 80, spotY)
        bR.addColorStop(0, 'rgba(255, 255, 255, 0.95)')
        bR.addColorStop(0.35, 'rgba(235, 245, 255, 0.50)')
        bR.addColorStop(1, 'rgba(200, 235, 255, 0)')
        ctx.fillStyle = bR
        ctx.beginPath()
        ctx.moveTo(st.playerX + PW - 12, st.playerY)
        ctx.lineTo(st.playerX + PW - 4, st.playerY)
        ctx.lineTo(spotX + spotR * 0.75, spotY)
        ctx.lineTo(spotX + 10, spotY)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      }

      // Trailing Nitro Embers (Batch-rendered for 60 FPS)
      if (st.nitroEmbers && st.nitroEmbers.length > 0) {
        ctx.save()
        st.nitroEmbers.forEach(em => {
          if (em.alpha <= 0.01) return
          ctx.fillStyle = `rgba(0, 229, 255, ${Math.max(0, em.alpha)})`
          ctx.beginPath()
          ctx.arc(em.x, em.y, em.size, 0, Math.PI * 2)
          ctx.fill()
        })
        ctx.restore()
      }

      // Player Car (Always clearly visible at the origin of the light beams)
      drawPlayer(ctx, st.playerX, st.playerY, skin, st)

      // Near Miss Floating Popups in Canvas
      if (st.nearMissPopups && st.nearMissPopups.length > 0) {
        st.nearMissPopups.forEach(p => {
          ctx.save()
          ctx.globalAlpha = Math.max(0, p.alpha)
          ctx.font = '900 13px Orbitron, sans-serif'
          ctx.textAlign = 'center'
          ctx.fillStyle = '#ffd700'
          ctx.shadowColor = '#ffd700'
          ctx.shadowBlur = 8
          ctx.fillText(p.text, p.x, p.y)
          ctx.restore()
        })
      }

      // Milestone 1,000M Notification Badge (Stays 2s with Gold Glow Pill)
      if (st.milestonePopups && st.milestonePopups.length > 0) {
        st.milestonePopups.forEach(m => {
          let alpha = 1.0
          if (m.timer > m.maxTimer - 15) {
            alpha = (m.maxTimer - m.timer) / 15
          } else if (m.timer < 25) {
            alpha = m.timer / 25
          }
          ctx.save()
          ctx.globalAlpha = Math.max(0, Math.min(1, alpha))

          const pillW = 126, pillH = 26
          ctx.fillStyle = 'rgba(8, 10, 16, 0.88)'
          ctx.strokeStyle = '#ffd700'
          ctx.lineWidth = 1.5
          ctx.shadowColor = '#ffd700'
          ctx.shadowBlur = 10
          ctx.beginPath()
          ctx.roundRect(m.x - pillW / 2, m.y - pillH / 2, pillW, pillH, 13)
          ctx.fill()
          ctx.stroke()

          ctx.font = '900 12px Orbitron, sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillStyle = '#ffffff'
          ctx.fillText(m.text, m.x, m.y)
          ctx.restore()
        })
      }

      // Sparks
      st.sparks.forEach(s => s.draw(ctx))

      // Impact Flash on collision
      if (st.impactFlash > 0.01) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.70, st.impactFlash)})`
        ctx.fillRect(-30, -30, cw + 60, ch + 60)
        st.impactFlash *= 0.84
      }

      // Vignette
      const vig = ctx.createRadialGradient(cw / 2, ch / 2, ch * 0.35, cw / 2, ch / 2, ch * 0.85)
      vig.addColorStop(0, 'rgba(0,0,0,0)')
      vig.addColorStop(1, 'rgba(0,0,0,0.50)')
      ctx.restore()
      animId = requestAnimationFrame(tick)
    }

    animId = requestAnimationFrame(tick)
    return () => {
      destroyed = true
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [skin])

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#08080c', fontFamily: 'Orbitron, sans-serif' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />

      {/* ═══ TOP LEFT: DISTANCE & SCORE TELEMETRY CARDS (EXACT MATCH TO REFERENCE) ═══ */}
      <div style={{ position: 'absolute', top: '1.2rem', left: '1.5rem', zIndex: 50, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Pause button */}
          <button
            onClick={() => setPaused(p => !p)}
            title="Pause Race (ESC)"
            style={{
              width: 36,
              height: 36,
              borderRadius: 6,
              background: 'rgba(10, 12, 18, 0.88)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.14)',
              color: 'rgba(255,255,255,0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '0.85rem',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'}
          >
            ❚❚
          </button>

          {/* Distance Telemetry Card */}
          <div style={{
            background: 'rgba(10, 12, 18, 0.88)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderLeft: '3px solid #00e5ff',
            borderRadius: 6,
            padding: '0.35rem 0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            minWidth: 120
          }}>
            <span style={{ fontSize: '1.05rem', color: '#00e5ff' }}>🏁</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.44rem', fontWeight: 800, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
                DISTANCE
              </span>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#ffffff', lineHeight: 1.1, fontFamily: 'Orbitron, monospace' }}>
                {hud.distance >= 1000 ? `${(hud.distance / 1000).toFixed(2)} KM` : `${Math.floor(hud.distance)} M`}
              </div>
            </div>
          </div>
        </div>

        {/* Score Telemetry Card */}
        <div style={{
          background: 'rgba(10, 12, 18, 0.88)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderLeft: '3px solid #ff1e1e',
          borderRadius: 6,
          padding: '0.35rem 0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          minWidth: 120
        }}>
          <span style={{ fontSize: '1.05rem', color: '#ffd700' }}>🏆</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.44rem', fontWeight: 800, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
              SCORE
            </span>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#ffffff', lineHeight: 1.1, fontFamily: 'Orbitron, monospace' }}>
              {hud.score.toLocaleString()} <span style={{ fontSize: '0.58rem', color: '#ffd700', fontWeight: 800 }}>PTS</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ CENTER: IMMERSIVE ZONE ENTRANCE CARD (EXACT MATCH TO SCREENSHOT, 2 SECONDS) ═══ */}
      <AnimatePresence>
        {eventCard && (
          <div style={{
            position: 'fixed',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 85,
            pointerEvents: 'none'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 15 }}
              animate={{ opacity: 1, scale: 1.0, y: 0 }}
              exit={{ opacity: 0, scale: 1.08, y: -10 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              style={{
                background: '#0d101d',
                border: `2px solid ${eventCard.color}`,
                borderRadius: '16px',
                boxShadow: `0 0 45px ${eventCard.color}50, inset 0 0 25px rgba(0,0,0,0.85)`,
                padding: '1.8rem 3.2rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '0.4rem',
                minWidth: '280px'
              }}
            >
              <div style={{
                fontSize: '2.0rem',
                color: eventCard.color,
                lineHeight: 1,
                marginBottom: '0.1rem',
                filter: `drop-shadow(0 0 10px ${eventCard.color})`
              }}>
                {eventCard.icon}
              </div>

              <div style={{
                fontFamily: 'Orbitron, sans-serif',
                fontSize: 'clamp(1.5rem, 3.8vw, 2.2rem)',
                fontWeight: 900,
                letterSpacing: '0.14em',
                color: '#ffffff',
                lineHeight: 1.1,
                textTransform: 'uppercase',
                textShadow: `0 0 25px ${eventCard.color}80`
              }}>
                {eventCard.name}
              </div>

              <div style={{
                fontSize: '0.62rem',
                fontWeight: 900,
                letterSpacing: '0.32em',
                color: eventCard.color,
                textTransform: 'uppercase'
              }}>
                {eventCard.sub}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ TOP RIGHT: RECORD TELEMETRY ═══ */}
      <div style={{
        position: 'absolute',
        top: '1.2rem',
        right: '1.5rem',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem'
      }}>
        {/* High Score / Record Pill */}
        <div style={{
          background: 'rgba(10, 12, 18, 0.88)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRight: '3px solid #ffd700',
          borderRadius: 6,
          padding: '0.4rem 0.85rem',
          textAlign: 'right'
        }}>
          <div style={{ fontSize: '0.44rem', fontWeight: 800, letterSpacing: '0.18em', color: 'rgba(255,215,0,0.6)', textTransform: 'uppercase' }}>
            RECORD
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#ffd700', lineHeight: 1.1, fontFamily: 'Orbitron, monospace' }}>
            {hud.highScore.toLocaleString()} <span style={{ fontSize: '0.58rem', color: '#ffd700', fontWeight: 800 }}>PTS</span>
          </div>
        </div>
      </div>

      {/* ═══ TOP MIDDLE: SMALL ACTIVE ZONE COUNTDOWN TIMER (10s EACH) ═══ */}
      {hud.activeEvent && hud.eventTimeLeft > 0 && (
        hud.activeEvent === 'blackout_zone' ? (
          <div style={{
            position: 'absolute',
            top: '0.85rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 60,
            background: 'linear-gradient(180deg, rgba(24, 10, 42, 0.96) 0%, rgba(10, 5, 20, 0.94) 100%)',
            backdropFilter: 'blur(14px)',
            border: '1.5px solid #a855f7',
            borderRadius: '10px',
            clipPath: 'polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)',
            padding: '0.28rem 1.0rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.06rem',
            boxShadow: '0 0 20px rgba(168, 85, 247, 0.45), inset 0 0 10px rgba(168, 85, 247, 0.20)',
            minWidth: '175px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#c084fc', filter: 'drop-shadow(0 0 6px #c084fc)' }}>⚡</span>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 900,
                letterSpacing: '0.10em',
                color: '#ffffff',
                fontStyle: 'italic',
                fontFamily: 'Orbitron, sans-serif',
                textShadow: '0 0 10px rgba(192, 132, 252, 0.8)'
              }}>
                BLACKOUT ZONE
              </span>
            </div>
            <div style={{
              fontSize: '0.40rem',
              fontWeight: 800,
              letterSpacing: '0.10em',
              color: 'rgba(230, 215, 255, 0.85)',
              fontStyle: 'italic',
              textTransform: 'uppercase',
              textAlign: 'center'
            }}>
              LIGHTS OUT. HEADLIGHTS ON. STAY ALERT!
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              marginTop: '0.08rem',
              fontSize: '0.70rem',
              fontWeight: 900,
              color: '#ffffff',
              fontFamily: 'Orbitron, monospace',
              letterSpacing: '0.06em'
            }}>
              <span style={{ fontSize: '0.62rem', opacity: 0.85 }}>⏱</span>
              <span>00:{String(hud.eventTimeLeft).padStart(2, '0')}</span>
            </div>
          </div>
        ) : (
          <div style={{
            position: 'absolute',
            top: '1.2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 60,
            background: 'rgba(8, 10, 16, 0.90)',
            backdropFilter: 'blur(14px)',
            border: `1.5px solid ${hud.eventColor || '#00e5ff'}`,
            borderRadius: '20px',
            padding: '0.35rem 0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: `0 0 16px ${hud.eventColor || '#00e5ff'}40`
          }}>
            <span style={{ fontSize: '0.85rem', lineHeight: 1 }}>{hud.eventIcon || '⚡'}</span>
            <span style={{
              fontSize: '0.62rem',
              fontWeight: 900,
              letterSpacing: '0.14em',
              color: '#ffffff',
              fontFamily: 'Orbitron, sans-serif'
            }}>
              {hud.eventName}
            </span>
            <div style={{
              background: hud.eventColor || '#00e5ff',
              color: '#080a10',
              fontSize: '0.62rem',
              fontWeight: 900,
              padding: '0.1rem 0.45rem',
              borderRadius: '10px',
              fontFamily: 'Orbitron, monospace',
              lineHeight: 1.2
            }}>
              {hud.eventTimeLeft}s
            </div>
          </div>
        )
      )}

      {/* ═══ BOTTOM LEFT: F1 GPS RADAR TRACK TELEMETRY ═══ */}
      <div style={{
        position: 'absolute',
        bottom: '1.5rem',
        left: '1.5rem',
        zIndex: 50,
        width: 68,
        height: 118,
        background: 'rgba(8, 10, 16, 0.88)',
        backdropFilter: 'blur(14px)',
        border: '1px solid rgba(255,255,255,0.14)',
        borderRadius: 8,
        padding: '0.4rem 0.35rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.6)'
      }}>
        {/* Track Sector Representation */}
        <div style={{
          position: 'relative',
          width: '100%',
          flex: 1,
          border: '1px dashed rgba(255,255,255,0.15)',
          borderRadius: 4,
          overflow: 'hidden',
          background: 'rgba(0,0,0,0.4)'
        }}>
          {/* Lane guides */}
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '33.3%', width: 1, background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '66.6%', width: 1, background: 'rgba(255,255,255,0.08)' }} />

          {/* Player Position Dot on Radar */}
          <div style={{
            position: 'absolute',
            bottom: '15%',
            left: `${((hud.speed > 0 ? 1 : 1) / 3) * 100 + 16.6}%`,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#00ff66',
            boxShadow: '0 0 8px #00ff66',
            transform: 'translateX(-50%)',
            transition: 'left 0.15s ease'
          }} />
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          marginTop: '0.3rem'
        }}>
          <span style={{ fontSize: '0.42rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em' }}>
            GPS
          </span>
          <span style={{ fontSize: '0.42rem', fontWeight: 900, color: '#00e5ff', letterSpacing: '0.1em' }}>
            RADAR
          </span>
        </div>
      </div>

      {/* ═══ BOTTOM CENTER: CONTROL HINTS ═══ */}
      <div style={{
        position: 'absolute',
        bottom: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        display: 'flex',
        gap: '0.4rem',
        pointerEvents: 'none'
      }} className="hidden md:flex">
        {['A / ← LEFT', 'D / → RIGHT', 'SPACE NITRO', 'ESC PAUSE'].map((hint) => (
          <div
            key={hint}
            style={{
              padding: '0.3rem 0.65rem',
              borderRadius: 4,
              background: 'rgba(10, 12, 18, 0.70)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.08)',
              fontSize: '0.52rem',
              fontWeight: 800,
              letterSpacing: '0.12em',
              color: 'rgba(255,255,255,0.40)'
            }}
          >
            {hint}
          </div>
        ))}
      </div>

      {/* ═══ BOTTOM RIGHT: INTEGRATED F1 COCKPIT TELEMETRY CLUSTER ═══ */}
      <div style={{
        position: 'absolute',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 50,
        background: 'rgba(8, 10, 16, 0.90)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.14)',
        borderBottom: `2px solid ${hud.nitroActive ? '#00e5ff' : '#e10600'}`,
        borderRadius: 10,
        padding: '0.65rem 0.95rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        minWidth: 175,
        boxShadow: hud.nitroActive ? '0 0 25px rgba(0,229,255,0.25), 0 4px 20px rgba(0,0,0,0.6)' : '0 4px 20px rgba(0,0,0,0.6)'
      }}>
        {/* F1 Rev Shift Light Bar (9 Micro LEDs) */}
        <div style={{ display: 'flex', gap: '3px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
            const spdPercent = Math.min(1, hud.speed / 580)
            const activeThreshold = i / 9
            const isActive = spdPercent > activeThreshold || hud.nitroActive
            let ledColor = '#1a1d26'
            let glow = 'none'

            if (isActive) {
              if (hud.nitroActive) {
                ledColor = '#00e5ff'
                glow = '0 0 6px #00e5ff'
              } else if (i < 3) {
                ledColor = '#00ff66'
                glow = '0 0 5px #00ff66'
              } else if (i < 6) {
                ledColor = '#ffaa00'
                glow = '0 0 5px #ffaa00'
              } else {
                ledColor = '#ff1e1e'
                glow = '0 0 6px #ff1e1e'
              }
            }

            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  background: ledColor,
                  boxShadow: glow,
                  transition: 'background 0.08s ease'
                }}
              />
            )
          })}
        </div>

        {/* Speedometer & Gear Indicator */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.48rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.16em' }}>
              {hud.speed > 0 ? (hud.speed > 480 ? 'GEAR 8' : (hud.speed > 360 ? 'GEAR 7' : (hud.speed > 240 ? 'GEAR 6' : 'GEAR 5'))) : 'NEUTRAL'}
            </span>
            <div style={{ fontSize: '1.9rem', fontWeight: 900, fontStyle: 'italic', color: '#ffffff', lineHeight: 1, fontFamily: 'Orbitron, monospace' }}>
              {hud.speed}
            </div>
          </div>
          <span style={{ fontSize: '0.62rem', fontWeight: 900, color: hud.nitroActive ? '#00e5ff' : 'rgba(255,255,255,0.6)', letterSpacing: '0.15em' }}>
            KM/H
          </span>
        </div>

        {/* Nitro ERS Battery Gauge */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '2px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.48rem', fontWeight: 800, color: hud.nitroActive ? '#00e5ff' : 'rgba(255,255,255,0.55)', letterSpacing: '0.15em' }}>
              ⚡ ERS BOOST
            </span>
            <span style={{ fontSize: '0.52rem', fontWeight: 900, color: hud.nitroActive ? '#00e5ff' : (hud.nitroMeter >= 20 ? '#ffffff' : '#ff4444') }}>
              {hud.nitroActive ? 'ACTIVE' : (hud.nitroMeter >= 20 ? `${Math.floor(hud.nitroMeter)}%` : 'LOW')}
            </span>
          </div>

          <div style={{ width: '100%', height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 2.5, overflow: 'hidden' }}>
            <div style={{
              width: `${hud.nitroMeter}%`,
              height: '100%',
              background: hud.nitroActive
                ? 'linear-gradient(90deg, #0088ff 0%, #00ffff 100%)'
                : 'linear-gradient(90deg, #0066cc 0%, #00d4ff 100%)',
              boxShadow: hud.nitroActive ? '0 0 8px #00e5ff' : 'none',
              transition: 'width 0.12s ease-out'
            }} />
          </div>
        </div>
      </div>

      {/* ═══ PLAIN FLOATING 3 2 1 GO START COUNTDOWN (NO TRAFFIC SYMBOLS) ═══ */}
      <AnimatePresence>
        {countdownStage !== 'done' && (
          <div style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9998,
            pointerEvents: 'none'
          }}>
            <motion.div
              key={countdownStage}
              initial={{ scale: 0.8, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 1.2, opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              {/* PLAIN BOLD FLOATING COUNTDOWN NUMBER (NO TRAFFIC SYMBOLS) */}
              <div style={{
                fontFamily: 'Orbitron, sans-serif',
                fontSize: countdownStage === 'GO' ? 'clamp(5.2rem, 15vw, 9.0rem)' : 'clamp(4.8rem, 13vw, 8.2rem)',
                fontWeight: 900,
                color: countdownStage === 'GO' ? '#00ff66' : '#ffffff',
                fontStyle: 'italic',
                letterSpacing: '0.06em',
                lineHeight: 1,
                textShadow: countdownStage === 'GO'
                  ? '0 0 50px rgba(0,255,102,0.9), 0 0 20px rgba(0,0,0,0.9)'
                  : '0 0 45px rgba(255,34,34,0.85), 0 0 20px rgba(0,0,0,0.9)'
              }}>
                {countdownStage === 'GO' ? 'GO!' : countdownStage}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ MOBILE CONTROLS ═══ */}
      {isMobile && !gameOver && (
        <div style={{
          position: 'absolute',
          bottom: '2rem',
          left: '1.5rem',
          right: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          zIndex: 40
        }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onTouchStart={() => { touchRef.current.left = true }}
              onTouchEnd={() => { touchRef.current.left = false }}
              style={{
                width: 65, height: 65, borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                color: '#fff', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              ◀
            </button>
            <button
              onTouchStart={() => { touchRef.current.right = true }}
              onTouchEnd={() => { touchRef.current.right = false }}
              style={{
                width: 65, height: 65, borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                color: '#fff', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              ▶
            </button>
          </div>

          <button
            onClick={handleActivateNitro}
            style={{
              width: 70, height: 70, borderRadius: '50%',
              background: hud.nitroMeter >= 20 ? 'linear-gradient(135deg, #0088ff, #00e5ff)' : 'rgba(255,255,255,0.15)',
              border: `2px solid ${hud.nitroMeter >= 20 ? '#00e5ff' : 'rgba(255,255,255,0.3)'}`,
              color: '#fff', fontSize: '1.2rem', fontWeight: 900,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            ⚡
          </button>
        </div>
      )}

      {/* ═══ RESULTS / GAME OVER MODAL (EXACT SCREENSHOT MATCH) ═══ */}
      <AnimatePresence>
        {gameOver && resultsData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(5,6,10,0.92)',
              backdropFilter: 'blur(16px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '1.5rem',
              overflowY: 'auto'
            }}
          >
            {/* TOP BAR HEADER */}
            <div style={{
              position: 'absolute', top: '1.5rem', left: '2rem', right: '2rem',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 20
            }}>
              {/* LOGO */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }} onClick={() => navigate('/')}>
                <div style={{
                  fontFamily: 'Orbitron, sans-serif', fontSize: '1.6rem', fontWeight: 900,
                  color: '#ff2222', fontStyle: 'italic', transform: 'skewX(-10deg)',
                  textShadow: '0 0 15px rgba(255,34,34,0.6)'
                }}>
                  N
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.15em', color: '#ffffff', lineHeight: 1 }}>
                    APEX
                  </div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.15em', color: '#ff2222', lineHeight: 1 }}>
                    VELOCITY
                  </div>
                </div>
              </div>

              {/* TOP RIGHT TAG */}
              <div style={{
                fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.6)',
                borderRight: '3px solid #ff2222', paddingRight: '0.6rem'
              }}>
                RACE TELEMETRY |
              </div>
            </div>

            {/* MAIN CARD FRAME */}
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 35 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -20 }}
              transition={{ type: 'spring', damping: 22, stiffness: 220, mass: 0.9 }}
              style={{
                width: '100%',
                maxWidth: '680px',
                background: 'radial-gradient(ellipse at 50% 0%, #160c14 0%, #0c0d14 70%, #07080c 100%)',
                borderRadius: '20px',
                border: '1.5px solid rgba(255, 34, 34, 0.65)',
                boxShadow: '0 0 50px rgba(255, 34, 34, 0.35), inset 0 0 40px rgba(0, 0, 0, 0.8)',
                padding: '2.5rem 3rem',
                textAlign: 'center',
                marginTop: '2rem'
              }}
            >
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
                  fontFamily: 'Orbitron, sans-serif', fontSize: 'clamp(2rem, 5vw, 2.8rem)', fontWeight: 900,
                  letterSpacing: '0.08em', fontStyle: 'italic', color: '#ffffff', margin: 0
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
                    {resultsData.finalScore.toLocaleString()}
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
                        {resultsData.distance.toLocaleString()} <span style={{ color: '#ff2222', fontSize: '0.9rem' }}>m</span>
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
                        {resultsData.topSpeed} <span style={{ color: '#ff2222', fontSize: '0.85rem' }}>km/h</span>
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
                        {resultsData.nearMisses}
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
                        {resultsData.nitroUsed}
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
                        {resultsData.highestCombo}<span style={{ color: '#ff2222', fontSize: '0.95rem' }}>x</span>
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
                        {Math.max(resultsData.highScore || 0, resultsData.distance || 0).toLocaleString()} <span style={{ color: '#ff2222', fontSize: '0.9rem' }}>m</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* BOTTOM 3 ACTION BUTTONS (RETRY, HOME, GARAGE) */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center' }}>
                {/* RETRY BUTTON */}
                <motion.button
                  onClick={handleRestartGame}
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ COMPACT PAUSE MENU (MATCHING RESULT CARD UI) ═══ */}
      <AnimatePresence>
        {paused && !gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(5, 6, 10, 0.88)',
              backdropFilter: 'blur(16px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '1.5rem'
            }}
          >
            <motion.div
              initial={{ scale: 0.86, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: -15 }}
              transition={{ type: 'spring', damping: 22, stiffness: 240, mass: 0.8 }}
              style={{
                width: '100%',
                maxWidth: '400px',
                background: 'radial-gradient(ellipse at 50% 0%, #180d15 0%, #0d0e16 70%, #07080c 100%)',
                borderRadius: '20px',
                border: '1.5px solid rgba(255, 34, 34, 0.65)',
                boxShadow: '0 0 45px rgba(255, 34, 34, 0.35), inset 0 0 30px rgba(0, 0, 0, 0.8)',
                padding: '2.2rem 2.5rem',
                textAlign: 'center'
              }}
            >
              {/* HEADER WITH CHECKERED FLAG */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.7rem', marginBottom: '0.3rem' }}>
                <svg width="30" height="30" viewBox="0 0 48 48" fill="none">
                  <path d="M8 6v36" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                  <path d="M8 6h28l-6 8 6 8H8V6z" fill="#fff" />
                  <rect x="8" y="6" width="7" height="5.33" fill="#1a1a1a" />
                  <rect x="22" y="6" width="7" height="5.33" fill="#1a1a1a" />
                  <rect x="15" y="11.33" width="7" height="5.33" fill="#1a1a1a" />
                  <rect x="29" y="11.33" width="7" height="5.33" fill="#1a1a1a" />
                  <rect x="8" y="16.66" width="7" height="5.33" fill="#1a1a1a" />
                  <rect x="22" y="16.66" width="7" height="5.33" fill="#1a1a1a" />
                </svg>
                <h2 style={{
                  fontFamily: 'Orbitron, sans-serif',
                  fontSize: 'clamp(1.7rem, 4.5vw, 2.2rem)',
                  fontWeight: 900,
                  letterSpacing: '0.08em',
                  fontStyle: 'italic',
                  color: '#ffffff',
                  margin: 0
                }}>
                  RACE <span style={{ color: '#ff2222', textShadow: '0 0 25px rgba(255,34,34,0.8)' }}>PAUSED</span>
                </h2>
              </div>

              <div style={{
                fontSize: '0.62rem',
                fontWeight: 800,
                letterSpacing: '0.28em',
                color: 'rgba(255,255,255,0.45)',
                textTransform: 'uppercase',
                marginBottom: '2rem'
              }}>
                SESSION SUSPENDED
              </div>

              {/* ACTION BUTTONS (RESUME & QUIT) */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center' }}>
                {/* RESUME BUTTON (PRIMARY RED) */}
                <motion.button
                  onClick={() => setPaused(false)}
                  whileHover={{ scale: 1.03, filter: 'drop-shadow(0 0 24px rgba(225,6,0,0.9))' }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    flex: 1.2,
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
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    RESUME
                  </span>
                </motion.button>

                {/* QUIT BUTTON */}
                <motion.button
                  onClick={() => navigate('/')}
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
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    QUIT
                  </span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
