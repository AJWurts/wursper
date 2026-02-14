import { Check } from 'lucide-react'
import { motion } from 'motion/react'

interface StepProgressProps {
  totalSteps: number
  currentStep: number
}

const stepLabels = ['Welcome', 'Model', 'Mic', 'Access']

export function StepProgress({ totalSteps, currentStep }: StepProgressProps) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep

        return (
          <div key={index} className="flex items-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.3,
                delay: index * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex items-center gap-2"
            >
              {/* Step indicator */}
              <div
                className={`
                  relative flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium
                  transition-all duration-300 ease-out
                  ${
                    isCompleted
                      ? 'bg-primary text-black'
                      : isCurrent
                        ? 'bg-primary/20 text-primary ring-1 ring-primary/50'
                        : 'bg-white/[0.06] text-white/30'
                  }
                `}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                ) : (
                  <span>{index + 1}</span>
                )}

                {/* Active glow */}
                {isCurrent && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 rounded-full bg-primary/20 blur-md -z-10"
                  />
                )}
              </div>

              {/* Step label - only show for current */}
              {isCurrent && (
                <motion.span
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="text-xs font-medium text-white/70 hidden sm:block"
                >
                  {stepLabels[index]}
                </motion.span>
              )}
            </motion.div>

            {/* Connector line */}
            {index < totalSteps - 1 && (
              <div
                className={`
                  w-6 h-px mx-1.5 transition-colors duration-300
                  ${isCompleted ? 'bg-primary/50' : 'bg-white/10'}
                `}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
