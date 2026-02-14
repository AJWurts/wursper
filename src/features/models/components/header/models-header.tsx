import { Cloud, HardDrive } from 'lucide-react'

import { Button } from '@/components/ui/button'

import type { TranscriptionModel } from '../../types'

interface ModelsHeaderProps {
  cloudModelsCount: number
  localModelsCount: number
  selectedModel?: TranscriptionModel
  onSyncModels?: () => void
}

export function ModelsHeader({
  cloudModelsCount,
  localModelsCount,
  selectedModel,
  onSyncModels,
}: ModelsHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-foreground">
            Models
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Configure speech-to-text and post-processing engines.
          </p>
        </div>
        {import.meta.env.DEV && onSyncModels && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSyncModels}
            className="text-xs"
          >
            Sync Default Models
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4 mt-4">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-2 py-1 rounded">
          <Cloud className="w-3 h-3" strokeWidth={1.75} />
          {cloudModelsCount} cloud
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-2 py-1 rounded">
          <HardDrive className="w-3 h-3" strokeWidth={1.75} />
          {localModelsCount} local
        </span>
        {selectedModel && (
          <span className="inline-flex items-center gap-1.5 text-xs text-primary bg-primary/8 px-2 py-1 rounded font-medium">
            Active: {selectedModel.name}
          </span>
        )}
      </div>
    </div>
  )
}
