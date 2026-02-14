import { Sparkles } from 'lucide-react'

import { VibesPanel } from '../components'

export function VibesPage() {
  return (
    <div className="h-full p-6 pt-14 pb-16">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Vibes
          </h1>
        </div>
        <p className="text-[13px] text-muted-foreground ml-11">
          Style your transcriptions for different contexts
        </p>
      </div>

      <div className="pb-16">
        <VibesPanel />
      </div>
    </div>
  )
}
