import { invoke } from '@tauri-apps/api/core'

import { useSettingsStore } from '@/features/settings/store'
import { useTranscriptionsStore } from '@/features/transcriptions'

import type { Transcription } from '@/features/transcriptions'

export interface TranscriptionRequest {
  /** Raw audio bytes (WAV/PCM) captured for this recording */
  audioData: Uint8Array
  timestamp: number
  duration: number
}

/**
 * Result returned by the Rust transcription command.
 * Rust is responsible for copying/pasting the text (auto-copy / auto-paste
 * settings), we only persist the record and refresh the UI.
 */
interface TranscriptionResponse {
  text: string
  modelId: string
  provider: string
}

/**
 * Transcribe a recording and store the result:
 * 1. Send the audio to the Rust backend (which picks the selected engine and
 *    handles clipboard/paste according to the user's settings)
 * 2. Persist the resulting record in the local SQLite database
 */
export async function processTranscription(
  request: TranscriptionRequest
): Promise<Transcription | null> {
  const { audioData, timestamp, duration } = request

  const language = useSettingsStore.getState().settings.transcription.language

  const response = await invoke<TranscriptionResponse>(
    'transcribe_and_process',
    {
      request: {
        audioData: Array.from(audioData),
        timestamp,
        duration,
        language: language || null,
      },
    }
  )

  if (!response?.text) {
    return null
  }

  return useTranscriptionsStore.getState().addTranscription({
    text: response.text,
    timestamp,
    duration,
    modelId: response.modelId,
    provider: response.provider,
  })
}

/**
 * Calculates recording duration from start timestamp
 */
export function calculateDuration(startTime: number | null): number {
  if (!startTime) return 0
  return (Date.now() - startTime) / 1000
}
