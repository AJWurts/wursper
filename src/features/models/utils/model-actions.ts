import { invoke } from '@tauri-apps/api/core'
import { toast } from 'sonner'

import { storeAnalytics } from '@/lib/analytics'

import { initializeModels } from '..'

import type { TranscriptionModel } from '../types'

/**
 * Downloads a local model and auto-selects it
 */
export async function downloadModel(
  model: TranscriptionModel,
  selectModel: (id: string) => Promise<void>
): Promise<void> {
  if (!model.downloadUrl || !model.filename || !model.engine) {
    toast.error('Invalid model configuration')
    return
  }

  // Show loading toast
  const toastId = toast.loading(`Downloading ${model.name}...`)

  try {
    await invoke<string>('download_local_model', {
      modelId: model.id,
      downloadUrl: model.downloadUrl,
      filename: model.filename,
      engineType: model.engine,
    })

    // Reload models to update state
    await initializeModels()

    // Auto-select and start the downloaded model
    await selectModel(model.id)

    toast.success(`${model.name} ready to use!`, { id: toastId })

    // Track successful download
    storeAnalytics.trackModelAction('downloaded', {
      modelId: model.id,
      modelType: 'stt',
      modelProvider: model.provider,
      modelSize: model.size ?? undefined,
    })
  } catch (error) {
    toast.error(`Failed to download: ${error}`, { id: toastId })
    storeAnalytics.trackError(String(error), {
      context: 'model_download',
      modelId: model.id,
    })
  }
}

/**
 * Deletes a local model
 */
export async function deleteModel(model: TranscriptionModel): Promise<void> {
  if (!model.path) {
    toast.error('Model path not found')
    return
  }

  try {
    await invoke('delete_local_model', { modelPath: model.path })
    toast.success(`${model.name} model deleted`)
    await initializeModels()

    // Track deletion
    storeAnalytics.trackModelAction('deleted', {
      modelId: model.id,
      modelType: 'stt',
      modelProvider: model.provider,
    })
  } catch (error) {
    toast.error(`Failed to delete ${model.name}: ${error}`)
    storeAnalytics.trackError(String(error), {
      context: 'model_delete',
      modelId: model.id,
    })
    throw error
  }
}

/**
 * Syncs models with default configuration
 */
export async function syncModels(
  syncDefaultModels: () => Promise<void>
): Promise<void> {
  const toastId = toast.loading('Syncing models...')

  try {
    await syncDefaultModels()
    toast.success('Models synced!', { id: toastId })
  } catch (error) {
    toast.error(`Failed to sync: ${error}`, { id: toastId })
  }
}
