import { Badge } from '@/components/ui/badge'

import type { TranscriptionModel } from '../../types'

interface ModelConfigStatusProps {
  model: TranscriptionModel
}

export function ModelConfigStatus({ model }: ModelConfigStatusProps) {
  // Local model status
  if (model.type === 'local') {
    return model.isDownloaded ? (
      <Badge
        variant="outline"
        className="bg-emerald-100/70 text-emerald-700 border-emerald-200/50 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30 text-[10px] px-1.5 py-0"
      >
        Ready
      </Badge>
    ) : (
      <Badge
        variant="outline"
        className="bg-gray-100/70 text-gray-600 border-gray-200/50 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700/30 text-[10px] px-1.5 py-0"
      >
        Download
      </Badge>
    )
  }

  // API key required models
  if (model.requiresApiKey) {
    return model.hasApiKey ? (
      <Badge
        variant="outline"
        className="bg-emerald-100/70 text-emerald-700 border-emerald-200/50 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30 text-[10px] px-1.5 py-0"
      >
        Ready
      </Badge>
    ) : (
      <Badge
        variant="outline"
        className="bg-amber-100/70 text-amber-700 border-amber-200/50 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30 text-[10px] px-1.5 py-0"
      >
        API Key
      </Badge>
    )
  }

  // Ready models
  return (
    <Badge
      variant="outline"
      className="bg-emerald-100/70 text-emerald-700 border-emerald-200/50 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30 text-[10px] px-1.5 py-0"
    >
      Ready
    </Badge>
  )
}
