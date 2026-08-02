import { invoke } from '@tauri-apps/api/core'

import type { Settings } from './schema'

export async function getSettings(): Promise<Settings> {
  return invoke<Settings>('get_settings')
}

export async function saveSettings(settings: Settings): Promise<void> {
  return invoke('save_settings', { settings })
}

export async function updateOnboarding(completed: boolean): Promise<void> {
  return invoke('update_onboarding', { completed })
}

export async function updateVoiceInputSettings(params: {
  shortcut?: string
  microphoneDeviceId?: string | null
  enablePushToTalk?: boolean
  pushToTalkShortcut?: string
  displayMode?: string
}): Promise<void> {
  return invoke('update_voice_input_settings', params)
}

export async function updateTranscriptionSettings(params: {
  language?: string
  autoPaste?: boolean
  autoCopyToClipboard?: boolean
  speechToTextModelId?: string | null
  translateToEnglish?: boolean
  autoDetectLanguage?: boolean
}): Promise<void> {
  return invoke('update_transcription_settings', params)
}

export async function updateShortcutsSettings(params: {
  pasteLastTranscript?: string
  globalShortcutsEnabled?: boolean
  enableCommandMode?: boolean
  commandModeShortcut?: string
}): Promise<void> {
  return invoke('update_shortcuts_settings', params)
}

export async function updateSystemSettings(params: {
  showInDock?: boolean
  saveAudioRecordings?: boolean
  playSoundOnRecording?: boolean
}): Promise<void> {
  return invoke('update_system_settings', params)
}

export async function updatePrivacySettings(params: {
  analytics?: boolean
}): Promise<void> {
  return invoke('update_privacy_settings', params)
}

export async function resetSettings(): Promise<void> {
  return invoke('reset_settings')
}
