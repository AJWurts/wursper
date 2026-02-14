'use client'

import { useState } from 'react'

export default function VideoSection() {
  const [isPlaying, setIsPlaying] = useState(false)

  const steps = [
    {
      number: '01',
      title: 'Download & Install',
      description: 'One-click install on your Mac. Takes less than a minute.',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
        </svg>
      ),
    },
    {
      number: '02',
      title: 'Grant Permissions',
      description: 'Allow microphone and accessibility for global shortcuts.',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      number: '03',
      title: 'Start Speaking',
      description: 'Press ⌥ Space anywhere and start talking. That\'s it.',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      ),
    },
  ]

  return (
    <section id="demo" className="section-spacing relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      <div className="container-default">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-secondary/30 mb-4">
            <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            <span className="text-sm font-medium text-muted-foreground">See it in action</span>
          </div>
          <h2 className="text-display-lg font-bold">
            Watch Dicta{' '}
            <span className="font-[family-name:var(--font-instrument)] italic gradient-text">come alive</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See how effortlessly you can transform your voice into polished text.
          </p>
        </div>

        {/* Video player */}
        <div className="max-w-5xl mx-auto mb-24">
          <div className="relative rounded-3xl overflow-hidden border border-border/50 bg-secondary/30 shadow-2xl shadow-black/50 group">
            {/* Gradient glow */}
            <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-primary/20 via-transparent to-transparent opacity-50 pointer-events-none" />

            {/* Browser chrome */}
            <div className="relative flex items-center gap-2 px-5 py-4 border-b border-border/50 bg-secondary/50">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]/80" />
                <div className="w-3 h-3 rounded-full bg-[#febc2e]/80" />
                <div className="w-3 h-3 rounded-full bg-[#28c840]/80" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-accent/50 border border-border/30">
                  <svg className="w-3 h-3 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z" />
                  </svg>
                  <span className="text-xs text-muted-foreground">dicta.app</span>
                </div>
              </div>
            </div>

            {/* Video area */}
            <div className="relative aspect-video bg-gradient-to-br from-secondary via-accent to-secondary">
              {/* Grid pattern */}
              <div className="absolute inset-0 dot-pattern opacity-20" />

              {/* Play button overlay */}
              {!isPlaying && (
                <button
                  onClick={() => setIsPlaying(true)}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-6 group/play"
                >
                  {/* Play button */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl scale-150 group-hover/play:scale-[1.8] transition-transform duration-500" />
                    <div className="relative w-24 h-24 rounded-full bg-primary flex items-center justify-center shadow-2xl shadow-primary/30 group-hover/play:scale-110 transition-transform duration-300">
                      <svg className="w-10 h-10 text-primary-foreground ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <span className="text-lg font-semibold">Watch the 2-minute demo</span>
                    <span className="text-sm text-muted-foreground">See how Dicta transforms your workflow</span>
                  </div>
                </button>
              )}

              {/* Placeholder for actual video */}
              {isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  <p className="text-muted-foreground">Video player - embed your demo video here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick start steps */}
        <div className="space-y-12">
          <div className="text-center">
            <h3 className="text-display-md font-bold">
              Up and running in{' '}
              <span className="font-[family-name:var(--font-instrument)] italic text-primary">3 steps</span>
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="relative group">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px">
                    <div className="h-full bg-gradient-to-r from-primary/40 to-transparent" />
                  </div>
                )}

                <div className="relative bg-secondary/30 rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-all h-full overflow-hidden card-hover">
                  {/* Hover gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="relative z-10 space-y-4">
                    {/* Icon and number */}
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        {step.icon}
                      </div>
                      <span className="text-4xl font-bold text-primary/20">{step.number}</span>
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                      <h4 className="text-lg font-bold">{step.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
