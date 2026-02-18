import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import {
  ModelActionsMenu,
  ModelCell,
  ModelConfigStatus,
  ModelTypeBadge,
  ModelAccuracyCell,
  ModelSpeedCell,
  ModelLanguagesCell,
} from '../components/table'
import {
  getModelCapabilities,
  getPostProcessingCapabilities,
} from '../model-capabilities'
import {
  getModelPricing,
  getModelResources,
  formatCost,
  formatRAM,
} from '../model-resources'

import type { TranscriptionModel } from '../types'
import type { ColumnDef } from '@tanstack/react-table'

export interface ColumnActions {
  downloading: string | null
  onSelectModel: (id: string) => void
  onSetApiKey: (model: TranscriptionModel) => void
  onRemoveApiKey: (id: string) => void
  onDownloadModel: (model: TranscriptionModel) => void
  onDeleteModel: (model: TranscriptionModel) => void
  onRefreshStatus: (id: string) => Promise<void>
  onStartModel: (id: string) => Promise<void>
  onStopModel: (id: string) => Promise<void>
}

function CostRAMCell({
  modelId,
  isLocal,
}: {
  modelId: string
  isLocal: boolean
}) {
  const pricing = getModelPricing(modelId)
  const resources = getModelResources(modelId)

  const costText = isLocal ? 'Free' : formatCost(pricing)
  const ramText = isLocal ? formatRAM(resources) : '-'

  if (isLocal) {
    const ramGB = resources?.ramGB ?? 0
    const ramColor =
      ramGB <= 2
        ? 'text-emerald-600/80 dark:text-emerald-400/70'
        : ramGB <= 4
          ? 'text-amber-600/80 dark:text-amber-400/70'
          : 'text-orange-600/80 dark:text-orange-400/70'

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col cursor-help">
            <span className="text-[10px] font-medium text-emerald-600/80 dark:text-emerald-400/70">
              Free
            </span>
            <span className={`text-[10px] ${ramColor}`}>{ramText}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p>No API costs</p>
          <p className="text-muted-foreground">Requires ~{ramGB} GB RAM</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="text-[10px] font-medium text-muted-foreground cursor-help">
          {costText}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {pricing?.costPerMinute !== undefined
          ? `$${pricing.costPerMinute.toFixed(3)} per minute`
          : pricing?.inputCostPer1M !== undefined
            ? `$${pricing.inputCostPer1M}/1M in, $${pricing.outputCostPer1M}/1M out`
            : 'Cloud-based'}
      </TooltipContent>
    </Tooltip>
  )
}

export function createSTTColumns(
  actions: ColumnActions
): ColumnDef<TranscriptionModel>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Model',
      size: 260,
      minSize: 200,
      cell: ({ row }) => <ModelCell model={row.original} />,
    },
    {
      accessorKey: 'type',
      header: 'Type',
      size: 65,
      minSize: 65,
      maxSize: 65,
      cell: ({ row }) => <ModelTypeBadge type={row.original.type} />,
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
      id: 'accuracy',
      header: 'Acc.',
      size: 60,
      minSize: 60,
      maxSize: 60,
      cell: ({ row }) => {
        const capabilities = getModelCapabilities(row.original.id)
        return <ModelAccuracyCell capabilities={capabilities} />
      },
    },
    {
      id: 'speed',
      header: 'Speed',
      size: 60,
      minSize: 60,
      maxSize: 60,
      cell: ({ row }) => {
        const capabilities = getModelCapabilities(row.original.id)
        return <ModelSpeedCell capabilities={capabilities} />
      },
    },
    {
      id: 'languages',
      header: 'Lang',
      size: 55,
      minSize: 55,
      maxSize: 55,
      cell: ({ row }) => {
        const capabilities = getModelCapabilities(row.original.id)
        return <ModelLanguagesCell capabilities={capabilities} />
      },
    },
    {
      id: 'costRam',
      header: 'Cost',
      size: 55,
      minSize: 55,
      maxSize: 55,
      cell: ({ row }) => (
        <CostRAMCell
          modelId={row.original.id}
          isLocal={row.original.type === 'local'}
        />
      ),
    },
    {
      accessorKey: 'apiKey',
      header: 'Status',
      size: 75,
      minSize: 75,
      maxSize: 75,
      cell: ({ row }) => <ModelConfigStatus model={row.original} />,
    },
    {
      id: 'actions',
      header: '',
      size: 40,
      minSize: 40,
      maxSize: 40,
      cell: ({ row }) => (
        <ModelActionsMenu
          model={row.original}
          downloading={actions.downloading}
          onSelectModel={actions.onSelectModel}
          onSetApiKey={actions.onSetApiKey}
          onRemoveApiKey={actions.onRemoveApiKey}
          onDownloadModel={actions.onDownloadModel}
          onDeleteModel={actions.onDeleteModel}
          onStartModel={actions.onStartModel}
          onStopModel={actions.onStopModel}
        />
      ),
    },
  ]
}

export function createPostProcessingColumns(
  actions: ColumnActions
): ColumnDef<TranscriptionModel>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Model',
      size: 300,
      minSize: 240,
      cell: ({ row }) => <ModelCell model={row.original} />,
    },
    {
      accessorKey: 'type',
      header: 'Type',
      size: 65,
      minSize: 65,
      maxSize: 65,
      cell: ({ row }) => <ModelTypeBadge type={row.original.type} />,
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
      id: 'quality',
      header: 'Quality',
      size: 65,
      minSize: 65,
      maxSize: 65,
      cell: ({ row }) => {
        const capabilities = getPostProcessingCapabilities(row.original.id)
        return <ModelAccuracyCell capabilities={capabilities} />
      },
    },
    {
      id: 'speed',
      header: 'Speed',
      size: 65,
      minSize: 65,
      maxSize: 65,
      cell: ({ row }) => {
        const capabilities = getPostProcessingCapabilities(row.original.id)
        return <ModelSpeedCell capabilities={capabilities} />
      },
    },
    {
      id: 'costRam',
      header: 'Cost',
      size: 55,
      minSize: 55,
      maxSize: 55,
      cell: ({ row }) => (
        <CostRAMCell
          modelId={row.original.id}
          isLocal={row.original.type === 'local'}
        />
      ),
    },
    {
      accessorKey: 'apiKey',
      header: 'Status',
      size: 75,
      minSize: 75,
      maxSize: 75,
      cell: ({ row }) => <ModelConfigStatus model={row.original} />,
    },
    {
      id: 'actions',
      header: '',
      size: 40,
      minSize: 40,
      maxSize: 40,
      cell: ({ row }) => (
        <ModelActionsMenu
          model={row.original}
          downloading={actions.downloading}
          onSelectModel={actions.onSelectModel}
          onSetApiKey={actions.onSetApiKey}
          onRemoveApiKey={actions.onRemoveApiKey}
          onDownloadModel={actions.onDownloadModel}
          onDeleteModel={actions.onDeleteModel}
          onStartModel={actions.onStartModel}
          onStopModel={actions.onStopModel}
        />
      ),
    },
  ]
}

// Legacy function for backwards compatibility
export function createModelColumns(
  actions: ColumnActions
): ColumnDef<TranscriptionModel>[] {
  return createSTTColumns(actions)
}
