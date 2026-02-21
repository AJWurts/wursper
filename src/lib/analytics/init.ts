/**
 * PostHog initialization - single function for all windows
 */
import posthog from 'posthog-js'

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY || ''
const POSTHOG_HOST =
  import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com'
const IS_DEVELOPMENT = import.meta.env.DEV

let isInitialized = false

export interface InitAnalyticsOptions {
  autocapture?: boolean
  capturePageview?: boolean
  capturePageleave?: boolean
  sessionRecording?: boolean
  onLoaded?: () => void
}

/**
 * Initialize PostHog analytics.
 * - Safe to call multiple times (only initializes once)
 * - Async and non-blocking - UI renders immediately
 * - Shares opt-out status across windows via localStorage
 * - onLoaded is called even if already initialized
 *
 * @param options - Optional configuration overrides
 */
export function initAnalytics(options: InitAnalyticsOptions = {}): void {
  const { onLoaded } = options

  // Already initialized or disabled - call onLoaded immediately if provided
  if (isInitialized || IS_DEVELOPMENT || !POSTHOG_KEY) {
    if (onLoaded && isInitialized) {
      // Use setTimeout to avoid sync setState in React effects
      setTimeout(onLoaded, 0)
    }
    return
  }

  const {
    autocapture = false,
    capturePageview = false,
    capturePageleave = false,
    sessionRecording = false,
  } = options

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: 'identified_only',
    autocapture,
    capture_pageview: capturePageview,
    capture_pageleave: capturePageleave,
    disable_session_recording: !sessionRecording,
    persistence: 'localStorage',
    respect_dnt: true,
    loaded: onLoaded,
  })

  isInitialized = true
}

/**
 * Check if analytics has been initialized
 */
export function isAnalyticsInitialized(): boolean {
  return isInitialized
}
