import { Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/copy-button'
import { PlayButton } from '@/components/ui/play-button'
import { useAudioPath } from '@/features/transcriptions'
import { cn } from '@/lib/cn'

import { formatTime, formatDuration } from '../utils'

import type { Transcription } from '@/features/transcriptions'

interface TranscriptionCardProps {
  transcription: Transcription
  onDelete: (id: string) => void
  isLast: boolean
}

export function TranscriptionCard({
  transcription,
  onDelete,
  isLast,
}: TranscriptionCardProps) {
  const timestamp = parseInt(transcription.id.split('-')[0])
  // Only fetch audio path if the transcription has audio saved
  const { audioPath } = useAudioPath(transcription.hasAudio ? timestamp : null)

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
            <p className="text-[13px] leading-relaxed text-foreground line-clamp-2 mb-1.5">
              {transcription.text}
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
