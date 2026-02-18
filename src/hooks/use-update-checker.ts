import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { relaunch } from '@tauri-apps/plugin-process'
import { open } from '@tauri-apps/plugin-shell'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { analytics, AnalyticsEvents, trackEvent } from '@/lib/analytics'

import type { UpdateStatus } from '@/lib/generated/UpdateStatus'

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
          const percent = status.progress.percent?.toFixed(0) ?? 0
          toast.loading(`Downloading update... ${percent}%`, {
            id: updateToastId.current ?? undefined,
          })
          break
        }

        case 'downloaded':
          toast.loading('Installing update...', {
            id: updateToastId.current ?? undefined,
          })
          break

        case 'installing':
          toast.success('Update ready! Restart to apply.', {
            id: updateToastId.current ?? undefined,
            duration: 30000,
            action: {
              label: 'Restart Now',
              onClick: () => relaunch(),
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

  // Auto-check for updates on startup (silent - only notify if update available)
  useEffect(() => {
    const timer = setTimeout(() => {
      invoke('check_for_updates', { silent: true }).catch(() => {})
    }, 10000)

    return () => clearTimeout(timer)
  }, [])
}
