import { Check, AlertCircle, ArrowRight, Mic } from 'lucide-react'
import { motion } from 'motion/react'

import { Button } from '@/components/ui/button'
import { usePermissionPolling } from '@/hooks/use-permission-polling'
import { usePermissions } from '@/hooks/use-permissions'

import { useOnboarding } from '../../hooks/use-onboarding'

export function AccessibilityStep() {
  const { completeCurrentStepAndGoNext, markStepComplete } = useOnboarding()
  const { permissions, requestAccessibilityPermission } = usePermissions()

  usePermissionPolling(true, 2000)

  const isGranted = permissions?.accessibility === 'granted'
  const isDenied = permissions?.accessibility === 'denied'

  const handleRequest = async () => {
    const granted = await requestAccessibilityPermission()
    if (granted) {
      markStepComplete('accessibility')
      completeCurrentStepAndGoNext()
    }
  }

  const handleContinue = () => {
    if (isGranted) {
      completeCurrentStepAndGoNext()
    }
  }

  return (
    <div className="flex flex-col items-center text-center">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-10"
      >
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4">
          Enable Global Shortcuts
        </h1>
        <p className="text-base text-white/50 max-w-md mx-auto leading-relaxed">
          Start transcribing from anywhere with a simple keyboard shortcut.
        </p>
      </motion.div>

      {/* Shortcut Demo - floating keys */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="relative mb-10"
      >
        {/* Glow effect */}
        <div
          className={`absolute inset-0 blur-3xl rounded-full scale-150 -z-10 transition-colors duration-500 ${isGranted ? 'bg-primary/20' : 'bg-white/5'}`}
        />

        {/* Shortcut visualization */}
        <div className="flex items-center gap-4">
          {/* Keys */}
          <div className="flex items-center gap-3">
            {/* Option key */}
            <motion.div
              animate={isGranted ? {} : { y: [0, -4, 0] }}
              transition={{
                duration: 0.6,
                repeat: isGranted ? 0 : Infinity,
                repeatDelay: 2,
              }}
              className={`
                flex items-center justify-center h-14 w-14 rounded-xl
                bg-gradient-to-b from-zinc-700 to-zinc-800
                border shadow-xl
                ${isGranted ? 'border-primary/50 shadow-primary/20' : 'border-zinc-600/80 shadow-black/50'}
                transition-colors duration-500
              `}
            >
              <span
                className={`text-xl font-medium ${isGranted ? 'text-primary' : 'text-white/80'}`}
              >
                ⌥
              </span>
            </motion.div>

            <span className="text-xl text-white/20 font-light">+</span>

            {/* Space key */}
            <motion.div
              animate={isGranted ? {} : { y: [0, -4, 0] }}
              transition={{
                duration: 0.6,
                delay: 0.1,
                repeat: isGranted ? 0 : Infinity,
                repeatDelay: 2,
              }}
              className={`
                flex items-center justify-center h-14 px-10 rounded-xl
                bg-gradient-to-b from-zinc-700 to-zinc-800
                border shadow-xl
                ${isGranted ? 'border-primary/50 shadow-primary/20' : 'border-zinc-600/80 shadow-black/50'}
                transition-colors duration-500
              `}
            >
              <span
                className={`text-xs font-medium tracking-[0.2em] ${isGranted ? 'text-primary' : 'text-white/60'}`}
              >
                SPACE
              </span>
            </motion.div>
          </div>

          {/* Arrow and result */}
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="w-10 h-px bg-gradient-to-r from-white/30 to-white/10 origin-left"
            />

            {/* Mic indicator */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
              className={`
                relative flex items-center justify-center w-14 h-14 rounded-full
                ${isGranted ? 'bg-primary/20 border border-primary/30' : 'bg-white/5 border border-white/10'}
                transition-colors duration-500
              `}
            >
              {isGranted ? (
                <Check className="w-6 h-6 text-primary" strokeWidth={2.5} />
              ) : (
                <>
                  <Mic className="w-6 h-6 text-white/50" />
                  {/* Pulse effect */}
                  <motion.div
                    animate={{ scale: [1, 1.4], opacity: [0.4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 rounded-full border border-white/20"
                  />
                </>
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Helper text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-white/30 mb-10"
      >
        {isGranted
          ? 'Shortcut is ready to use'
          : 'Press from any app to start recording'}
      </motion.p>

      {/* Status messages */}
      {isGranted && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20 mb-10"
        >
          <Check className="w-5 h-5 text-primary shrink-0" strokeWidth={2.5} />
          <div className="text-left">
            <p className="text-sm font-medium text-primary">All set!</p>
            <p className="text-xs text-primary/70">
              Global shortcuts are now enabled
            </p>
          </div>
        </motion.div>
      )}

      {isDenied && !isGranted && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-10 max-w-sm text-left"
        >
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-400">
              Permission needed
            </p>
            <p className="text-xs text-amber-400/70 mt-1">
              Open System Settings → Privacy & Security → Accessibility and
              enable Dicta
            </p>
          </div>
        </motion.div>
      )}

      {/* Info features - only show when not granted */}
      {!isGranted && !isDenied && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex items-center justify-center gap-8 mb-10 text-sm text-white/40"
        >
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>Works Anywhere</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>Background Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>Instant Access</span>
          </div>
        </motion.div>
      )}

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <Button
          onClick={isGranted ? handleContinue : handleRequest}
          size="lg"
          className="h-12 px-8 text-sm font-medium bg-primary hover:bg-primary/90 text-black gap-2 group"
        >
          {isGranted ? (
            <>
              Finish Setup
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </>
          ) : (
            'Grant Accessibility Access'
          )}
        </Button>
      </motion.div>
    </div>
  )
}
