export interface TypeBadgeConfig {
  label: string
  className: string
}

export const MODEL_TYPE_CONFIG: Record<string, TypeBadgeConfig> = {
  cloud: {
    label: 'Cloud',
    className:
      'bg-sky-100/80 text-sky-700 border-sky-200/60 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800/40 text-[10px] px-1.5 py-0',
  },
  local: {
    label: 'Local',
    className:
      'bg-violet-100/80 text-violet-700 border-violet-200/60 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800/40 text-[10px] px-1.5 py-0',
  },
} as const

export function getTypeBadgeConfig(type: string): TypeBadgeConfig {
  return (
    MODEL_TYPE_CONFIG[type] || {
      label: type,
      className:
        'bg-gray-100/80 text-gray-600 border-gray-200/60 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700/40 text-[10px] px-1.5 py-0',
    }
  )
}
