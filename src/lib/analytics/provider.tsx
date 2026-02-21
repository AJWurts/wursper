import { PostHogProvider } from '@posthog/react'
import posthog from 'posthog-js'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { useSettingsStore } from '@/features/settings'

import { AnalyticsContext } from './context'
import { initAnalytics } from './init'

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY || ''
const IS_DEVELOPMENT = import.meta.env.DEV

interface AnalyticsProviderProps {
  children: ReactNode
}

function AnalyticsProviderInner({ children }: AnalyticsProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const analyticsEnabled = useSettingsStore(
    state => state.settings.privacy.analytics
  )
  const settingsInitialized = useSettingsStore(state => state.initialized)

  useEffect(() => {
    if (IS_DEVELOPMENT) {
      console.log('[Analytics] Disabled in development mode')
      return
    }

    if (!POSTHOG_KEY) {
      console.log('[Analytics] PostHog key not configured')
      return
    }

    if (!settingsInitialized) {
      return
    }

    if (!isInitialized && analyticsEnabled) {
      initAnalytics({
        autocapture: true,
        capturePageview: true,
        capturePageleave: true,
        sessionRecording: true,
        onLoaded: () => {
          console.log('[Analytics] PostHog initialized successfully')
          setIsInitialized(true)
        },
      })
    }

    if (isInitialized) {
      if (analyticsEnabled) {
        posthog.opt_in_capturing()
        console.log('[Analytics] Capturing enabled')
      } else {
        posthog.opt_out_capturing()
        console.log('[Analytics] Capturing disabled')
      }
    }
  }, [analyticsEnabled, settingsInitialized, isInitialized])

  const contextValue = useMemo(
    () => ({
      isInitialized,
      isEnabled: analyticsEnabled && isInitialized && !IS_DEVELOPMENT,
    }),
    [isInitialized, analyticsEnabled]
  )

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  )
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  if (IS_DEVELOPMENT || !POSTHOG_KEY) {
    return (
      <AnalyticsContext.Provider
        value={{ isInitialized: false, isEnabled: false }}
      >
        {children}
      </AnalyticsContext.Provider>
    )
  }

  return (
    <PostHogProvider client={posthog}>
      <AnalyticsProviderInner>{children}</AnalyticsProviderInner>
    </PostHogProvider>
  )
}
