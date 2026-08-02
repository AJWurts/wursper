import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { create } from 'zustand'

import type { Transcription, TranscriptionsStore } from './types'
import type { TranscriptionRecord } from './types/generated/TranscriptionRecord'

function isToday(timestamp: number): boolean {
  const today = new Date()
  const date = new Date(timestamp)
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

export const useTranscriptionsStore = create<TranscriptionsStore>(
  (set, get) => ({
    transcriptions: [],
    initialized: false,

    initialize: async () => {
      try {
        // Newest first, straight out of the local SQLite database
        const records =
          await invoke<TranscriptionRecord[]>('list_transcriptions')

        const transcriptions = (records ?? []).map(record => ({
          ...record,
          timestamp: Number(record.timestamp),
        }))

        set({ transcriptions, initialized: true })
      } catch (error) {
        console.error('Error initializing transcriptions store:', error)
        set({ transcriptions: [], initialized: true })
      }
    },

    addTranscription: async transcription => {
      const record: Transcription = {
        ...transcription,
        id: transcription.id ?? crypto.randomUUID(),
        wordCount: transcription.wordCount ?? countWords(transcription.text),
      }

      try {
        await invoke('save_transcription', { record })

        set({ transcriptions: [record, ...get().transcriptions] })
      } catch (error) {
        console.error('Error saving transcription:', error)
        throw error
      }

      return record
    },

    deleteTranscription: async id => {
      try {
        await invoke('delete_transcription', { id })

        set({ transcriptions: get().transcriptions.filter(t => t.id !== id) })
      } catch (error) {
        console.error('Error deleting transcription:', error)
        throw error
      }
    },

    clearAll: async () => {
      try {
        await invoke('clear_transcriptions')

        set({ transcriptions: [] })
      } catch (error) {
        console.error('Error clearing transcriptions:', error)
        throw error
      }
    },

    getStats: () => {
      const transcriptions = get().transcriptions
      const todayTranscriptions = transcriptions.filter(t =>
        isToday(t.timestamp)
      )
      const totalWords = transcriptions.reduce((sum, t) => sum + t.wordCount, 0)
      const todayWords = todayTranscriptions.reduce(
        (sum, t) => sum + t.wordCount,
        0
      )
      const totalDuration = transcriptions.reduce(
        (sum, t) => sum + (t.duration ?? 0),
        0
      )

      // Words per minute (only meaningful when durations were recorded)
      const wordsPerMinute =
        totalDuration > 0 ? Math.round((totalWords / totalDuration) * 60) : 0

      // Estimate time saved: typing ~40 WPM vs speaking
      const typingTimeMinutes = totalWords / 40
      const speakingTimeMinutes = totalDuration / 60
      const timeSavedMinutes = Math.max(
        0,
        typingTimeMinutes - speakingTimeMinutes
      )

      return {
        totalTranscriptions: transcriptions.length,
        totalWords,
        todayCount: todayTranscriptions.length,
        todayWords,
        totalDuration,
        wordsPerMinute,
        timeSavedMinutes: Math.round(timeSavedMinutes),
        avgWordsPerTranscription:
          transcriptions.length > 0
            ? Math.round(totalWords / transcriptions.length)
            : 0,
      }
    },
  })
)

export const initializeTranscriptions = async () => {
  await useTranscriptionsStore.getState().initialize()
}

// Reload when another window (or the backend) changes the history
export const setupTranscriptionsSync = () => {
  listen('transcriptions-changed', async () => {
    await useTranscriptionsStore.getState().initialize()
  })
}
