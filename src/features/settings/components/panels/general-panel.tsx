import { AlertTriangle } from 'lucide-react'

import { Switch } from '@/components/ui/switch'
import { useModelsStore } from '@/features/models/store'
import { useAudioDevices } from '@/hooks/use-audio-devices'

import { getLanguageByCode } from '../../data/languages'
import { useSettingsStore } from '../../store'
import { LanguageSelector } from '../language-selector'
import { MicrophoneSelector } from '../microphone-selector'
import { SettingsInfoTooltip } from '../settings-info-tooltip'
import { ThemeSelector } from '../theme-selector'
import { SettingsPanel, SettingItem, SettingsSection } from './settings-panel'

export function GeneralPanel() {
  const {
    settings,
    setEnablePushToTalk,
    setTranslateToEnglish,
    setAutoDetectLanguage,
  } = useSettingsStore()
  const { devices } = useAudioDevices()
  const { models } = useModelsStore()

  const selectedLanguage = getLanguageByCode(settings.transcription.language)
  const languageDescription = settings.transcription.autoDetectLanguage
    ? 'Auto-detect (Whisper will identify the language)'
    : selectedLanguage
      ? `${selectedLanguage.name} (${selectedLanguage.nativeName})`
      : 'English'

  // Check if the selected STT model supports the selected language
  const selectedSttModel = models.find(
    m => m.purpose === 'speech-to-text' && m.isSelected
  )
  const isEnglishOnly = selectedSttModel?.languageSupport === 'english_only'
  const isNonEnglishLanguage = settings.transcription.language !== 'en'
  const isAutoDetect = settings.transcription.autoDetectLanguage
  const hasLanguageCompatibilityIssue =
    isEnglishOnly && isNonEnglishLanguage && !isAutoDetect

  // Get the currently selected microphone name for description
  const selectedDeviceId = settings.voiceInput.microphoneDeviceId
  const selectedDevice = selectedDeviceId
    ? devices.find(d => d.deviceId === selectedDeviceId)
    : null
  const defaultDevice = devices.find(d => d.isDefault || d.isRecommended)
  const microphoneDescription = selectedDevice
    ? `Currently using: ${selectedDevice.label || `Microphone ${selectedDevice.deviceId.substring(0, 8)}`}`
    : defaultDevice
      ? `Currently using: Auto-detect (${defaultDevice.label})`
      : 'Select your preferred microphone device'

  return (
    <SettingsPanel
      title="General"
      description="Manage your general application preferences"
    >
      <SettingsSection>
        <SettingItem
          title="Microphone"
          description={microphoneDescription}
          action={<MicrophoneSelector />}
        />

        <SettingItem
          title="Enable Push-to-Talk"
          description={
            settings.voiceInput.enablePushToTalk
              ? 'Hold shortcut to record, release to stop'
              : 'Toggle mode is always active - click shortcut to start/stop'
          }
          action={
            <Switch
              checked={settings.voiceInput.enablePushToTalk}
              onCheckedChange={setEnablePushToTalk}
            />
          }
          info={
            <SettingsInfoTooltip content="Push-to-Talk: Hold the shortcut key to record, release to stop. Toggle mode: Press once to start, press again to stop. Use Push-to-Talk for quick, hands-on recording." />
          }
        />

        <SettingItem
          title="Transcription language"
          description={languageDescription}
          action={<LanguageSelector disabled={isAutoDetect} />}
          disabled={isAutoDetect}
          info={
            <SettingsInfoTooltip content="Select the language you'll be speaking. Make sure your speech-to-text model supports multiple languages if you want to use non-English languages." />
          }
        />

        <SettingItem
          title="Auto-detect language"
          description={
            isEnglishOnly
              ? 'Requires a multilingual model'
              : 'Automatically identify the spoken language'
          }
          action={
            <Switch
              checked={settings.transcription.autoDetectLanguage}
              onCheckedChange={setAutoDetectLanguage}
              disabled={isEnglishOnly}
            />
          }
          disabled={isEnglishOnly}
          info={
            <SettingsInfoTooltip content="Let the app automatically detect which language you're speaking. This requires a multilingual speech-to-text model - check the Models page to see which models support multiple languages." />
          }
        />

        <SettingItem
          title="Translate to English"
          description={
            isAutoDetect
              ? 'Disabled when auto-detect is enabled'
              : !isNonEnglishLanguage
                ? 'Select a non-English language to enable'
                : isEnglishOnly
                  ? 'Requires a multilingual model'
                  : 'Transcribe in your language and output English text'
          }
          action={
            <Switch
              checked={settings.transcription.translateToEnglish}
              onCheckedChange={setTranslateToEnglish}
              disabled={isEnglishOnly || !isNonEnglishLanguage || isAutoDetect}
            />
          }
          disabled={isEnglishOnly || !isNonEnglishLanguage || isAutoDetect}
          info={
            <SettingsInfoTooltip content="Speak in any supported language and get English text as output. Great for multilingual users who want their transcriptions in English. Note: This only translates TO English, not from English to other languages." />
          }
        />

        {isEnglishOnly && settings.transcription.translateToEnglish && (
          <div className="flex items-start gap-2 rounded-md border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm">
            <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-500">
                Translation requires a multilingual model
              </p>
              <p className="text-muted-foreground mt-1">
                Your current model ({selectedSttModel?.name}) only supports
                English. Please select a multilingual model like Whisper Base,
                Small, Medium, or Large for translation.
              </p>
            </div>
          </div>
        )}

        {hasLanguageCompatibilityIssue && (
          <div className="flex items-start gap-2 rounded-md border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm">
            <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-500">
                Model not compatible with {selectedLanguage?.name}
              </p>
              <p className="text-muted-foreground mt-1">
                Your current model ({selectedSttModel?.name}) only supports
                English. Please select a multilingual model like Whisper Base,
                Small, Medium, or Large for {selectedLanguage?.name}{' '}
                transcription.
              </p>
            </div>
          </div>
        )}

        <SettingItem
          title="Theme"
          description="Choose your preferred color theme"
          action={<ThemeSelector />}
        />
      </SettingsSection>
    </SettingsPanel>
  )
}
