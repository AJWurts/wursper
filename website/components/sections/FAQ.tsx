'use client'

import { useState } from 'react'

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      question: "How accurate is Dicta's transcription?",
      answer: "Dicta uses state-of-the-art Whisper AI models to achieve 95%+ accuracy. With custom vocabulary training, accuracy improves as it learns your specific terms and writing style.",
    },
    {
      question: 'Is my voice data stored or sent to servers?',
      answer: "By default, everything processes locally on your Mac. Your voice never leaves your computer. If you use cloud models, data is encrypted in transit and immediately deleted after processing.",
    },
    {
      question: 'What languages does Dicta support?',
      answer: 'Dicta supports 50+ languages including English, Spanish, French, German, Chinese, Japanese, Korean, and many more. You can switch languages on the fly.',
    },
    {
      question: 'Can I use Dicta in any application?',
      answer: "Yes! Dicta works system-wide on macOS. Use it in any text editor, email client, messaging app, IDE, or form — just press ⌥ Space anywhere and start speaking.",
    },
    {
      question: 'Do I need an internet connection?',
      answer: "Not necessarily. Local AI models work completely offline. Cloud-based models require an internet connection but offer higher accuracy for complex content.",
    },
    {
      question: 'Will Dicta always be free?',
      answer: "Yes, forever. Dicta is an open-source project with no plans for paid tiers or subscriptions. All features remain free for everyone.",
    },
  ]

  return (
    <section id="faq" className="section-spacing">
      <div className="container-narrow">
        {/* Section header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-display-lg font-bold">
            Frequently Asked{' '}
            <span className="font-[family-name:var(--font-instrument)] italic gradient-text">Questions</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about Dicta
          </p>
        </div>

        {/* FAQ items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`
                rounded-2xl border bg-secondary/30 overflow-hidden transition-all
                ${openIndex === index ? 'border-primary/30' : 'border-border/50 hover:border-border'}
              `}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="font-semibold text-base pr-4">{faq.question}</span>
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all
                  ${openIndex === index ? 'bg-primary text-primary-foreground rotate-180' : 'bg-secondary text-muted-foreground'}
                `}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              <div
                className={`
                  grid transition-all duration-300 ease-out
                  ${openIndex === index ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}
                `}
              >
                <div className="overflow-hidden">
                  <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Support CTA */}
        <div className="mt-16">
          <div className="relative rounded-3xl border border-border/50 bg-secondary/30 p-8 overflow-hidden card-hover">
            {/* Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />

            <div className="relative z-10 text-center space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Still have questions?</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Join our community or check out the documentation
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a href="#" className="btn-primary px-6 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                  </svg>
                  Join Discord
                </a>
                <a href="#" className="btn-secondary px-6 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Documentation
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
