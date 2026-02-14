import { useEffect, useMemo } from 'react'

import {
  useTranscriptionsStore,
  initializeTranscriptions,
  setupTranscriptionsSync,
} from '@/features/transcriptions'

import { groupTranscriptionsByDate } from '../utils'
import { EmptyState } from './empty-state'
import { StatsHeader } from './stats-header'
import { TranscriptionGroup } from './transcription-group'

export function HomePageContent() {
  const { transcriptions, initialized, getStats, deleteTranscription } =
    useTranscriptionsStore()

  const stats = getStats()

  // Initialize transcriptions store
  useEffect(() => {
    if (!initialized) {
      void initializeTranscriptions()
    }

    setupTranscriptionsSync()
  }, [initialized])

  // Group transcriptions by date
  const groupedTranscriptions = useMemo(
    () => groupTranscriptionsByDate(transcriptions),
    [transcriptions]
  )

  const handleDeleteTranscription = (id: string) => {
    void deleteTranscription(id)
  }

  return (
    <div className="h-full w-full flex flex-col">
      <div className="shrink-0 px-8 pt-16 pb-2">
        <StatsHeader
          todayCount={stats.todayCount}
          totalTranscriptions={stats.totalTranscriptions}
          totalWords={stats.totalWords}
          todayWords={stats.todayWords}
          wordsPerMinute={stats.wordsPerMinute}
          timeSavedMinutes={stats.timeSavedMinutes}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-8 pb-8">
        <div className="sticky top-0 z-20 -mx-8 px-8 bg-background pb-3 pt-2 shadow-[0_8px_12px_-4px_hsl(var(--background))]">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
            Recent Transcriptions
          </h2>
        </div>

        {transcriptions.length === 0 ? (
          <EmptyState />
        ) : (
          groupedTranscriptions.map(group => (
            <TranscriptionGroup
              key={group.date}
              group={group}
              onDeleteTranscription={handleDeleteTranscription}
            />
          ))
        )}
      </div>
    </div>
  )
}
