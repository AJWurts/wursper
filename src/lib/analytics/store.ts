/**
 * Analytics utilities for Zustand stores
 * Stores can't use React hooks, so they use posthog directly
 * PostHog handles opt-out internally once initialized by AnalyticsProvider
 */
import posthog from 'posthog-js'

import { AnalyticsEvents } from './events'

const IS_DEVELOPMENT = import.meta.env.DEV

function capture(event: string, properties?: Record<string, unknown>) {
  if (IS_DEVELOPMENT) return
  posthog.capture(event, properties)
}

/**
 * Analytics helper for use in Zustand stores (non-React code)
 */
export const storeAnalytics = {
  trackSettingChange: (setting: string, value: unknown) => {
    capture(AnalyticsEvents.SETTING_CHANGED, {
      setting_name: setting,
      setting_value: value,
    })
  },

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
    capture(eventMap[action], {
      model_id: props.modelId,
      model_type: props.modelType,
      model_provider: props.modelProvider,
      model_size: props.modelSize,
    })
  },

  trackFeatureUsed: (feature: string, props?: Record<string, unknown>) => {
    capture(AnalyticsEvents.FEATURE_USED, {
      feature_name: feature,
      ...props,
    })
  },

  trackError: (error: Error | string, context?: Record<string, unknown>) => {
    capture(AnalyticsEvents.ERROR_OCCURRED, {
      error_message: typeof error === 'string' ? error : error.message,
      error_stack: typeof error === 'string' ? undefined : error.stack,
      ...context,
    })
  },
}
