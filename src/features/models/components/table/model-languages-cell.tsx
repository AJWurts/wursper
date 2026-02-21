import { AlertTriangle, Globe } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useSettingsStore } from '@/features/settings/store'

import type { ModelCapabilities } from '../../types'

interface ModelLanguagesCellProps {
  capabilities?: ModelCapabilities
  isSelected?: boolean
}

export function ModelLanguagesCell({
  capabilities,
  isSelected,
}: ModelLanguagesCellProps) {
  const language = useSettingsStore(
    state => state.settings.transcription.language
  )

  if (!capabilities) {
    return <span className="text-muted-foreground text-xs">-</span>
  }

  const languages = capabilities.languages
  const isEnglishOnly = languages === 1
  const displayText = isEnglishOnly ? 'EN' : `${languages}+`

  // Check for language incompatibility
  const hasIncompatibility = isSelected && isEnglishOnly && language !== 'en'

  return (
    <div className="flex items-center gap-1.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={isEnglishOnly ? 'secondary' : 'outline'}
            className={`text-[10px] px-1.5 py-0 h-5 cursor-help ${
              isEnglishOnly
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
            }`}
          >
            {!isEnglishOnly && <Globe className="h-2.5 w-2.5 mr-0.5" />}
            {displayText}
          </Badge>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="text-xs max-w-[200px] p-3 bg-popover text-popover-foreground border border-border shadow-xl"
          showArrow={false}
        >
          {isEnglishOnly ? (
            <div>
              <p className="font-medium text-amber-500">English only</p>
              <p className="text-muted-foreground mt-1">
                This model cannot transcribe other languages
              </p>
            </div>
          ) : (
            <div>
              <p className="font-medium text-emerald-500">Multilingual</p>
              <p className="text-muted-foreground mt-1">
                Supports {languages}+ languages including Spanish, French,
                German, Chinese, Japanese, and more
              </p>
            </div>
          )}
        </TooltipContent>
      </Tooltip>

      {hasIncompatibility && (
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 cursor-help" />
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="text-xs max-w-[220px] p-3 bg-popover text-popover-foreground border border-border shadow-xl"
            showArrow={false}
          >
            <div>
              <p className="font-medium text-yellow-500">Language mismatch</p>
              <p className="text-muted-foreground mt-1">
                Your transcription language is set to a non-English language,
                but this model only supports English. Change the language in
                Settings or select a multilingual model.
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
