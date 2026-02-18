import { Trash2, Upload } from 'lucide-react'
import { useMemo } from 'react'

import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/copy-button'
import { PlayButton } from '@/components/ui/play-button'
import { useAudioPath } from '@/features/transcriptions'
import { cn } from '@/lib/cn'

import { formatTime, formatDuration, highlightSearchMatches } from '../utils'

import type { Transcription } from '@/features/transcriptions'

interface TranscriptionCardProps {
  transcription: Transcription
  onDelete: (id: string) => void
  isLast: boolean
  searchQuery?: string
}

export function TranscriptionCard({
  transcription,
  onDelete,
  isLast,
  searchQuery,
}: TranscriptionCardProps) {
  const timestamp = parseInt(transcription.id.split('-')[0])
  // Only fetch audio path if the transcription has audio saved
  const { audioPath } = useAudioPath(transcription.hasAudio ? timestamp : null)
  const isUploaded = transcription.sourceType === 'upload'

  // Highlight search matches
  const highlightedText = useMemo(() => {
    if (!searchQuery) return null
    return highlightSearchMatches(transcription.text, searchQuery)
  }, [transcription.text, searchQuery])

  return (
    <div
      className={cn(
        'group border-b border-border transition-colors hover:bg-accent/40',
        {
          'border-b-0': isLast,
        }
      )}
    >
      <div className="px-4 py-3.5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isUploaded && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-blue-500/10 text-blue-500 rounded">
                  <Upload className="h-2.5 w-2.5" />
                  Uploaded
                </span>
              )}
              {isUploaded && transcription.originalFilename && (
                <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                  {transcription.originalFilename}
                </span>
              )}
            </div>
            <p className="text-[13px] leading-relaxed text-foreground line-clamp-2 mb-1.5">
              {highlightedText
                ? highlightedText.map((segment, i) =>
                    segment.isHighlight ? (
                      <mark
                        key={i}
                        className="bg-yellow-200/80 dark:bg-yellow-500/30 text-foreground rounded-sm px-0.5"
                      >
                        {segment.text}
                      </mark>
                    ) : (
                      <span key={i}>{segment.text}</span>
                    )
                  )
                : transcription.text}
            </p>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span>{formatTime(transcription.timestamp)}</span>
              <span className="w-px h-3 bg-border" />
              <span>{transcription.wordCount} words</span>
              <span className="w-px h-3 bg-border" />
              <span>{formatDuration(transcription.duration ?? undefined)}</span>
            </div>
          </div>

          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {audioPath && <PlayButton audioPath={audioPath} size={26} />}
            <CopyButton
              content={transcription.text}
              size="icon"
              variant="ghost"
            />
            <Button
              size="icon-sm"
              variant="ghost"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(transcription.id)}
              aria-label="Delete transcription"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
