import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import type { ModelCapabilities } from '../../types'

interface ModelLanguagesCellProps {
  capabilities?: ModelCapabilities
}

export function ModelLanguagesCell({ capabilities }: ModelLanguagesCellProps) {
  if (!capabilities) {
    return <span className="text-muted-foreground text-xs">-</span>
  }

  const languages = capabilities.languages
  const displayText = languages === 1 ? 'English' : `${languages}+`

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="text-xs font-medium text-foreground cursor-help">
          {displayText}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {languages === 1
          ? 'English only'
          : `Supports ${languages}+ languages`}
      </TooltipContent>
    </Tooltip>
  )
}
