import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { create } from 'zustand'

import { storeAnalytics } from '@/lib/analytics'

import * as api from './api'
import { defaultSettings, type Settings, type VoiceInputDisplayMode } from './schema'

import type { SettingsStore } from './types'

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: defaultSettings,
  initialized: false,

  initialize: async () => {
    try {
      const settings = await api.getSettings()
      set({ settings, initialized: true })
    } catch (error) {
      console.error('Error initializing settings store:', error)
      set({ settings: defaultSettings, initialized: true })
    }
  },

  setOnboardingComplete: async (completed: boolean) => {
    try {
      const newSettings = {
        ...get().settings,
        onboarding: { completed },
      }
      set({ settings: newSettings })
      await api.updateOnboarding(completed)
    } catch (error) {
      console.error('Error saving onboarding status:', error)
    }
  },

  setVoiceInputShortcut: async (shortcut: string) => {
    try {
      const newSettings = {
        ...get().settings,
        voiceInput: { ...get().settings.voiceInput, shortcut },
      }
      set({ settings: newSettings })
      await api.updateVoiceInputSettings({ shortcut })
      await invoke('update_voice_input_shortcut', { shortcutStr: shortcut })
      storeAnalytics.trackSettingChange('voiceInputShortcut', shortcut)
    } catch (error) {
      console.error('Error saving voice input shortcut:', error)
    }
  },

  setMicrophoneDevice: async (deviceId: string | null) => {
    try {
      const newSettings = {
        ...get().settings,
        voiceInput: { ...get().settings.voiceInput, microphoneDeviceId: deviceId },
      }
      set({ settings: newSettings })
      await api.updateVoiceInputSettings({ microphoneDeviceId: deviceId })
      await invoke('rebuild_tray_menu_command')
      storeAnalytics.trackSettingChange(
        'microphoneDevice',
        deviceId ? 'changed' : 'default'
      )
    } catch (error) {
      console.error('Error saving microphone device:', error)
    }
  },

  setVoiceInputDisplayMode: async (mode: VoiceInputDisplayMode) => {
    try {
      const newSettings = {
        ...get().settings,
        voiceInput: { ...get().settings.voiceInput, displayMode: mode },
      }
      set({ settings: newSettings })
      await api.updateVoiceInputSettings({ displayMode: mode })
      storeAnalytics.trackSettingChange('voiceInputDisplayMode', mode)
    } catch (error) {
      console.error('Error saving voice input display mode:', error)
    }
  },

  setTranscriptionLanguage: async (language: string) => {
    try {
      const newSettings = {
        ...get().settings,
        transcription: { ...get().settings.transcription, language },
      }
      set({ settings: newSettings })
      await api.updateTranscriptionSettings({ language })
      await invoke('rebuild_tray_menu_command')
      storeAnalytics.trackSettingChange('transcriptionLanguage', language)
    } catch (error) {
      console.error('Error saving transcription language:', error)
    }
  },

  setPasteShortcut: async (shortcut: string) => {
    try {
      const newSettings = {
        ...get().settings,
        shortcuts: { ...get().settings.shortcuts, pasteLastTranscript: shortcut },
      }
      set({ settings: newSettings })
      await api.updateShortcutsSettings({ pasteLastTranscript: shortcut })
      await invoke('update_paste_shortcut', { shortcutStr: shortcut })
      storeAnalytics.trackSettingChange('pasteShortcut', shortcut)
    } catch (error) {
      console.error('Error saving paste shortcut:', error)
    }
  },

  setCommandModeShortcut: async (shortcut: string) => {
    try {
      const newSettings = {
        ...get().settings,
        shortcuts: { ...get().settings.shortcuts, commandModeShortcut: shortcut },
      }
      set({ settings: newSettings })
      await api.updateShortcutsSettings({ commandModeShortcut: shortcut })
      if (newSettings.shortcuts.enableCommandMode) {
        await invoke('update_command_mode_shortcut', { shortcutStr: shortcut })
      }
      storeAnalytics.trackSettingChange('commandModeShortcut', shortcut)
    } catch (error) {
      console.error('Error saving command mode shortcut:', error)
    }
  },

  setEnableCommandMode: async (enabled: boolean) => {
    try {
      const newSettings = {
        ...get().settings,
        shortcuts: { ...get().settings.shortcuts, enableCommandMode: enabled },
      }
      set({ settings: newSettings })
      await api.updateShortcutsSettings({ enableCommandMode: enabled })
      if (enabled) {
        await invoke('register_command_mode_shortcut', {
          shortcutStr: newSettings.shortcuts.commandModeShortcut,
        })
      } else {
        await invoke('unregister_command_mode_shortcut')
      }
      storeAnalytics.trackSettingChange('enableCommandMode', enabled)
    } catch (error) {
      console.error('Error toggling command mode:', error)
    }
  },

  setGlobalShortcutsEnabled: async (enabled: boolean) => {
    try {
      const newSettings = {
        ...get().settings,
        shortcuts: { ...get().settings.shortcuts, globalShortcutsEnabled: enabled },
      }
      set({ settings: newSettings })
      await api.updateShortcutsSettings({ globalShortcutsEnabled: enabled })
      if (enabled) {
        await invoke('enable_global_shortcuts')
      } else {
        await invoke('disable_global_shortcuts')
      }
      storeAnalytics.trackSettingChange('globalShortcutsEnabled', enabled)
    } catch (error) {
      console.error('Error toggling global shortcuts:', error)
    }
  },

  setShowInDock: async (enabled: boolean) => {
    try {
      const newSettings = {
        ...get().settings,
        system: { ...get().settings.system, showInDock: enabled },
      }
      set({ settings: newSettings })
      await api.updateSystemSettings({ showInDock: enabled })
      await invoke('set_show_in_dock', { show: enabled })
      storeAnalytics.trackSettingChange('showInDock', enabled)
    } catch (error) {
      console.error('Error toggling show in dock:', error)
    }
  },

  setSaveAudioRecordings: async (enabled: boolean) => {
    try {
      const newSettings = {
        ...get().settings,
        system: { ...get().settings.system, saveAudioRecordings: enabled },
      }
      set({ settings: newSettings })
      await api.updateSystemSettings({ saveAudioRecordings: enabled })
      storeAnalytics.trackSettingChange('saveAudioRecordings', enabled)
    } catch (error) {
      console.error('Error toggling save audio recordings:', error)
    }
  },

  setAutoPaste: async (enabled: boolean) => {
    try {
      const newSettings = {
        ...get().settings,
        transcription: { ...get().settings.transcription, autoPaste: enabled },
      }
      set({ settings: newSettings })
      await api.updateTranscriptionSettings({ autoPaste: enabled })
      storeAnalytics.trackSettingChange('autoPaste', enabled)
    } catch (error) {
      console.error('Error toggling auto-paste:', error)
    }
  },

  setAutoCopyToClipboard: async (enabled: boolean) => {
    try {
      const newSettings = {
        ...get().settings,
        transcription: { ...get().settings.transcription, autoCopyToClipboard: enabled },
      }
      set({ settings: newSettings })
      await api.updateTranscriptionSettings({ autoCopyToClipboard: enabled })
      storeAnalytics.trackSettingChange('autoCopyToClipboard', enabled)
    } catch (error) {
      console.error('Error toggling auto-copy to clipboard:', error)
    }
  },

  setAnalytics: async (enabled: boolean) => {
    try {
      const newSettings = {
        ...get().settings,
        privacy: { ...get().settings.privacy, analytics: enabled },
      }
      set({ settings: newSettings })
      await api.updatePrivacySettings({ analytics: enabled })
      storeAnalytics.trackSettingChange('analytics', enabled)
    } catch (error) {
      console.error('Error toggling analytics:', error)
    }
  },

  resetSettings: async () => {
    try {
      set({ settings: defaultSettings })
      await api.resetSettings()
      storeAnalytics.trackSettingChange('resetSettings', true)
    } catch (error) {
      console.error('Error resetting settings:', error)
    }
  },

  setAiProcessingEnabled: async (enabled: boolean) => {
    try {
      const newSettings = {
        ...get().settings,
        aiProcessing: { ...get().settings.aiProcessing, enabled },
      }
      set({ settings: newSettings })
      await api.updateAiProcessingSettings({ enabled })
      storeAnalytics.trackSettingChange('aiProcessingEnabled', enabled)
    } catch (error) {
      console.error('Error toggling AI processing:', error)
    }
  },

  setSpeechToTextModel: async (modelId: string | null) => {
    try {
      const newSettings = {
        ...get().settings,
        transcription: { ...get().settings.transcription, speechToTextModelId: modelId },
      }
      set({ settings: newSettings })
      await api.updateTranscriptionSettings({ speechToTextModelId: modelId })
      storeAnalytics.trackModelAction('selected', {
        modelId: modelId || 'none',
        modelType: 'stt',
      })
    } catch (error) {
      console.error('Error setting speech-to-text model:', error)
    }
  },

  setPostProcessingModel: async (modelId: string | null) => {
    try {
      const newSettings = {
        ...get().settings,
        aiProcessing: { ...get().settings.aiProcessing, postProcessingModelId: modelId },
      }
      set({ settings: newSettings })
      await api.updateAiProcessingSettings({ postProcessingModelId: modelId })
      storeAnalytics.trackModelAction('selected', {
        modelId: modelId || 'none',
        modelType: 'post-processing',
      })
    } catch (error) {
      console.error('Error setting post-processing model:', error)
    }
  },

  setEnablePushToTalk: async (enabled: boolean) => {
    try {
      const newSettings = {
        ...get().settings,
        voiceInput: { ...get().settings.voiceInput, enablePushToTalk: enabled },
      }
      set({ settings: newSettings })
      await api.updateVoiceInputSettings({ enablePushToTalk: enabled })
      if (enabled) {
        await invoke('register_ptt_shortcut', {
          shortcutStr: newSettings.voiceInput.pushToTalkShortcut,
        })
      } else {
        await invoke('unregister_ptt_shortcut')
      }
      storeAnalytics.trackSettingChange('enablePushToTalk', enabled)
    } catch (error) {
      console.error('Error toggling push-to-talk:', error)
    }
  },

  setPushToTalkShortcut: async (shortcut: string) => {
    try {
      const newSettings = {
        ...get().settings,
        voiceInput: { ...get().settings.voiceInput, pushToTalkShortcut: shortcut },
      }
      set({ settings: newSettings })
      await api.updateVoiceInputSettings({ pushToTalkShortcut: shortcut })
      if (newSettings.voiceInput.enablePushToTalk) {
        await invoke('update_ptt_shortcut', { shortcutStr: shortcut })
      }
      storeAnalytics.trackSettingChange('pushToTalkShortcut', shortcut)
    } catch (error) {
      console.error('Error saving push-to-talk shortcut:', error)
    }
  },

  setTranslateToEnglish: async (enabled: boolean) => {
    try {
      const newSettings = {
        ...get().settings,
        transcription: { ...get().settings.transcription, translateToEnglish: enabled },
      }
      set({ settings: newSettings })
      await api.updateTranscriptionSettings({ translateToEnglish: enabled })
      storeAnalytics.trackSettingChange('translateToEnglish', enabled)
    } catch (error) {
      console.error('Error saving translate to English setting:', error)
    }
  },

  setAutoDetectLanguage: async (enabled: boolean) => {
    try {
      const currentSettings = get().settings
      const newSettings = {
        ...currentSettings,
        transcription: {
          ...currentSettings.transcription,
          autoDetectLanguage: enabled,
          translateToEnglish: enabled ? false : currentSettings.transcription.translateToEnglish,
        },
      }
      set({ settings: newSettings })
      await api.updateTranscriptionSettings({ autoDetectLanguage: enabled })
      await invoke('rebuild_tray_menu_command')
      storeAnalytics.trackSettingChange('autoDetectLanguage', enabled)
    } catch (error) {
      console.error('Error saving auto-detect language setting:', error)
    }
  },
}))

export const initializeSettings = async () => {
  await useSettingsStore.getState().initialize()
}

export const setupSettingsSync = () => {
  listen<Settings>('settings-changed', event => {
    useSettingsStore.setState({ settings: event.payload })
  })
}
