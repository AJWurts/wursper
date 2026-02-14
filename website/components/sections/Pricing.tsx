'use client'

export default function Pricing() {
  const features = [
    'Unlimited voice transcription',
    'Local AI processing (Whisper)',
    'Custom vocabulary builder',
    'Unlimited text snippets',
    'All Vibes presets',
    'Global keyboard shortcuts',
    'System-wide integration',
    'Regular updates',
    'Community support',
    'No usage limits',
    'No hidden fees',
    'Forever free',
  ]

  return (
    <section id="pricing" className="section-spacing relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      <div className="container-default">
        {/* Section header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-display-lg font-bold">
            Simple pricing:{' '}
            <span className="font-[family-name:var(--font-instrument)] italic gradient-text">$0</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            No tiers, no limits, no credit card required. Just download and start speaking.
          </p>
        </div>

        {/* Pricing card */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="relative">
            {/* Glow */}
            <div className="absolute -inset-4 bg-primary/10 rounded-[2.5rem] blur-2xl" />

            <div className="relative rounded-3xl border border-border/50 bg-secondary/30 overflow-hidden">
              {/* Top gradient accent */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

              <div className="grid md:grid-cols-2 gap-8 p-8 md:p-12">
                {/* Left side - Price and CTA */}
                <div className="space-y-8">
                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-sm font-semibold text-primary">FREE FOREVER</span>
                  </div>

                  {/* Price */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-1">
                      <span className="text-2xl font-bold text-muted-foreground mt-3">$</span>
                      <span className="text-8xl font-bold gradient-text">0</span>
                    </div>
                    <p className="text-muted-foreground">
                      No subscriptions. No trials. No catch.
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="space-y-4">
                    <button className="w-full btn-primary px-8 py-4 rounded-2xl text-base font-semibold flex items-center justify-center gap-3">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                      </svg>
                      Download for Mac — Free
                    </button>
                    <p className="text-xs text-muted-foreground text-center">
                      macOS 12.0 or later • Apple Silicon & Intel
                    </p>
                  </div>

                  {/* Mini stats */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
                    {[
                      { value: '∞', label: 'Transcriptions' },
                      { value: '50+', label: 'Languages' },
                      { value: '0', label: 'Hidden Fees' },
                    ].map((stat, i) => (
                      <div key={i} className="text-center">
                        <div className="text-2xl font-bold gradient-text">{stat.value}</div>
                        <div className="text-xs text-muted-foreground">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right side - Features */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg">Everything included:</h3>
                    <p className="text-sm text-muted-foreground">All features. No upgrades. No paywalls.</p>
                  </div>

                  <div className="grid gap-3">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3 text-sm">
                        <div className="w-5 h-5 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-foreground/90">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Why free section */}
        <div className="text-center space-y-12">
          <div className="space-y-4">
            <h3 className="text-display-md font-bold">
              Why is Dicta{' '}
              <span className="font-[family-name:var(--font-instrument)] italic text-primary">completely free?</span>
            </h3>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Our mission is to make powerful voice-to-text accessible to everyone.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ),
                title: 'Community Built',
                description: 'Made by developers who believe great tools should be accessible to everyone.',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                ),
                title: 'Open Source',
                description: 'Transparency and freedom are core values. Fork it, modify it, contribute to it.',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                ),
                title: 'No VC Money',
                description: 'Not beholden to investors. Our users are our only stakeholders.',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border border-border/50 bg-secondary/30 card-hover"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto mb-4">
                  {item.icon}
                </div>
                <h4 className="font-bold mb-2">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>

          {/* Bottom badge */}
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border/50 bg-secondary/30">
            <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Made with love by the community, for the community</span>
          </div>
        </div>
      </div>
    </section>
  )
}
