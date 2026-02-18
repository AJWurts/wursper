import { Info } from 'lucide-react'

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import type { ModelCapabilities } from '../types'

interface ModelInfoTooltipProps {
  capabilities?: ModelCapabilities
}

export function ModelInfoTooltip({ capabilities }: ModelInfoTooltipProps) {
  if (!capabilities) return null

  const hasContent =
    capabilities.features.length > 0 || capabilities.bestFor.length > 0

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

          {capabilities.bestFor.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-foreground mb-1.5">
                Best For
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                {capabilities.bestFor.map(useCase => (
                  <div key={useCase}>• {useCase}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
