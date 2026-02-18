import { useEffect, useState, useMemo, useCallback } from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { useModelsStore, initializeModels, type TranscriptionModel } from '..'
import { ApiKeyModal } from '../components/api-key-modal'
import {
  ModelsHeader,
  ModelsSearch,
  QuickFilters,
  type FilterType,
} from '../components/header'
import { ModelsTable } from '../components/table'
import {
  getModelCapabilities,
  getPostProcessingCapabilities,
} from '../model-capabilities'
import {
  downloadModel,
  deleteModel,
  syncModels,
  createSTTColumns,
  createPostProcessingColumns,
} from '../utils'

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
  const [activeTab, setActiveTab] = useState<
    'speech-to-text' | 'post-processing'
  >('speech-to-text')

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

  const postProcessingColumns = useMemo(
    () => createPostProcessingColumns(columnActions),
    [columnActions]
  )

  const sttModels = useMemo(
    () => models.filter(m => m.purpose === 'speech-to-text'),
    [models]
  )
  const postProcessingModels = useMemo(
    () => models.filter(m => m.purpose === 'post-processing'),
    [models]
  )

  // Apply quick filters
  const filterModels = useCallback(
    (modelList: TranscriptionModel[]) => {
      if (quickFilter === 'all') return modelList

      return modelList.filter(m => {
        const isSTT = m.purpose === 'speech-to-text'
        const capabilities = isSTT
          ? getModelCapabilities(m.id)
          : getPostProcessingCapabilities(m.id)

        switch (quickFilter) {
          case 'cloud':
            return m.type === 'cloud'
          case 'local':
            return m.type === 'local'
          case 'high-accuracy':
            if (!capabilities) return false
            if (isSTT && 'accuracy' in capabilities) {
              return capabilities.accuracy === 'high'
            }
            if (!isSTT && 'quality' in capabilities) {
              return capabilities.quality === 'best'
            }
            return false
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
  const filteredPostProcessingModels = useMemo(
    () => filterModels(postProcessingModels),
    [filterModels, postProcessingModels]
  )

  const activeModels =
    activeTab === 'speech-to-text' ? sttModels : postProcessingModels

  const cloudModelsCount = activeModels.filter(m => m.type === 'cloud').length
  const localModelsCount = activeModels.filter(m => m.type === 'local').length
  const configuredCount = activeModels.filter(m =>
    m.type === 'cloud' ? m.hasApiKey : m.isDownloaded
  ).length
  const selectedModel = activeModels.find(m => m.isSelected)

  // Reset quick filter when switching tabs
  useEffect(() => {
    setQuickFilter('all')
  }, [activeTab])

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

      <Tabs
        value={activeTab}
        onValueChange={v =>
          setActiveTab(v as 'speech-to-text' | 'post-processing')
        }
        className="mt-2"
      >
        <div className="flex items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="speech-to-text">
              Speech-to-Text ({sttModels.length})
            </TabsTrigger>
            <TabsTrigger value="post-processing">
              Post-Processing ({postProcessingModels.length})
            </TabsTrigger>
          </TabsList>
          <ModelsSearch value={globalFilter ?? ''} onChange={setGlobalFilter} />
        </div>

        <div className="mt-4">
          <QuickFilters
            activeFilter={quickFilter}
            onFilterChange={setQuickFilter}
            configuredCount={configuredCount}
          />
        </div>

        <TabsContent value="speech-to-text" className="mt-4">
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
        </TabsContent>

        <TabsContent value="post-processing" className="mt-4">
          <ModelsTable
            models={filteredPostProcessingModels}
            columns={postProcessingColumns}
            sorting={sorting}
            columnFilters={columnFilters}
            globalFilter={globalFilter}
            onSortingChange={setSorting}
            onColumnFiltersChange={setColumnFilters}
            onGlobalFilterChange={setGlobalFilter}
          />
        </TabsContent>
      </Tabs>

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
