import { ArrowRight, Sparkles } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { LiveWaveform } from '@/components/ui/live-waveform'

import { useOnboarding } from '../../hooks/use-onboarding'

export function WelcomeStep() {
  const { completeCurrentStepAndGoNext } = useOnboarding()
  const [simulatedAudioLevel, setSimulatedAudioLevel] = useState(0)

  // Simulate audio levels for demo animation
  useEffect(() => {
    let time = 0
    const interval = setInterval(() => {
      time += 0.08
      const wave1 = Math.sin(time * 1.5) * 0.4
      const wave2 = Math.sin(time * 0.9 + 1.2) * 0.35
      const wave3 = Math.cos(time * 2.1 + 2.5) * 0.25
      const wave4 = Math.sin(time * 0.5 + 3) * 0.15
      const combined = wave1 + wave2 + wave3 + wave4
      const variation = Math.sin(time * 0.3) * 0.2
      const final = combined + variation
      const level = Math.max(8, Math.min(85, (final + 0.6) * 50 + 15))
      setSimulatedAudioLevel(level)
    }, 40)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center text-center">
      {/* Hero section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-10"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8"
        >
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">
            AI-Powered Voice Transcription
          </span>
        </motion.div>

        {/* Title */}
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-white mb-5">
          <span className="block">Welcome to</span>
          <span className="block bg-gradient-to-r from-primary via-emerald-300 to-primary bg-clip-text text-transparent">
            Dicta
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-white/50 max-w-md mx-auto leading-relaxed">
          Transform your voice into text instantly. Private, fast, and works
          completely offline.
        </p>
      </motion.div>

      {/* Voice pill demo */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative mb-12"
      >
        {/* Glow effect */}
        <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full scale-150 -z-10" />

        {/* Pill container */}
        <div className="relative p-[1px] rounded-full bg-gradient-to-b from-white/20 to-white/5">
          <div className="flex items-center h-12 w-[340px] rounded-full bg-gradient-to-b from-zinc-800 to-zinc-900 px-3 shadow-2xl shadow-black/50">
            {/* Waveform - centered with equal spacing */}
            <div className="flex-1 flex items-center justify-center mx-3 overflow-hidden">
              <LiveWaveform
                active={true}
                audioLevel={simulatedAudioLevel}
                barWidth={4}
                barGap={2}
                barRadius={4}
                barColor="#ffffff"
                height={24}
                sensitivity={1.5}
                fadeEdges
                fadeWidth={40}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="flex items-center justify-center gap-8 mb-12 text-sm text-white/40"
      >
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span>Offline First</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span>100% Private</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span>No API Costs</span>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <Button
          onClick={completeCurrentStepAndGoNext}
          size="lg"
          className="h-12 px-8 text-sm font-medium bg-primary hover:bg-primary/90 text-black gap-2 group"
        >
          Get Started
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </motion.div>
    </div>
  )
}
