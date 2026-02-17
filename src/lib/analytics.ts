import posthog from 'posthog-js'

// PostHog configuration
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY || ''
const POSTHOG_HOST =
  import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com'

// Always disable analytics in development mode
const IS_DEVELOPMENT = import.meta.env.DEV

let initialized = false
let analyticsEnabled = false

/**
 * Check if analytics should be active
 * Returns false in development mode regardless of settings
 */
function isAnalyticsActive(): boolean {
  if (IS_DEVELOPMENT) {
    return false
  }
  return analyticsEnabled && initialized && !!POSTHOG_KEY
}

/**
 * Initialize PostHog analytics
 * Only initializes in production when analytics is enabled in settings
 */
export function initAnalytics(enabled: boolean): void {
  analyticsEnabled = enabled

  // Never initialize in development mode
  if (IS_DEVELOPMENT) {
    console.log('[Analytics] Disabled in development mode')
    return
  }

  if (!POSTHOG_KEY) {
    console.log(
      '[Analytics] PostHog key not configured, skipping initialization'
    )
    return
  }

  if (enabled && !initialized) {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      // Only create profiles for identified users
      person_profiles: 'identified_only',
      // Enable autocapture for click tracking
      autocapture: true,
      // Capture page views
      capture_pageview: true,
      // Capture page leaves
      capture_pageleave: true,
      // Enable session recording for user behavior analysis
      disable_session_recording: false,
      // Persist across sessions
      persistence: 'localStorage',
      // Respect Do Not Track
      respect_dnt: true,
      // Bootstrap with device ID for consistent tracking
      bootstrap: {
        distinctID: undefined, // Will be auto-generated
      },
      // Enable feature flags
      advanced_disable_feature_flags: false,
    })

    initialized = true
    console.log('[Analytics] PostHog initialized successfully')
  } else if (!enabled && initialized) {
    // Disable analytics if user opts out
    posthog.opt_out_capturing()
    console.log('[Analytics] PostHog capturing disabled')
  } else if (enabled && initialized) {
    // Re-enable if user opts back in
    posthog.opt_in_capturing()
    console.log('[Analytics] PostHog capturing re-enabled')
  }
}

/**
 * Update analytics enabled state
 * Call this when user toggles analytics in settings
 */
export function setAnalyticsEnabled(enabled: boolean): void {
  analyticsEnabled = enabled

  // Never enable in development mode
  if (IS_DEVELOPMENT) {
    console.log('[Analytics] Disabled in development mode (setting ignored)')
    return
  }

  if (!POSTHOG_KEY || !initialized) {
    // Try to initialize if not already
    if (enabled) {
      initAnalytics(enabled)
    }
    return
  }

  if (enabled) {
    posthog.opt_in_capturing()
    console.log('[Analytics] User opted in to analytics')
  } else {
    posthog.opt_out_capturing()
    console.log('[Analytics] User opted out of analytics')
  }
}

/**
 * Track a custom event
 */
export function trackEvent(
  event: string,
  properties?: Record<string, unknown>
): void {
  if (!isAnalyticsActive()) {
    return
  }

  posthog.capture(event, properties)
}

/**
 * Identify a user (optional - for when you have user accounts)
 */
export function identifyUser(
  userId: string,
  properties?: Record<string, unknown>
): void {
  if (!isAnalyticsActive()) {
    return
  }

  posthog.identify(userId, properties)
}

/**
 * Set user properties
 */
export function setUserProperties(properties: Record<string, unknown>): void {
  if (!isAnalyticsActive()) {
    return
  }

  posthog.people.set(properties)
}

/**
 * Reset user identity (e.g., on logout)
 */
export function resetUser(): void {
  if (!isAnalyticsActive()) {
    return
  }

  posthog.reset()
}

// Pre-defined event names for consistency
export const AnalyticsEvents = {
  // Recording events
  RECORDING_STARTED: 'recording_started',
  RECORDING_COMPLETED: 'recording_completed',
  RECORDING_CANCELLED: 'recording_cancelled',
  RECORDING_ERROR: 'recording_error',

  // Transcription events
  TRANSCRIPTION_STARTED: 'transcription_started',
  TRANSCRIPTION_COMPLETED: 'transcription_completed',
  TRANSCRIPTION_ERROR: 'transcription_error',

  // AI Processing events
  AI_PROCESSING_STARTED: 'ai_processing_started',
  AI_PROCESSING_COMPLETED: 'ai_processing_completed',
  AI_PROCESSING_ERROR: 'ai_processing_error',

  // Model events
  MODEL_DOWNLOADED: 'model_downloaded',
  MODEL_DELETED: 'model_deleted',
  MODEL_STARTED: 'model_started',
  MODEL_STOPPED: 'model_stopped',
  MODEL_SELECTED: 'model_selected',

  // Feature usage
  FEATURE_USED: 'feature_used',
  PASTE_TRANSCRIPT: 'paste_transcript',
  COPY_TO_CLIPBOARD: 'copy_to_clipboard',

  // Settings events
  SETTING_CHANGED: 'setting_changed',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',

  // Navigation events
  PAGE_VIEWED: 'page_viewed',
  SETTINGS_OPENED: 'settings_opened',
  SETTINGS_SECTION_VIEWED: 'settings_section_viewed',

  // App lifecycle
  APP_LAUNCHED: 'app_launched',
  APP_CLOSED: 'app_closed',
  UPDATE_CHECKED: 'update_checked',
  UPDATE_DOWNLOADED: 'update_downloaded',
  UPDATE_INSTALLED: 'update_installed',

  // Errors
  ERROR_OCCURRED: 'error_occurred',
} as const

// Helper functions for common tracking patterns
export const analytics = {
  // Track recording session
  trackRecording: (props: {
    duration?: number
    modelId?: string
    modelType?: 'cloud' | 'local'
    aiProcessingEnabled?: boolean
    success: boolean
    error?: string
  }) => {
    if (props.success) {
      trackEvent(AnalyticsEvents.RECORDING_COMPLETED, {
        duration_seconds: props.duration,
        model_id: props.modelId,
        model_type: props.modelType,
        ai_processing_enabled: props.aiProcessingEnabled,
      })
    } else {
      trackEvent(AnalyticsEvents.RECORDING_ERROR, {
        error: props.error,
        model_id: props.modelId,
      })
    }
  },

  // Track model usage
  trackModelAction: (
    action: 'downloaded' | 'deleted' | 'started' | 'stopped' | 'selected',
    props: {
      modelId: string
      modelType: 'stt' | 'post-processing'
      modelProvider?: string
      modelSize?: string
    }
  ) => {
    const eventMap = {
      downloaded: AnalyticsEvents.MODEL_DOWNLOADED,
      deleted: AnalyticsEvents.MODEL_DELETED,
      started: AnalyticsEvents.MODEL_STARTED,
      stopped: AnalyticsEvents.MODEL_STOPPED,
      selected: AnalyticsEvents.MODEL_SELECTED,
    }
    trackEvent(eventMap[action], {
      model_id: props.modelId,
      model_type: props.modelType,
      model_provider: props.modelProvider,
      model_size: props.modelSize,
    })
  },

  // Track settings changes
  trackSettingChange: (setting: string, value: unknown) => {
    trackEvent(AnalyticsEvents.SETTING_CHANGED, {
      setting_name: setting,
      setting_value: value,
    })
  },

  // Track feature usage
  trackFeatureUsed: (feature: string, props?: Record<string, unknown>) => {
    trackEvent(AnalyticsEvents.FEATURE_USED, {
      feature_name: feature,
      ...props,
    })
  },

  // Track errors
  trackError: (error: Error | string, context?: Record<string, unknown>) => {
    trackEvent(AnalyticsEvents.ERROR_OCCURRED, {
      error_message: typeof error === 'string' ? error : error.message,
      error_stack: typeof error === 'string' ? undefined : error.stack,
      ...context,
    })
  },

  // Track page/section views
  trackPageView: (page: string, props?: Record<string, unknown>) => {
    trackEvent(AnalyticsEvents.PAGE_VIEWED, {
      page_name: page,
      ...props,
    })
  },
}
