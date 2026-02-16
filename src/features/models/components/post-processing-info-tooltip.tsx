import { Info } from 'lucide-react'

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import type { PostProcessingCapabilities } from '../types'

interface PostProcessingInfoTooltipProps {
  capabilities?: PostProcessingCapabilities
}

export function PostProcessingInfoTooltip({ capabilities }: PostProcessingInfoTooltipProps) {
  if (!capabilities) return null

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'best':
        return 'text-green-600 dark:text-green-500'
      case 'good':
        return 'text-blue-600 dark:text-blue-500'
      case 'basic':
        return 'text-orange-600 dark:text-orange-500'
      default:
        return ''
    }
  }

  const getSpeedColor = (speed: string) => {
    switch (speed) {
      case 'fast':
        return 'text-green-600 dark:text-green-500'
      case 'medium':
        return 'text-orange-600 dark:text-orange-500'
      case 'slow':
        return 'text-red-600 dark:text-red-500'
      default:
        return ''
    }
  }

  const getQualityLabel = (quality: string) => {
    switch (quality) {
      case 'best':
        return 'Best'
      case 'good':
        return 'Good'
      case 'basic':
        return 'Basic'
      default:
        return quality
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className="inline-flex items-center justify-center rounded-full p-0.5 hover:bg-accent/50 transition-colors group"
          onClick={e => e.stopPropagation()}
        >
          <Info className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="right"
        className="w-72 p-4 bg-popover border border-border shadow-xl backdrop-blur-none"
        sideOffset={8}
        showArrow={false}
      >
        <div className="space-y-3">
          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3 text-xs pb-3 border-b border-border">
            <div>
              <div className="text-muted-foreground mb-1">Quality</div>
              <div
                className={`font-semibold capitalize ${getQualityColor(capabilities.quality)}`}
              >
                {getQualityLabel(capabilities.quality)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Speed</div>
              <div
                className={`font-semibold capitalize ${getSpeedColor(capabilities.speed)}`}
              >
                {capabilities.speed}
              </div>
            </div>
          </div>

          {/* Features */}
          {capabilities.features.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-foreground mb-2">
                Features
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                {capabilities.features.map(feature => (
                  <div key={feature}>• {feature}</div>
                ))}
              </div>
            </div>
          )}

          {/* Limitations */}
          {capabilities.limitations && capabilities.limitations.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-orange-600 dark:text-orange-500 mb-2">
                Limitations
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                {capabilities.limitations.map(limitation => (
                  <div key={limitation}>• {limitation}</div>
                ))}
              </div>
            </div>
          )}

          {/* Note */}
          {capabilities.note && (
            <div className="text-xs text-muted-foreground italic pt-2 border-t border-border">
              {capabilities.note}
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
