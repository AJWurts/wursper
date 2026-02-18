import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import { ChevronDown, ChevronRight, Cloud, Cpu } from 'lucide-react'
import { useState, useMemo } from 'react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/cn'

import { groupModels, type ModelGroup } from '../../utils/model-groups'

import type { TranscriptionModel } from '../../types'

interface GroupedModelsTableProps {
  models: TranscriptionModel[]
  columns: ColumnDef<TranscriptionModel>[]
  globalFilter: string
}

export function GroupedModelsTable({
  models,
  columns,
  globalFilter,
}: GroupedModelsTableProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(['whisper-local', 'cloud-apis']) // Default expanded
  )

  const groups = useMemo(() => groupModels(models), [models])

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  // Filter groups based on global filter
  const filteredGroups = useMemo(() => {
    if (!globalFilter) return groups

    const lowerFilter = globalFilter.toLowerCase()
    return groups
      .map(group => ({
        ...group,
        models: group.models.filter(
          m =>
            m.name.toLowerCase().includes(lowerFilter) ||
            m.provider.toLowerCase().includes(lowerFilter) ||
            m.description?.toLowerCase().includes(lowerFilter)
        ),
      }))
      .filter(group => group.models.length > 0)
  }, [groups, globalFilter])

  return (
    <div className="pb-16">
      <h2 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-widest">
        Available Models
      </h2>
      <div className="rounded-md border">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead
                  key={column.id ?? index}
                  style={{
                    width: column.size,
                    minWidth: column.minSize,
                    maxWidth: column.maxSize,
                  }}
                >
                  {typeof column.header === 'string'
                    ? column.header
                    : column.id === 'name'
                      ? 'Model'
                      : column.id === 'provider'
                        ? 'Provider'
                        : column.id === 'size'
                          ? 'Size'
                          : column.id === 'status'
                            ? 'Status'
                            : column.id === 'actions'
                              ? ''
                              : ''}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGroups.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No models found.
                </TableCell>
              </TableRow>
            ) : (
              filteredGroups.map(group => (
                <GroupSection
                  key={group.id}
                  group={group}
                  columns={columns}
                  isExpanded={expandedGroups.has(group.id)}
                  onToggle={() => toggleGroup(group.id)}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

interface GroupSectionProps {
  group: ModelGroup
  columns: ColumnDef<TranscriptionModel>[]
  isExpanded: boolean
  onToggle: () => void
}

function GroupSection({
  group,
  columns,
  isExpanded,
  onToggle,
}: GroupSectionProps) {
  const table = useReactTable({
    data: group.models,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const selectedCount = group.models.filter(m => m.isSelected).length
  const downloadedCount = group.models.filter(m => m.isDownloaded).length
  const totalCount = group.models.length

  // Get the icon for this group
  const GroupIcon = useMemo(() => {
    if (group.icon === 'cloud') return Cloud
    if (group.icon === 'apple') {
      return () => (
        <img
          src="/icons/apple.svg"
          alt="Apple"
          className="size-4 dark:invert"
        />
      )
    }
    if (group.icon === 'candle') {
      return () => (
        <img src="/icons/huggingface.svg" alt="Candle" className="size-4" />
      )
    }
    if (group.icon === 'whisperkit') {
      return () => (
        <img
          src="/icons/whisperkit-dark.png"
          alt="WhisperKit"
          className="size-4"
        />
      )
    }
    return Cpu
  }, [group.icon])

  return (
    <>
      {/* Group Header Row */}
      <TableRow
        className={cn(
          'cursor-pointer hover:bg-muted/50 bg-muted/30',
          isExpanded && 'border-b-0'
        )}
        onClick={onToggle}
      >
        <TableCell colSpan={columns.length}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-5 h-5 text-muted-foreground">
              {isExpanded ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <GroupIcon />
              <span className="font-medium">{group.name}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {group.description}
            </span>
            <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
              {selectedCount > 0 && (
                <span className="text-primary">{selectedCount} selected</span>
              )}
              <span>
                {group.providers.includes('local-whisper') ||
                group.providers.includes('candle') ||
                group.providers.includes('whisperkit')
                  ? `${downloadedCount}/${totalCount} downloaded`
                  : `${totalCount} available`}
              </span>
            </div>
          </div>
        </TableCell>
      </TableRow>

      {/* Model Rows */}
      {isExpanded &&
        table.getRowModel().rows.map((row, index) => {
          const isSelected = row.original.isSelected
          return (
            <TableRow
              key={row.id}
              data-state={isSelected ? 'selected' : undefined}
              className={cn(
                'bg-background',
                index === table.getRowModel().rows.length - 1 && 'border-b',
                isSelected &&
                  'bg-primary/5 hover:bg-primary/10 border-l-2 border-l-primary'
              )}
            >
              {row.getVisibleCells().map((cell, cellIndex) => (
                <TableCell
                  key={cell.id}
                  style={{
                    width: cell.column.getSize(),
                    minWidth: cell.column.columnDef.minSize,
                    maxWidth: cell.column.columnDef.maxSize,
                  }}
                  className={cn(cellIndex === 0 && !isSelected && 'pl-10')}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          )
        })}
    </>
  )
}
