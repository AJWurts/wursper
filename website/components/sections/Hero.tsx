'use client'

import { useEffect, useRef, useState } from 'react'

// Animated waveform component
const BAR_COUNT = 32

function LiveWaveform() {
  const [bars, setBars] = useState<number[]>(() =>
    Array.from({ length: BAR_COUNT }, () => Math.random() * 0.5 + 0.2)
  )
  const animationRef = useRef<number | null>(null)
  const timeRef = useRef(0)

  useEffect(() => {
    const animate = () => {
      timeRef.current += 0.03
      const time = timeRef.current

      setBars(prev =>
        prev.map((_, i) => {
          const wave1 = Math.sin(time * 2 + i * 0.3) * 0.3
          const wave2 = Math.sin(time * 1.5 + i * 0.2) * 0.2
          const wave3 = Math.cos(time * 0.8 + i * 0.4) * 0.15
          const combined = 0.4 + wave1 + wave2 + wave3
          return Math.max(0.15, Math.min(1, combined))
        })
      )

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <div className="flex items-center justify-center gap-[2px] h-6">
      {bars.map((height, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-gradient-to-t from-primary/60 to-primary transition-all duration-75"
          style={{
            height: `${height * 100}%`,
            opacity: 0.5 + height * 0.5,
          }}
        />
      ))}
    </div>
  )
}

// Floating pill component (mimics the app's voice input pill)
function VoicePill() {
  return (
    <div className="relative inline-flex">
      {/* Outer glow */}
      <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />

      {/* Pill container */}
      <div className="relative p-[1px] rounded-full bg-gradient-to-b from-white/15 to-white/5">
        {/* Content */}
        <div className="flex items-center h-12 rounded-full bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] px-3 shadow-2xl shadow-black/50">
          {/* Recording indicator */}
          <div className="flex items-center justify-center w-8">
            <div className="relative w-2.5 h-2.5">
              <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-75" />
              <div className="relative w-2.5 h-2.5 bg-primary rounded-full" />
            </div>
          </div>

          {/* Waveform - centered */}
          <div className="w-[180px] flex items-center justify-center">
            <LiveWaveform />
          </div>

          {/* Stop button */}
          <button className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center ml-1">
            <div className="w-2.5 h-2.5 bg-white rounded-sm" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-28 pb-32 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 -z-10">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[120px] animate-pulse-glow delay-500" />

        {/* Grid pattern */}
        <div className="absolute inset-0 dot-pattern opacity-30" />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
      </div>

      <div className="container-default text-center space-y-10">
        {/* Badge */}
        <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-sm font-medium text-primary">Open Source & Free Forever</span>
          </div>
        </div>

        {/* Main headline */}
        <div className="space-y-6 animate-fade-in-up opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
          <h1 className="text-display-xl font-bold tracking-tight">
            <span className="block text-foreground">Your voice,</span>
            <span className="block">
              <span className="font-[family-name:var(--font-instrument)] italic gradient-text">perfectly</span>
              {' '}transcribed
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Transform speech into polished text with AI that runs{' '}
            <span className="text-foreground font-medium">entirely on your Mac</span>.
            No cloud, no subscriptions, no limits.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center animate-fade-in-up opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
          <button className="btn-primary px-8 py-4 rounded-2xl text-base font-semibold flex items-center gap-3 group">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Download for Mac
            <span className="text-sm opacity-60 font-normal">— Free</span>
          </button>

          <a
            href="#demo"
            className="btn-secondary px-8 py-4 rounded-2xl text-base font-semibold flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Watch Demo
          </a>
        </div>

        {/* Voice pill demo */}
        <div className="pt-4 animate-fade-in-up opacity-0" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
          <VoicePill />
        </div>

        {/* Stats/Trust indicators */}
        <div className="pt-6 animate-fade-in-up opacity-0" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
              </svg>
              <span>100% Private</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
              </svg>
              <span>Works Offline</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span>Free Forever</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span>Open Source</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator - moved lower and separate from content */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-fade-in opacity-0" style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}>
        <div className="flex flex-col items-center gap-2 text-muted-foreground/60">
          <span className="text-[10px] font-medium tracking-widest uppercase">Scroll</span>
          <div className="w-5 h-8 rounded-full border border-border/50 flex items-start justify-center p-1.5">
            <div className="w-0.5 h-1.5 rounded-full bg-primary/60 animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  )
}
