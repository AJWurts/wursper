import { motion, AnimatePresence } from 'motion/react'

import { DictaLogo } from '@/components/ui/dicta-logo'

import { StepProgress } from './step-progress'
import { useOnboarding } from '../hooks/use-onboarding'

import type { ReactNode } from 'react'

interface OnboardingLayoutProps {
  children: ReactNode
}

export function OnboardingLayout({ children }: OnboardingLayoutProps) {
  const { steps, currentStep } = useOnboarding()

  return (
    <div className="relative flex flex-col h-screen bg-[#0a0a0a] overflow-hidden">
      {/* Drag region */}
      <div
        data-tauri-drag-region
        className="absolute left-0 right-0 top-0 h-12 z-50"
      />

      {/* Ambient background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orb - top right */}
        <div className="absolute -top-[300px] -right-[300px] w-[600px] h-[600px] rounded-full bg-primary/[0.07] blur-[120px]" />
        {/* Gradient orb - bottom left */}
        <div className="absolute -bottom-[200px] -left-[200px] w-[500px] h-[500px] rounded-full bg-primary/[0.05] blur-[100px]" />
        {/* Subtle noise texture */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex items-center justify-between px-10 pt-14 pb-6"
      >
        <div className="flex items-center gap-3">
          <DictaLogo size={28} className="text-primary" />
          <span className="text-lg font-semibold tracking-tight text-white/90">
            Dicta
          </span>
        </div>
        <StepProgress totalSteps={steps.length} currentStep={currentStep} />
      </motion.header>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-10 pb-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{
              duration: 0.4,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="w-full max-w-4xl"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="relative z-10 px-10 pb-8"
      >
        <p className="text-xs text-white/30 text-center">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.footer>
    </div>
  )
}
