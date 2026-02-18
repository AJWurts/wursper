import { Check, Cloud, Cpu, Zap, Shield } from 'lucide-react'

import { cn } from '@/lib/cn'

export type FilterType =
  | 'all'
  | 'cloud'
  | 'local'
  | 'high-accuracy'
  | 'fast'
  | 'configured'

interface QuickFiltersProps {
  activeFilter: FilterType
  onFilterChange: (filter: FilterType) => void
  configuredCount: number
}

export function QuickFilters({
  activeFilter,
  onFilterChange,
  configuredCount,
}: QuickFiltersProps) {
  const filters: { id: FilterType; label: string; icon?: React.ReactNode }[] = [
    { id: 'all', label: 'All' },
    { id: 'cloud', label: 'Cloud', icon: <Cloud className="h-3 w-3" /> },
    { id: 'local', label: 'Local', icon: <Cpu className="h-3 w-3" /> },
    {
      id: 'high-accuracy',
      label: 'High Accuracy',
      icon: <Shield className="h-3 w-3" />,
    },
    { id: 'fast', label: 'Fast', icon: <Zap className="h-3 w-3" /> },
  ]

  if (configuredCount > 0) {
    filters.push({
      id: 'configured',
      label: `Configured (${configuredCount})`,
      icon: <Check className="h-3 w-3" />,
    })
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {filters.map(filter => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full transition-colors',
            activeFilter === filter.id
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
          )}
        >
          {filter.icon}
          {filter.label}
        </button>
      ))}
    </div>
  )
}
