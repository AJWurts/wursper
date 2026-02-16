import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { open } from '@tauri-apps/plugin-shell'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { analytics, AnalyticsEvents, trackEvent } from '@/lib/analytics'

import type { UpdateStatus } from '@/lib/generated/UpdateStatus'

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

/**
 * Hook to handle app update checking and installation
 * - Listens for update status events from Tauri backend
 * - Shows toast notifications for update progress
 * - Auto-checks for updates on startup (after 10 second delay)
 */
export function useUpdateChecker() {
  const updateToastId = useRef<string | number | null>(null)

  // Listen for update status events
  useEffect(() => {
    const unlisten = listen<UpdateStatus>('update-status', event => {
      const status = event.payload

      switch (status.status) {
        case 'checking':
          updateToastId.current = toast.loading('Checking for updates...')
          break

        case 'available': {
          const update = status.update
          toast.success(`Update available: v${update.version}`, {
            id: updateToastId.current ?? undefined,
            description: update.body || 'A new version is available.',
            duration: 15000,
            action: {
              label: 'Download',
              onClick: () => {
                invoke('download_and_install_update')
                trackEvent(AnalyticsEvents.UPDATE_DOWNLOADED, {
                  version: update.version,
                })
              },
            },
          })
          trackEvent(AnalyticsEvents.UPDATE_CHECKED, {
            update_available: true,
            version: update.version,
          })
          break
        }

        case 'notAvailable':
          toast.success('You are on the latest version', {
            id: updateToastId.current ?? undefined,
            description: 'No updates available at this time.',
          })
          trackEvent(AnalyticsEvents.UPDATE_CHECKED, {
            update_available: false,
          })
          break

        case 'downloading': {
          const progress = status.progress
          const percent = progress.percent?.toFixed(0) ?? 0
          const downloaded = formatBytes(Number(progress.downloaded))
          const total = progress.total
            ? formatBytes(Number(progress.total))
            : 'unknown'

          toast.loading(`Downloading update... ${percent}%`, {
            id: updateToastId.current ?? undefined,
            description: `${downloaded} / ${total}`,
          })
          break
        }

        case 'downloaded':
          toast.loading('Preparing to install...', {
            id: updateToastId.current ?? undefined,
          })
          break

        case 'installing':
          toast.success('Update installed! Restart the app to apply.', {
            id: updateToastId.current ?? undefined,
            duration: 10000,
            action: {
              label: 'Restart later',
              onClick: () => {},
            },
          })
          trackEvent(AnalyticsEvents.UPDATE_INSTALLED)
          break

        case 'error':
          toast.error('Failed to check for updates', {
            id: updateToastId.current ?? undefined,
            description: 'Please try again later or report an issue.',
            action: {
              label: 'Report Issue',
              onClick: () => {
                open('https://github.com/nitintf/dicta/issues/new')
              },
            },
            duration: 8000,
          })
          analytics.trackError(status.message, { context: 'update' })
          break
      }
    })

    return () => {
      unlisten.then(fn => fn())
    }
  }, [])

  // Auto-check for updates on startup (with delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      invoke('check_for_updates').catch(() => {
        // Silent fail on startup auto-check
      })
    }, 10000) // Check after 10 seconds

    return () => clearTimeout(timer)
  }, [])
}
