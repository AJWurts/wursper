import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import type { ModelCapabilities, PostProcessingCapabilities } from '../../types'

interface ModelAccuracyCellProps {
  capabilities?: ModelCapabilities | PostProcessingCapabilities
}

function isSTTCapabilities(
  cap: ModelCapabilities | PostProcessingCapabilities
): cap is ModelCapabilities {
  return 'accuracy' in cap
}

export function ModelAccuracyCell({ capabilities }: ModelAccuracyCellProps) {
  if (!capabilities) {
    return <span className="text-muted-foreground text-xs">-</span>
  }

  const isSTT = isSTTCapabilities(capabilities)
  const value = isSTT ? capabilities.accuracy : capabilities.quality
  const label = isSTT
    ? value.charAt(0).toUpperCase() + value.slice(1)
    : value === 'best'
      ? 'Best'
      : value === 'good'
        ? 'Good'
        : 'Basic'

  const getPercentage = () => {
    if (isSTT) {
      switch (value) {
        case 'high':
          return 100
        case 'medium':
          return 60
        case 'low':
          return 30
        default:
          return 0
      }
    } else {
      switch (value) {
        case 'best':
          return 100
        case 'good':
          return 70
        case 'basic':
          return 40
        default:
          return 0
      }
    }
  }

  const getColor = () => {
    if (isSTT) {
      switch (value) {
        case 'high':
          return 'bg-emerald-400/60 dark:bg-emerald-500/50'
        case 'medium':
          return 'bg-amber-400/60 dark:bg-amber-500/50'
        case 'low':
          return 'bg-rose-400/60 dark:bg-rose-500/50'
        default:
          return 'bg-gray-300/60 dark:bg-gray-600/50'
      }
    } else {
      switch (value) {
        case 'best':
          return 'bg-emerald-400/60 dark:bg-emerald-500/50'
        case 'good':
          return 'bg-sky-400/60 dark:bg-sky-500/50'
        case 'basic':
          return 'bg-amber-400/60 dark:bg-amber-500/50'
        default:
          return 'bg-gray-300/60 dark:bg-gray-600/50'
      }
    }
  }

  const percentage = getPercentage()
  const color = getColor()

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center cursor-help">
          <div className="w-10 h-1.5 bg-gray-200 dark:bg-gray-700/50 rounded-full overflow-hidden">
            <div
              className={`h-full ${color} rounded-full transition-all`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {isSTT ? 'Accuracy' : 'Quality'}: {label}
      </TooltipContent>
    </Tooltip>
  )
}
