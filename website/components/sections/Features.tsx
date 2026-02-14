'use client'

import { useEffect, useRef, useState } from 'react'

// Feature card component with hover effects
function FeatureCard({
  icon,
  title,
  description,
  visual,
  className = '',
  delay = 0,
}: {
  icon: React.ReactNode
  title: string
  description: string
  visual: React.ReactNode
  className?: string
  delay?: number
}) {
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={cardRef}
      className={`
        relative group rounded-3xl border border-border/50 bg-secondary/30
        overflow-hidden card-hover
        ${className}
        ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}
      `}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Glow on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      </div>

      <div className="relative z-10 p-8 h-full flex flex-col">
        {/* Visual area */}
        <div className="aspect-[4/3] mb-6 rounded-2xl border border-border/30 bg-gradient-to-br from-secondary via-accent to-secondary overflow-hidden">
          {visual}
        </div>

        {/* Content */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
            {icon}
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Animated transcription visual
function TranscriptionVisual() {
  const [text, setText] = useState('')
  const fullText = "The quick brown fox jumps over the lazy dog..."

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      setText(fullText.slice(0, i))
      i++
      if (i > fullText.length) {
        setTimeout(() => {
          i = 0
          setText('')
        }, 2000)
      }
    }, 80)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-full flex flex-col items-center justify-center p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
        <span className="text-xs text-muted-foreground font-medium">Recording</span>
      </div>
      <div className="w-full max-w-sm p-4 rounded-xl bg-accent/50 border border-border/30">
        <p className="text-sm text-foreground/80 min-h-[40px]">
          {text}<span className="animate-pulse">|</span>
        </p>
      </div>
    </div>
  )
}

// Vocabulary visual
function VocabularyVisual() {
  const terms = ['TypeScript', 'React', 'Tailwind', 'Whisper', 'macOS']

  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="flex flex-wrap gap-2 justify-center">
        {terms.map((term, i) => (
          <div
            key={term}
            className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-medium"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            {term}
          </div>
        ))}
        <div className="px-4 py-2 rounded-xl bg-accent/50 border border-border/30 text-muted-foreground text-sm">
          +50 more
        </div>
      </div>
    </div>
  )
}

// Shortcut visual
function ShortcutVisual() {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <kbd className="px-4 py-3 rounded-xl bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] border border-white/10 text-lg font-mono shadow-lg">
            ⌥
          </kbd>
          <span className="text-xl text-muted-foreground">+</span>
          <kbd className="px-6 py-3 rounded-xl bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] border border-white/10 text-sm font-mono tracking-widest shadow-lg">
            SPACE
          </kbd>
        </div>
        <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        </div>
      </div>
    </div>
  )
}

// Vibes visual
function VibesVisual() {
  const vibes = ['Polished', 'Relaxed', 'Professional', 'Casual']
  const [active, setActive] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActive(prev => (prev + 1) % vibes.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [vibes.length])

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 gap-4">
      <div className="flex flex-wrap gap-2 justify-center">
        {vibes.map((vibe, i) => (
          <button
            key={vibe}
            className={`
              px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300
              ${i === active
                ? 'bg-primary text-primary-foreground scale-105'
                : 'bg-accent/50 border border-border/30 text-muted-foreground'
              }
            `}
          >
            {vibe}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Transform your writing tone instantly</p>
    </div>
  )
}

// Privacy visual
function PrivacyVisual() {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
        <div className="p-4 rounded-xl bg-primary/10 border-2 border-primary/30 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-xs font-semibold text-primary">Local</span>
          </div>
          <p className="text-[10px] text-muted-foreground">100% offline</p>
        </div>
        <div className="p-4 rounded-xl bg-accent/50 border border-border/30 space-y-2 opacity-50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-muted" />
            <span className="text-xs font-semibold">Cloud</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Optional</p>
        </div>
      </div>
    </div>
  )
}

// Snippets visual
function SnippetsVisual() {
  return (
    <div className="h-full flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-2">
        {[
          { trigger: 'sig', output: 'Best regards, John' },
          { trigger: 'zoom', output: 'https://zoom.us/...' },
          { trigger: 'thanks', output: 'Thank you so much!' },
        ].map(snippet => (
          <div
            key={snippet.trigger}
            className="flex items-center justify-between p-3 rounded-xl bg-accent/50 border border-border/30"
          >
            <code className="text-xs text-primary font-mono">/{snippet.trigger}</code>
            <span className="text-xs text-muted-foreground truncate ml-4">{snippet.output}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Features() {
  return (
    <section id="features" className="section-spacing">
      <div className="container-default">
        {/* Section header */}
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-display-lg font-bold">
            Everything you need,{' '}
            <span className="font-[family-name:var(--font-instrument)] italic gradient-text">nothing you don&apos;t</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features that make voice-to-text actually work for your workflow.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            }
            title="Real-time Transcription"
            description="Watch your words appear as you speak. Powered by state-of-the-art Whisper AI models."
            visual={<TranscriptionVisual />}
            delay={0}
          />

          <FeatureCard
            icon={
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
                <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
              </svg>
            }
            title="Smart Vocabulary"
            description="Train Dicta on your terms, names, and technical phrases. It learns and remembers."
            visual={<VocabularyVisual />}
            delay={100}
          />

          <FeatureCard
            icon={
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z" />
              </svg>
            }
            title="Global Shortcuts"
            description="System-wide hotkeys work in any app. One keystroke from anywhere to start."
            visual={<ShortcutVisual />}
            delay={200}
          />

          <FeatureCard
            icon={
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            }
            title="Vibes & Tone"
            description="Transform your writing style instantly. Polished, casual, professional — one click."
            visual={<VibesVisual />}
            delay={300}
          />

          <FeatureCard
            icon={
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
              </svg>
            }
            title="100% Private"
            description="All processing happens locally on your Mac. Your voice data never leaves your device."
            visual={<PrivacyVisual />}
            delay={400}
          />

          <FeatureCard
            icon={
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
            title="Text Snippets"
            description="Voice-activated shortcuts. Say a trigger word and expand it to full text blocks."
            visual={<SnippetsVisual />}
            delay={500}
          />
        </div>
      </div>
    </section>
  )
}
