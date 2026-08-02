import type { TranscriptionRecord } from './types/generated/TranscriptionRecord'

export type { TranscriptionRecord }

/**
 * UI-facing shape of a transcription record.
 *
 * The generated type models the Rust `i64` timestamp as `bigint`; over the
 * Tauri IPC bridge it arrives as a plain JSON number, so the store normalises
 * it to `number` for the UI.
 */
export type Transcription = Omit<TranscriptionRecord, 'timestamp'> & {
  timestamp: number
}

export interface TranscriptionStats {
  totalTranscriptions: number
  totalWords: number
  todayCount: number
  todayWords: number
  totalDuration: number
  wordsPerMinute: number
  timeSavedMinutes: number
  avgWordsPerTranscription: number
}

export interface TranscriptionsStore {
  transcriptions: Transcription[]
  initialized: boolean
  initialize: () => Promise<void>
  addTranscription: (
    transcription: Omit<Transcription, 'id' | 'wordCount'> &
      Partial<Pick<Transcription, 'id' | 'wordCount'>>
  ) => Promise<Transcription>
  deleteTranscription: (id: string) => Promise<void>
  clearAll: () => Promise<void>
  getStats: () => TranscriptionStats
}
