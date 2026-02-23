import { Star, Zap } from 'lucide-react'

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import {
  getModelCapabilities,
  getPostProcessingCapabilities,
} from '../../model-capabilities'
import { getProviderInfo } from '../../provider-info'
import { ModelInfoTooltip } from '../model-info-tooltip'
import { PostProcessingInfoTooltip } from '../post-processing-info-tooltip'

import type { TranscriptionModel } from '../../types'

interface ModelCellProps {
  model: TranscriptionModel
}

export function ModelCell({ model }: ModelCellProps) {
  const providerInfo = getProviderInfo(model.provider, model.id)
  const isPostProcessing = model.purpose === 'post-processing'
  const sttCapabilities = getModelCapabilities(model.id)
  const ppCapabilities = getPostProcessingCapabilities(model.id)
  const isSTT = model.purpose === 'speech-to-text'
  const supportsVocabulary = model.supportsVocabulary ?? false

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-shrink-0 ${providerInfo.color}`}>
        {providerInfo.icon}
      </div>
      <div className="flex flex-col gap-0 min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <span className="font-medium text-sm truncate">{model.name}</span>
          {model.isRecommended && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Star className="h-3 w-3 flex-shrink-0 fill-amber-500 text-amber-500" />
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="text-xs bg-popover text-popover-foreground border border-border shadow-xl"
                showArrow={false}
              >
                Recommended
              </TooltipContent>
            </Tooltip>
          )}
          {isSTT && supportsVocabulary && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Zap className="h-3 w-3 flex-shrink-0 fill-amber-500 text-amber-500" />
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="text-xs bg-popover text-popover-foreground border border-border shadow-xl max-w-[220px]"
                showArrow={false}
              >
                <p className="font-medium mb-1">Word boost supported</p>
                <p className="text-muted-foreground">
                  This model uses your vocabulary words to improve transcription
                  accuracy.
                </p>
              </TooltipContent>
            </Tooltip>
          )}
          <div className="flex-shrink-0">
            {isPostProcessing ? (
              <PostProcessingInfoTooltip capabilities={ppCapabilities} />
            ) : (
              <ModelInfoTooltip capabilities={sttCapabilities} />
            )}
          </div>
        </div>
        <span className="text-[10px] text-muted-foreground truncate leading-tight">
          {providerInfo.name}
          {model.size && ` • ${model.size}`}
        </span>
      </div>
    </div>
  )
}
