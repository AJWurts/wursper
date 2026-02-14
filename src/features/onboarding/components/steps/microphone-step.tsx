import { Mic, Check, AlertCircle, ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'

import { Button } from '@/components/ui/button'
import { usePermissionPolling } from '@/hooks/use-permission-polling'
import { usePermissions } from '@/hooks/use-permissions'

import { useOnboarding } from '../../hooks/use-onboarding'

export function MicrophoneStep() {
  const { completeCurrentStepAndGoNext, markStepComplete } = useOnboarding()
  const { permissions, requestMicrophone } = usePermissions()

  usePermissionPolling(true, 2000)

  const isGranted = permissions?.microphone === 'granted'
  const isDenied = permissions?.microphone === 'denied'

  const handleRequest = async () => {
    const granted = await requestMicrophone()
    if (granted) {
      markStepComplete('microphone')
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
          Microphone Access
        </h1>
        <p className="text-base text-white/50 max-w-md mx-auto leading-relaxed">
          Dicta needs microphone access to transcribe your voice in real-time.
        </p>
      </motion.div>

      {/* Icon with animation and glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="relative mb-10"
      >
        {/* Glow effect */}
        <div
          className={`absolute inset-0 blur-3xl rounded-full scale-150 -z-10 transition-colors duration-500 ${isGranted ? 'bg-primary/25' : 'bg-white/5'}`}
        />

        <motion.div
          animate={
            isGranted
              ? {}
              : {
                  scale: [1, 1.05, 1],
                }
          }
          transition={{
            duration: 2,
            repeat: isGranted ? 0 : Infinity,
            ease: 'easeInOut',
          }}
          className={`
            relative flex items-center justify-center w-28 h-28 rounded-full
            ${isGranted ? 'bg-primary/20 border border-primary/30' : 'bg-white/5 border border-white/10'}
            transition-colors duration-500
          `}
        >
          {/* Pulse rings */}
          {!isGranted && (
            <>
              <motion.div
                animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
                className="absolute inset-0 rounded-full border border-white/20"
              />
              <motion.div
                animate={{ scale: [1, 1.8], opacity: [0.2, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeOut',
                  delay: 0.5,
                }}
                className="absolute inset-0 rounded-full border border-white/10"
              />
            </>
          )}

          {isGranted ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Check className="w-12 h-12 text-primary" strokeWidth={2} />
            </motion.div>
          ) : (
            <Mic className="w-12 h-12 text-white/60" strokeWidth={1.5} />
          )}
        </motion.div>
      </motion.div>

      {/* Status messages */}
      {isGranted && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20 mb-10"
        >
          <Check className="w-5 h-5 text-primary shrink-0" strokeWidth={2.5} />
          <div className="text-left">
            <p className="text-sm font-medium text-primary">
              Microphone enabled
            </p>
            <p className="text-xs text-primary/70">
              Ready to transcribe your voice
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
              Open System Settings → Privacy & Security → Microphone and enable
              Dicta
            </p>
          </div>
        </motion.div>
      )}

      {/* Privacy features */}
      {!isGranted && !isDenied && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex items-center justify-center gap-8 mb-10 text-sm text-white/40"
        >
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>Processed Locally</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>Never Uploaded</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>100% Private</span>
          </div>
        </motion.div>
      )}

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Button
          onClick={isGranted ? handleContinue : handleRequest}
          size="lg"
          className="h-12 px-8 text-sm font-medium bg-primary hover:bg-primary/90 text-black gap-2 group"
        >
          {isGranted ? (
            <>
              Continue
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </>
          ) : (
            'Grant Microphone Access'
          )}
        </Button>
      </motion.div>
    </div>
  )
}
