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

export function PostProcessingInfoTooltip({
  capabilities,
}: PostProcessingInfoTooltipProps) {
  if (!capabilities) return null

  const hasContent =
    capabilities.features.length > 0 ||
    (capabilities.limitations && capabilities.limitations.length > 0) ||
    capabilities.note

  if (!hasContent) return null

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
        className="w-64 p-3 bg-popover border border-border shadow-xl backdrop-blur-none"
        sideOffset={8}
        showArrow={false}
      >
        <div className="space-y-3">
          {capabilities.features.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-foreground mb-1.5">
                Features
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                {capabilities.features.map(feature => (
                  <div key={feature}>• {feature}</div>
                ))}
              </div>
            </div>
          )}

          {capabilities.limitations && capabilities.limitations.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-orange-600 dark:text-orange-500 mb-1.5">
                Limitations
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                {capabilities.limitations.map(limitation => (
                  <div key={limitation}>• {limitation}</div>
                ))}
              </div>
            </div>
          )}

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
