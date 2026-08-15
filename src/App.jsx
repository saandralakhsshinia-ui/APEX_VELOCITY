import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Home from './pages/Home'
import Game from './pages/Game'
import Garage from './pages/Garage'
import Leaderboard from './pages/Leaderboard'
import Results from './pages/Results'
import About from './pages/About'
import LoadingScreen from './pages/LoadingScreen'

export default function App() {
  const [showIntro, setShowIntro] = useState(true)

  const handleIntroComplete = () => {
    setShowIntro(false)
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {showIntro && <LoadingScreen onComplete={handleIntroComplete} />}
      </AnimatePresence>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game" element={<Game />} />
        <Route path="/garage" element={<Garage />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/results" element={<Results />} />
        <Route path="/about" element={<About />} />
        <Route path="/loading" element={<LoadingScreen onComplete={() => window.location.href = '/'} />} />
      </Routes>
    </>
  )
}

