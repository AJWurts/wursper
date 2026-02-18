import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import type { ModelCapabilities, PostProcessingCapabilities } from '../../types'

interface ModelSpeedCellProps {
  capabilities?: ModelCapabilities | PostProcessingCapabilities
}

export function ModelSpeedCell({ capabilities }: ModelSpeedCellProps) {
  if (!capabilities) {
    return <span className="text-muted-foreground text-xs">-</span>
  }

  const speed = capabilities.speed
  const label = speed.charAt(0).toUpperCase() + speed.slice(1)

  const getPercentage = () => {
    switch (speed) {
      case 'fast':
        return 100
      case 'medium':
        return 60
      case 'slow':
        return 30
      default:
        return 0
    }
  }

  const getColor = () => {
    switch (speed) {
      case 'fast':
        return 'bg-emerald-400/60 dark:bg-emerald-500/50'
      case 'medium':
        return 'bg-amber-400/60 dark:bg-amber-500/50'
      case 'slow':
        return 'bg-rose-400/60 dark:bg-rose-500/50'
      default:
        return 'bg-gray-300/60 dark:bg-gray-600/50'
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
        Speed: {label}
      </TooltipContent>
    </Tooltip>
  )
}
