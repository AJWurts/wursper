import { useEffect, useState, useMemo, useCallback } from 'react'

import { useModelsStore, initializeModels, type TranscriptionModel } from '..'
import { ApiKeyModal } from '../components/api-key-modal'
import {
  ModelsHeader,
  ModelsSearch,
  QuickFilters,
  type FilterType,
} from '../components/header'
import { ModelsTable } from '../components/table'
import { getModelCapabilities } from '../model-capabilities'
import { downloadModel, deleteModel, syncModels, createSTTColumns } from '../utils'

import type { ColumnFiltersState, SortingState } from '@tanstack/react-table'

export function ModelsPage() {
  const {
    models,
    initialized,
    selectModel,
    setApiKey,
    removeApiKey,
    syncDefaultModels,
    refreshModelStatus,
    startLocalModel,
    stopLocalModel,
  } = useModelsStore()

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [quickFilter, setQuickFilter] = useState<FilterType>('all')

  const [apiKeyModalModel, setApiKeyModalModel] =
    useState<TranscriptionModel | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    if (!initialized) {
      void initializeModels()
    }
  }, [initialized])

  const handleDownloadModel = useCallback(
    async (model: TranscriptionModel) => {
      setDownloading(model.id)
      try {
        await downloadModel(model, selectModel)
      } finally {
        setDownloading(null)
      }
    },
    [selectModel]
  )

  const handleDeleteModel = useCallback(async (model: TranscriptionModel) => {
    await deleteModel(model)
  }, [])

  const handleSyncModels = async () => {
    await syncModels(syncDefaultModels)
  }

  const columnActions = useMemo(
    () => ({
      downloading,
      onSelectModel: (id: string) => void selectModel(id),
      onSetApiKey: setApiKeyModalModel,
      onRemoveApiKey: (id: string) => void removeApiKey(id),
      onDownloadModel: handleDownloadModel,
      onDeleteModel: handleDeleteModel,
      onRefreshStatus: async (id: string) => void refreshModelStatus(id),
      onStartModel: async (id: string) => void startLocalModel(id),
      onStopModel: async (id: string) => void stopLocalModel(id),
    }),
    [
      downloading,
      selectModel,
      removeApiKey,
      refreshModelStatus,
      startLocalModel,
      stopLocalModel,
      handleDownloadModel,
      handleDeleteModel,
    ]
  )

  const sttColumns = useMemo(
    () => createSTTColumns(columnActions),
    [columnActions]
  )

  const sttModels = useMemo(
    () => models.filter(m => m.purpose === 'speech-to-text'),
    [models]
  )

  // Apply quick filters
  const filterModels = useCallback(
    (modelList: TranscriptionModel[]) => {
      if (quickFilter === 'all') return modelList

      return modelList.filter(m => {
        const capabilities = getModelCapabilities(m.id)

        switch (quickFilter) {
          case 'cloud':
            return m.type === 'cloud'
          case 'local':
            return m.type === 'local'
          case 'high-accuracy':
            if (!capabilities) return false
            return capabilities.accuracy === 'high'
          case 'fast':
            return capabilities?.speed === 'fast'
          case 'configured':
            if (m.type === 'cloud') return m.hasApiKey
            return m.isDownloaded
          default:
            return true
        }
      })
    },
    [quickFilter]
  )

  const filteredSttModels = useMemo(
    () => filterModels(sttModels),
    [filterModels, sttModels]
  )
  const activeModels = sttModels

  const cloudModelsCount = activeModels.filter(m => m.type === 'cloud').length
  const localModelsCount = activeModels.filter(m => m.type === 'local').length
  const configuredCount = activeModels.filter(m =>
    m.type === 'cloud' ? m.hasApiKey : m.isDownloaded
  ).length
  const selectedModel = activeModels.find(m => m.isSelected)

  if (!initialized) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading models...</p>
      </div>
    )
  }

  return (
    <div className="h-full p-8 pt-16">
      <ModelsHeader
        cloudModelsCount={cloudModelsCount}
        localModelsCount={localModelsCount}
        selectedModel={selectedModel}
        onSyncModels={handleSyncModels}
      />

      <div className="mt-2 flex items-center justify-between gap-4">
        <QuickFilters
          activeFilter={quickFilter}
          onFilterChange={setQuickFilter}
          configuredCount={configuredCount}
        />
        <ModelsSearch value={globalFilter ?? ''} onChange={setGlobalFilter} />
      </div>

      <div className="mt-4">
        <ModelsTable
          models={filteredSttModels}
          columns={sttColumns}
          sorting={sorting}
          columnFilters={columnFilters}
          globalFilter={globalFilter}
          onSortingChange={setSorting}
          onColumnFiltersChange={setColumnFilters}
          onGlobalFilterChange={setGlobalFilter}
        />
      </div>

      <ApiKeyModal
        model={apiKeyModalModel}
        open={!!apiKeyModalModel}
        onOpenChange={open => {
          if (!open) setApiKeyModalModel(null)
        }}
        onSave={async apiKey => {
          if (apiKeyModalModel) {
            await setApiKey(apiKeyModalModel.id, apiKey)
          }
        }}
      />
    </div>
  )
}
